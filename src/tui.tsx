import { Plugin } from "@opencode/plugin/tui"
import { createSignal, Show } from "solid-js"
import { AskPanel, PANEL } from "./panel"
import { buildPrompt, EMPTY_ANSWER, errorMessage, type Exchange, type State, type Status } from "./thread"

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export default Plugin.define({
  id: "opencode-ask",
  setup(context) {
    // Memory storage outlives plugin reloads but not the TUI, so threads never touch disk or the session.
    const [state, update] = context.storage.memory<State>("state", { initial: { nextID: 1, threads: {} } })
    const queues = new Map<string, Promise<void>>()
    // In-flight requests and the session each one belongs to, so closing a thread can cancel its own.
    const requests = new Map<AbortController, string>()
    const [frame, setFrame] = createSignal(0)
    let ticker: ReturnType<typeof setInterval> | undefined
    let disposed = false

    const thread = (sessionID: string): readonly Exchange[] => state.threads[sessionID] ?? []
    const exists = (sessionID: string, id: number) => thread(sessionID).some((item) => item.id === id)
    const waiting = (sessionID?: string) =>
      Object.entries(state.threads).some(
        ([id, exchanges]) =>
          (sessionID === undefined || id === sessionID) && exchanges.some((item) => item.status === "waiting"),
      )

    const tick = () => {
      if (waiting() && !ticker) ticker = setInterval(() => setFrame((value) => (value + 1) % SPINNER.length), 80)
      if (!waiting() && ticker) {
        clearInterval(ticker)
        ticker = undefined
      }
    }

    const settle = (sessionID: string, id: number, status: Status, answer: string) =>
      update((draft) => {
        const exchange = draft.threads[sessionID]?.find((item) => item.id === id)
        if (!exchange) return
        exchange.status = status
        exchange.answer = answer
      })

    const cancelWaiting = (answer: string) =>
      update((draft) => {
        for (const exchanges of Object.values(draft.threads)) {
          for (const exchange of exchanges) {
            if (exchange.status !== "waiting") continue
            exchange.status = "failed"
            exchange.answer = answer
          }
        }
      })

    // Anything still waiting belongs to a previous plugin load that can no longer answer it.
    cancelWaiting("Cancelled because the plugin reloaded.")

    const notify = (sessionID: string, status: Status) => {
      const open = context.ui.panel.current()
      if (open?.name === PANEL && open.sessionID === sessionID) return
      context.ui.toast.show(
        status === "done"
          ? { title: "Ask", message: "Your answer is ready. Press shift+→ to read it.", variant: "info", sessionID }
          : { title: "Ask", message: "Your side question failed. Press shift+→ to see why.", variant: "error", sessionID },
      )
    }

    // Closing a side conversation forgets it entirely and cancels anything still being answered.
    const discard = (sessionID: string) => {
      for (const [request, owner] of requests) if (owner === sessionID) request.abort()
      update((draft) => {
        delete draft.threads[sessionID]
      })
      tick()
    }

    async function answer(sessionID: string, id: number, question: string) {
      if (disposed || !exists(sessionID, id)) return
      const earlier = thread(sessionID).filter((item) => item.id < id)
      const request = new AbortController()
      requests.set(request, sessionID)
      let status: Status = "failed"
      let text: string
      try {
        const response = await context.client.session.generate(
          { sessionID, prompt: buildPrompt(earlier, question) },
          { signal: request.signal },
        )
        text = response.text.trim()
        if (text) status = "done"
        else text = EMPTY_ANSWER
      } catch (error) {
        text = errorMessage(error)
      } finally {
        requests.delete(request)
      }
      if (disposed || !exists(sessionID, id)) return
      settle(sessionID, id, status, text)
      tick()
      notify(sessionID, status)
    }

    function ask(sessionID: string, question: string) {
      const id = state.nextID
      update((draft) => {
        draft.nextID = id + 1
        ;(draft.threads[sessionID] ??= []).push({ id, question, status: "waiting", answer: "" })
      })
      tick()
      // One question at a time per session, so each answer can see the ones before it.
      const next = (queues.get(sessionID) ?? Promise.resolve()).then(() => answer(sessionID, id, question))
      queues.set(sessionID, next)
      void next.finally(() => {
        if (queues.get(sessionID) === next) queues.delete(sessionID)
      })
    }

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "opencode-ask.open",
          title: "Ask a side question",
          description: "Ask about this session in a full-screen panel without adding to the conversation",
          group: "Session",
          palette: true,
          slash: { name: "ask", arguments: true },
          run(input) {
            const route = context.ui.router.current()
            if (route.type !== "session") {
              context.ui.toast.show({ message: "Open a session first", variant: "warning" })
              return
            }
            const question = input?.trim()
            if (question) ask(route.sessionID, question)
            context.ui.panel.open(PANEL, { presentation: "fullscreen" })
          },
        },
      ],
    }))

    // From the main conversation, shift+→ switches to this session's side conversation.
    context.keymap.layer(() => ({
      priority: 10,
      commands: [
        {
          bind: "shift+right",
          title: "Switch to the side conversation",
          run: () => {
            const route = context.ui.router.current()
            if (route.type !== "session" || context.ui.panel.current()) return false
            if (thread(route.sessionID).length === 0) return false
            // With text in the prompt, shift+→ keeps selecting text as usual.
            if (context.renderer.currentFocusedEditor?.plainText) return false
            context.ui.panel.open(PANEL, { presentation: "fullscreen" })
          },
        },
      ],
    }))

    context.ui.slot({
      append: "session.panel",
      render: (panel) => (
        <Show when={panel.name === PANEL}>
          <AskPanel
            context={context}
            panel={panel}
            thread={thread(panel.sessionID)}
            spinner={SPINNER[frame()] ?? ""}
            onAsk={(question) => ask(panel.sessionID, question)}
            onDiscard={() => discard(panel.sessionID)}
          />
        </Show>
      ),
    })

    context.ui.slot({
      append: "prompt.footer.status",
      render: (footer) => (
        <Show when={footer.sessionID !== undefined && thread(footer.sessionID).length > 0}>
          <text fg={context.theme.text.muted} flexShrink={0}>
            {waiting(footer.sessionID) ? `${SPINNER[frame()] ?? ""} ask` : "shift+→ for ask"}
          </text>
        </Show>
      ),
    })

    return () => {
      disposed = true
      for (const request of requests.keys()) request.abort()
      if (ticker) clearInterval(ticker)
      cancelWaiting("Cancelled because the plugin reloaded.")
    }
  },
})

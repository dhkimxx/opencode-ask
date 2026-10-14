import { TextAttributes, type InputRenderable, type ScrollBoxRenderable, type SyntaxStyle } from "@opentui/core"
import type { Context, PanelInput } from "@opencode/plugin/tui/context"
import { createEffect, createMemo, createSignal, For, Match, on, onCleanup, onMount, Show, Switch } from "solid-js"
import { syntaxStyle } from "./syntax"
import type { Exchange } from "./thread"

export const PANEL = "opencode-ask.thread"

// The left bar OpenCode draws beside your own messages in the main transcript.
const QUESTION_BORDER = {
  topLeft: "",
  topRight: "",
  bottomLeft: "",
  bottomRight: "",
  horizontal: " ",
  vertical: "┃",
  topT: "",
  bottomT: "",
  leftT: "",
  rightT: "",
  cross: "",
}

export function AskPanel(props: {
  context: Context
  panel: PanelInput
  thread: readonly Exchange[]
  spinner: string
  onAsk: (question: string) => void
  onDiscard: () => void
}) {
  const context = props.context
  const theme = () => context.theme
  // The host draws side panels on a raised surface and full-screen panels on the base one.
  const surface = () =>
    props.panel.presentation === "panel" ? theme().background.raised.base : theme().background.base
  const raised = () =>
    props.panel.presentation === "panel" ? theme().background.raised.high : theme().background.raised.base

  let input: InputRenderable | undefined
  let scroll: ScrollBoxRenderable | undefined

  // Rebuilt when the theme changes; a replaced style is freed once the renderer stops using it.
  const release = (style: SyntaxStyle) => {
    void context.renderer
      .idle()
      .catch(() => {})
      .finally(() => style.destroy())
  }
  const syntax = createMemo((previous: SyntaxStyle | undefined) => {
    const next = syntaxStyle(theme())
    if (previous) release(previous)
    return next
  })
  onCleanup(() => release(syntax()))

  // Wait a moment so the new rows are laid out before measuring the scroll height.
  const toBottom = () =>
    setTimeout(() => {
      if (!scroll || scroll.isDestroyed) return
      scroll.stickyScroll = true
      scroll.scrollTo(scroll.scrollHeight)
    }, 50)
  onMount(toBottom)
  createEffect(on(() => props.thread.length, toBottom, { defer: true }))

  // The host focuses the panel container after mounting, so take focus back on the next tick.
  const focusInput = () =>
    setTimeout(() => {
      if (input && !input.isDestroyed) input.focus()
    }, 1)
  onMount(focusInput)
  createEffect(on(() => props.panel.focused, (focused) => focused && focusInput(), { defer: true }))

  const page = () => Math.max(1, (scroll?.viewport.height ?? 10) - 2)
  const typing = () => input !== undefined && input.value !== ""

  // Switching keeps the side conversation for shift+→; closing forgets it.
  const close = () => {
    props.panel.close()
    props.onDiscard()
  }

  context.keymap.layer(() => ({
    priority: 10,
    commands: [
      { bind: "escape", title: "Close the side conversation", run: close },
      {
        // Ctrl+C would otherwise quit OpenCode, because the main prompt is hidden behind the panel.
        bind: "ctrl+c",
        title: "Clear input or close the side conversation",
        run: () => {
          if (!typing()) return close()
          if (input) input.value = ""
        },
      },
      {
        // With text in the input, shift+← keeps selecting text as usual.
        bind: "shift+left",
        title: "Switch to the main conversation",
        run: () => {
          if (typing()) return false
          props.panel.close()
        },
      },
      { bind: "up", title: "Scroll up", run: () => scroll?.scrollBy(-1) },
      { bind: "down", title: "Scroll down", run: () => scroll?.scrollBy(1) },
      { bind: "pageup", title: "Page up", run: () => scroll?.scrollBy(-page()) },
      { bind: "pagedown", title: "Page down", run: () => scroll?.scrollBy(page()) },
    ],
  }))

  // Like Codex, say what the main conversation is doing while it is out of view.
  const [mainWasBusy, setMainWasBusy] = createSignal(false)
  const mainStatus = () => {
    const sessionID = props.panel.sessionID
    if ((context.data.session.permission.list(sessionID)?.length ?? 0) > 0) return "main needs approval"
    if ((context.data.session.form.list(sessionID)?.length ?? 0) > 0) return "main needs input"
    if (context.data.session.status(sessionID) === "running") return "main working"
    if (mainWasBusy()) return "main finished"
  }
  createEffect(() => {
    if (context.data.session.status(props.panel.sessionID) === "running") setMainWasBusy(true)
  })
  const footer = () => [mainStatus(), "shift+← to switch", "esc to close"].filter(Boolean).join(" · ")

  const submit = () => {
    const question = input?.value.trim()
    if (!input || !question) return
    input.value = ""
    props.onAsk(question)
  }

  return (
    <box
      flexGrow={1}
      minHeight={0}
      flexDirection="column"
      gap={1}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      backgroundColor={surface()}
      onMouseUp={focusInput}
    >
      <text fg={theme().text.base} attributes={TextAttributes.BOLD} flexShrink={0}>
        Ask
      </text>
      <scrollbox
        ref={(value: ScrollBoxRenderable) => (scroll = value)}
        flexGrow={1}
        minHeight={0}
        stickyScroll
        stickyStart="bottom"
        scrollbarOptions={{ visible: false }}
      >
        <Show when={props.thread.length === 0}>
          <text fg={theme().text.muted} wrapMode="word">
            Ask anything about this session. Answers come from the conversation so far, and nothing you ask here is
            added to it.
          </text>
        </Show>
        <For each={props.thread}>
          {(exchange) => (
            <box flexDirection="column" flexShrink={0} paddingBottom={1}>
              <box
                border={["left"]}
                borderColor={theme().hue.accent[200]}
                customBorderChars={QUESTION_BORDER}
                backgroundColor={raised()}
                flexShrink={0}
              >
                <box paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={1} flexShrink={0}>
                  <text fg={theme().text.base} wrapMode="word">
                    {exchange.question}
                  </text>
                </box>
              </box>
              <box paddingTop={1} paddingLeft={3} flexShrink={0}>
                <Switch>
                  <Match when={exchange.status === "waiting"}>
                    <text fg={theme().text.muted}>{`${props.spinner} Thinking…`}</text>
                  </Match>
                  <Match when={exchange.status === "failed"}>
                    <text fg={theme().text.feedback.error.base} wrapMode="word">
                      {exchange.answer}
                    </text>
                  </Match>
                  <Match when={exchange.status === "done"}>
                    <markdown
                      content={exchange.answer}
                      syntaxStyle={syntax()}
                      conceal
                      fg={theme().markdown.text}
                      bg={surface()}
                    />
                  </Match>
                </Switch>
              </box>
            </box>
          )}
        </For>
      </scrollbox>
      <box flexDirection="row" flexShrink={0} gap={1} paddingLeft={1} paddingRight={1} backgroundColor={raised()}>
        <text fg={theme().text.muted} flexShrink={0}>
          ›
        </text>
        <input
          ref={(value: InputRenderable) => (input = value)}
          flexGrow={1}
          onSubmit={submit}
          placeholder={props.thread.length > 0 ? "Ask a follow-up" : "Ask about this session"}
          placeholderColor={theme().text.muted}
          textColor={theme().text.base}
          focusedTextColor={theme().text.base}
          cursorColor={theme().text.base}
          backgroundColor={raised()}
          focusedBackgroundColor={raised()}
        />
      </box>
      <text fg={theme().text.muted} flexShrink={0}>
        {footer()}
      </text>
    </box>
  )
}

import { TextAttributes, type InputRenderable, type ScrollBoxRenderable, type SyntaxStyle } from "@opentui/core"
import type { Context, PanelInput } from "@opencode/plugin/tui/context"
import { createEffect, createMemo, createSignal, Match, on, onCleanup, onMount, Show, Switch, type Accessor } from "solid-js"
import { syntaxStyle } from "./syntax"
import type { Exchange } from "./thread"

export const PANEL = "opencode-ask.thread"

export function AskPanel(props: {
  context: Context
  panel: PanelInput
  thread: readonly Exchange[]
  spinner: string
  onAsk: (question: string) => void
}) {
  const context = props.context
  const theme = () => context.theme
  // The host draws side panels on a raised surface and full-screen panels on the base one.
  const surface = () =>
    props.panel.presentation === "panel" ? theme().background.raised.base : theme().background.base
  const field = () =>
    props.panel.presentation === "panel" ? theme().background.raised.high : theme().background.raised.base

  const [index, setIndex] = createSignal(Math.max(0, props.thread.length - 1))
  const current = () => props.thread[index()]
  let input: InputRenderable | undefined
  let scroll: ScrollBoxRenderable | undefined

  // A new question always brings its answer into view.
  createEffect(on(() => props.thread.length, (length) => setIndex(Math.max(0, length - 1)), { defer: true }))
  createEffect(on(index, () => scroll?.scrollTo(0), { defer: true }))

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

  // The host focuses the panel container after mounting, so take focus back on the next tick.
  const focusInput = () =>
    setTimeout(() => {
      if (input && !input.isDestroyed) input.focus()
    }, 1)
  onMount(focusInput)
  createEffect(on(() => props.panel.focused, (focused) => focused && focusInput(), { defer: true }))

  const browse = (step: number) => {
    // With text in the input, shift+arrows keep selecting text as usual.
    if (input && input.value !== "") return false
    const next = index() + step
    if (next >= 0 && next < props.thread.length) setIndex(next)
  }
  const page = () => Math.max(1, (scroll?.viewport.height ?? 10) - 2)

  context.keymap.layer(() => ({
    priority: 10,
    commands: [
      { bind: "escape", title: "Close", run: () => props.panel.close() },
      {
        // Ctrl+C would otherwise quit OpenCode, because the main prompt is hidden behind the panel.
        bind: "ctrl+c",
        title: "Clear input or close",
        run: () => {
          if (input && input.value !== "") {
            input.value = ""
            return
          }
          props.panel.close()
        },
      },
      { bind: "shift+left", title: "Previous question", run: () => browse(-1) },
      { bind: "shift+right", title: "Next question", run: () => browse(1) },
      { bind: "up", title: "Scroll up", run: () => scroll?.scrollBy(-1) },
      { bind: "down", title: "Scroll down", run: () => scroll?.scrollBy(1) },
      { bind: "pageup", title: "Page up", run: () => scroll?.scrollBy(-page()) },
      { bind: "pagedown", title: "Page down", run: () => scroll?.scrollBy(page()) },
    ],
  }))

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
      <box flexDirection="row" flexShrink={0} gap={2}>
        <text fg={theme().text.base} attributes={TextAttributes.BOLD}>
          Ask
        </text>
        <Show when={props.thread.length > 1}>
          <text fg={theme().text.muted}>{`${index() + 1}/${props.thread.length}`}</text>
        </Show>
      </box>
      <Show
        when={current()}
        fallback={
          <box flexGrow={1}>
            <text fg={theme().text.muted} wrapMode="word">
              Ask anything about this session. Answers come from the conversation so far, and nothing you ask here is
              added to it.
            </text>
          </box>
        }
      >
        {(exchange: Accessor<Exchange>) => (
          <>
            <text fg={theme().text.base} attributes={TextAttributes.BOLD} wrapMode="word" flexShrink={0}>
              {exchange().question}
            </text>
            <scrollbox
              ref={(value: ScrollBoxRenderable) => (scroll = value)}
              flexGrow={1}
              minHeight={0}
              scrollbarOptions={{ visible: false }}
            >
              <Switch>
                <Match when={exchange().status === "waiting"}>
                  <text fg={theme().text.muted}>{`${props.spinner} Thinking…`}</text>
                </Match>
                <Match when={exchange().status === "failed"}>
                  <text fg={theme().text.feedback.error.base} wrapMode="word">
                    {exchange().answer}
                  </text>
                </Match>
                <Match when={exchange().status === "done"}>
                  <markdown
                    content={exchange().answer}
                    syntaxStyle={syntax()}
                    conceal
                    fg={theme().markdown.text}
                    bg={surface()}
                  />
                </Match>
              </Switch>
            </scrollbox>
          </>
        )}
      </Show>
      <box flexDirection="row" flexShrink={0} gap={1} paddingLeft={1} paddingRight={1} backgroundColor={field()}>
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
          backgroundColor={field()}
          focusedBackgroundColor={field()}
        />
      </box>
      <text fg={theme().text.muted} flexShrink={0}>
        enter send · shift+←/→ browse · ↑/↓ scroll · esc close
      </text>
    </box>
  )
}

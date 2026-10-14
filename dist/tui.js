// @bun
// src/tui.tsx
import { effect as _$effect2 } from "@opentui/solid";
import { insert as _$insert2 } from "@opentui/solid";
import { setProp as _$setProp2 } from "@opentui/solid";
import { createElement as _$createElement2 } from "@opentui/solid";
import { createComponent as _$createComponent2 } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { Plugin } from "@opencode/plugin/tui";
import { createSignal as createSignal2, Show as Show2 } from "solid-js";

// src/panel.tsx
import { insert as _$insert } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";
import { createEffect, createMemo, createSignal, For, Match, on, onCleanup, onMount, Show, Switch } from "solid-js";

// src/syntax.ts
import { SyntaxStyle } from "@opentui/core";
function rule(scope, foreground, style = {}) {
  return { scope, style: { foreground, ...style } };
}
function syntaxStyle(theme) {
  const { syntax, markdown } = theme;
  const feedback = theme.text.feedback;
  return SyntaxStyle.fromTheme([
    rule(["default"], theme.text.base),
    rule(["comment", "comment.documentation"], syntax.comment, { italic: true }),
    rule(["string", "symbol", "character", "character.special"], syntax.string),
    rule(["number", "boolean", "constant", "float"], syntax.number),
    rule(["keyword", "keyword.return", "keyword.conditional", "keyword.repeat"], syntax.keyword, { italic: true }),
    rule(["keyword.import", "keyword.export", "string.escape", "string.regexp", "tag.attribute"], syntax.keyword),
    rule(["keyword.type"], syntax.type, { bold: true, italic: true }),
    rule(["operator", "keyword.operator", "punctuation.delimiter", "punctuation.special"], syntax.operator),
    rule(["variable", "variable.parameter", "property", "parameter", "field"], syntax.variable),
    rule(["function", "function.call", "function.method", "function.method.call", "constructor"], syntax.function),
    rule(["type", "type.definition", "module", "class", "namespace"], syntax.type),
    rule(["punctuation", "punctuation.bracket"], syntax.punctuation),
    rule(["variable.builtin", "type.builtin", "function.builtin", "constant.builtin", "tag"], feedback.error.base),
    rule(["markup.heading", "markup.heading.2", "markup.heading.3", "markup.heading.4", "markup.heading.5", "markup.heading.6"], markdown.heading, { bold: true }),
    rule(["markup.heading.1"], markdown.heading, { bold: true, underline: true }),
    rule(["markup.bold", "markup.strong"], markdown.strong, { bold: true }),
    rule(["markup.italic"], markdown.emphasis, { italic: true }),
    rule(["markup.list"], markdown.listItem),
    rule(["markup.quote"], markdown.blockQuote, { italic: true }),
    rule(["markup.raw", "markup.raw.block"], markdown.code),
    rule(["markup.raw.inline"], markdown.code, { background: theme.background.base }),
    rule(["markup.link", "markup.link.url", "string.special", "string.special.url"], markdown.link, { underline: true }),
    rule(["markup.link.label", "label"], markdown.linkText, { underline: true }),
    rule(["markup.strikethrough", "markup.list.unchecked"], theme.text.muted),
    rule(["markup.list.checked"], feedback.success.base),
    rule(["diff.plus"], theme.diff.text.added, { background: theme.diff.background.added }),
    rule(["diff.minus"], theme.diff.text.removed, { background: theme.diff.background.removed })
  ]);
}

// src/panel.tsx
var PANEL = "opencode-ask.thread";
var QUESTION_BORDER = {
  topLeft: "",
  topRight: "",
  bottomLeft: "",
  bottomRight: "",
  horizontal: " ",
  vertical: "\u2503",
  topT: "",
  bottomT: "",
  leftT: "",
  rightT: "",
  cross: ""
};
function AskPanel(props) {
  const context = props.context;
  const theme = () => context.theme;
  const surface = () => props.panel.presentation === "panel" ? theme().background.raised.base : theme().background.base;
  const raised = () => props.panel.presentation === "panel" ? theme().background.raised.high : theme().background.raised.base;
  let input;
  let scroll;
  const release = (style) => {
    context.renderer.idle().catch(() => {}).finally(() => style.destroy());
  };
  const syntax = createMemo((previous) => {
    const next = syntaxStyle(theme());
    if (previous)
      release(previous);
    return next;
  });
  onCleanup(() => release(syntax()));
  const toBottom = () => setTimeout(() => {
    if (!scroll || scroll.isDestroyed)
      return;
    scroll.stickyScroll = true;
    scroll.scrollTo(scroll.scrollHeight);
  }, 50);
  onMount(toBottom);
  createEffect(on(() => props.thread.length, toBottom, {
    defer: true
  }));
  const focusInput = () => setTimeout(() => {
    if (input && !input.isDestroyed)
      input.focus();
  }, 1);
  onMount(focusInput);
  createEffect(on(() => props.panel.focused, (focused) => focused && focusInput(), {
    defer: true
  }));
  const page = () => Math.max(1, (scroll?.viewport.height ?? 10) - 2);
  const typing = () => input !== undefined && input.value !== "";
  const close = () => {
    props.panel.close();
    props.onDiscard();
  };
  context.keymap.layer(() => ({
    priority: 10,
    commands: [{
      bind: "escape",
      title: "Close the side conversation",
      run: close
    }, {
      bind: "ctrl+c",
      title: "Clear input or close the side conversation",
      run: () => {
        if (!typing())
          return close();
        if (input)
          input.value = "";
      }
    }, {
      bind: "shift+left",
      title: "Switch to the main conversation",
      run: () => {
        if (typing())
          return false;
        props.panel.close();
      }
    }, {
      bind: "up",
      title: "Scroll up",
      run: () => scroll?.scrollBy(-1)
    }, {
      bind: "down",
      title: "Scroll down",
      run: () => scroll?.scrollBy(1)
    }, {
      bind: "pageup",
      title: "Page up",
      run: () => scroll?.scrollBy(-page())
    }, {
      bind: "pagedown",
      title: "Page down",
      run: () => scroll?.scrollBy(page())
    }]
  }));
  const [mainWasBusy, setMainWasBusy] = createSignal(false);
  const mainStatus = () => {
    const sessionID = props.panel.sessionID;
    if ((context.data.session.permission.list(sessionID)?.length ?? 0) > 0)
      return "main needs approval";
    if ((context.data.session.form.list(sessionID)?.length ?? 0) > 0)
      return "main needs input";
    if (context.data.session.status(sessionID) === "running")
      return "main working";
    if (mainWasBusy())
      return "main finished";
  };
  createEffect(() => {
    if (context.data.session.status(props.panel.sessionID) === "running")
      setMainWasBusy(true);
  });
  const footer = () => [mainStatus(), "shift+\u2190 to switch", "esc to close"].filter(Boolean).join(" \xB7 ");
  const submit = () => {
    const question = input?.value.trim();
    if (!input || !question)
      return;
    input.value = "";
    props.onAsk(question);
  };
  return (() => {
    var _el$ = _$createElement("box"), _el$2 = _$createElement("text"), _el$4 = _$createElement("scrollbox"), _el$7 = _$createElement("box"), _el$8 = _$createElement("text"), _el$0 = _$createElement("input"), _el$1 = _$createElement("text");
    _$insertNode(_el$, _el$2);
    _$insertNode(_el$, _el$4);
    _$insertNode(_el$, _el$7);
    _$insertNode(_el$, _el$1);
    _$setProp(_el$, "flexGrow", 1);
    _$setProp(_el$, "minHeight", 0);
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "gap", 1);
    _$setProp(_el$, "paddingTop", 1);
    _$setProp(_el$, "paddingBottom", 1);
    _$setProp(_el$, "paddingLeft", 2);
    _$setProp(_el$, "paddingRight", 2);
    _$setProp(_el$, "onMouseUp", focusInput);
    _$insertNode(_el$2, _$createTextNode(`Ask`));
    _$setProp(_el$2, "flexShrink", 0);
    _$use((value) => scroll = value, _el$4);
    _$setProp(_el$4, "flexGrow", 1);
    _$setProp(_el$4, "minHeight", 0);
    _$setProp(_el$4, "stickyScroll", true);
    _$setProp(_el$4, "stickyStart", "bottom");
    _$setProp(_el$4, "scrollbarOptions", {
      visible: false
    });
    _$insert(_el$4, _$createComponent(Show, {
      get when() {
        return props.thread.length === 0;
      },
      get children() {
        var _el$5 = _$createElement("text");
        _$insertNode(_el$5, _$createTextNode(`Ask anything about this session. Answers come from the conversation so far, and nothing you ask here is added to it.`));
        _$setProp(_el$5, "wrapMode", "word");
        _$effect((_$p) => _$setProp(_el$5, "fg", theme().text.muted, _$p));
        return _el$5;
      }
    }), null);
    _$insert(_el$4, _$createComponent(For, {
      get each() {
        return props.thread;
      },
      children: (exchange) => (() => {
        var _el$10 = _$createElement("box"), _el$11 = _$createElement("box"), _el$12 = _$createElement("box"), _el$13 = _$createElement("text"), _el$14 = _$createElement("box");
        _$insertNode(_el$10, _el$11);
        _$insertNode(_el$10, _el$14);
        _$setProp(_el$10, "flexDirection", "column");
        _$setProp(_el$10, "flexShrink", 0);
        _$setProp(_el$10, "paddingBottom", 1);
        _$insertNode(_el$11, _el$12);
        _$setProp(_el$11, "border", ["left"]);
        _$setProp(_el$11, "customBorderChars", QUESTION_BORDER);
        _$setProp(_el$11, "flexShrink", 0);
        _$insertNode(_el$12, _el$13);
        _$setProp(_el$12, "paddingTop", 1);
        _$setProp(_el$12, "paddingBottom", 1);
        _$setProp(_el$12, "paddingLeft", 2);
        _$setProp(_el$12, "paddingRight", 1);
        _$setProp(_el$12, "flexShrink", 0);
        _$setProp(_el$13, "wrapMode", "word");
        _$insert(_el$13, () => exchange.question);
        _$setProp(_el$14, "paddingTop", 1);
        _$setProp(_el$14, "paddingLeft", 3);
        _$setProp(_el$14, "flexShrink", 0);
        _$insert(_el$14, _$createComponent(Switch, {
          get children() {
            return [_$createComponent(Match, {
              get when() {
                return exchange.status === "waiting";
              },
              get children() {
                var _el$15 = _$createElement("text");
                _$insert(_el$15, () => `${props.spinner} Thinking\u2026`);
                _$effect((_$p) => _$setProp(_el$15, "fg", theme().text.muted, _$p));
                return _el$15;
              }
            }), _$createComponent(Match, {
              get when() {
                return exchange.status === "failed";
              },
              get children() {
                var _el$16 = _$createElement("text");
                _$setProp(_el$16, "wrapMode", "word");
                _$insert(_el$16, () => exchange.answer);
                _$effect((_$p) => _$setProp(_el$16, "fg", theme().text.feedback.error.base, _$p));
                return _el$16;
              }
            }), _$createComponent(Match, {
              get when() {
                return exchange.status === "done";
              },
              get children() {
                var _el$17 = _$createElement("markdown");
                _$setProp(_el$17, "conceal", true);
                _$effect((_p$) => {
                  var _v$12 = exchange.answer, _v$13 = syntax(), _v$14 = theme().markdown.text, _v$15 = surface();
                  _v$12 !== _p$.e && (_p$.e = _$setProp(_el$17, "content", _v$12, _p$.e));
                  _v$13 !== _p$.t && (_p$.t = _$setProp(_el$17, "syntaxStyle", _v$13, _p$.t));
                  _v$14 !== _p$.a && (_p$.a = _$setProp(_el$17, "fg", _v$14, _p$.a));
                  _v$15 !== _p$.o && (_p$.o = _$setProp(_el$17, "bg", _v$15, _p$.o));
                  return _p$;
                }, {
                  e: undefined,
                  t: undefined,
                  a: undefined,
                  o: undefined
                });
                return _el$17;
              }
            })];
          }
        }));
        _$effect((_p$) => {
          var _v$16 = theme().hue.accent[200], _v$17 = raised(), _v$18 = theme().text.base;
          _v$16 !== _p$.e && (_p$.e = _$setProp(_el$11, "borderColor", _v$16, _p$.e));
          _v$17 !== _p$.t && (_p$.t = _$setProp(_el$11, "backgroundColor", _v$17, _p$.t));
          _v$18 !== _p$.a && (_p$.a = _$setProp(_el$13, "fg", _v$18, _p$.a));
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined
        });
        return _el$10;
      })()
    }), null);
    _$insertNode(_el$7, _el$8);
    _$insertNode(_el$7, _el$0);
    _$setProp(_el$7, "flexDirection", "row");
    _$setProp(_el$7, "flexShrink", 0);
    _$setProp(_el$7, "gap", 1);
    _$setProp(_el$7, "paddingLeft", 1);
    _$setProp(_el$7, "paddingRight", 1);
    _$insertNode(_el$8, _$createTextNode(`\u203A`));
    _$setProp(_el$8, "flexShrink", 0);
    _$use((value) => input = value, _el$0);
    _$setProp(_el$0, "flexGrow", 1);
    _$setProp(_el$0, "onSubmit", submit);
    _$setProp(_el$1, "flexShrink", 0);
    _$insert(_el$1, footer);
    _$effect((_p$) => {
      var _v$ = surface(), _v$2 = theme().text.base, _v$3 = TextAttributes.BOLD, _v$4 = raised(), _v$5 = theme().text.muted, _v$6 = props.thread.length > 0 ? "Ask a follow-up" : "Ask about this session", _v$7 = theme().text.muted, _v$8 = theme().text.base, _v$9 = theme().text.base, _v$0 = theme().text.base, _v$1 = raised(), _v$10 = raised(), _v$11 = theme().text.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$, "backgroundColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$2, "fg", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$2, "attributes", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp(_el$7, "backgroundColor", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp(_el$8, "fg", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp(_el$0, "placeholder", _v$6, _p$.n));
      _v$7 !== _p$.s && (_p$.s = _$setProp(_el$0, "placeholderColor", _v$7, _p$.s));
      _v$8 !== _p$.h && (_p$.h = _$setProp(_el$0, "textColor", _v$8, _p$.h));
      _v$9 !== _p$.r && (_p$.r = _$setProp(_el$0, "focusedTextColor", _v$9, _p$.r));
      _v$0 !== _p$.d && (_p$.d = _$setProp(_el$0, "cursorColor", _v$0, _p$.d));
      _v$1 !== _p$.l && (_p$.l = _$setProp(_el$0, "backgroundColor", _v$1, _p$.l));
      _v$10 !== _p$.u && (_p$.u = _$setProp(_el$0, "focusedBackgroundColor", _v$10, _p$.u));
      _v$11 !== _p$.c && (_p$.c = _$setProp(_el$1, "fg", _v$11, _p$.c));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined,
      h: undefined,
      r: undefined,
      d: undefined,
      l: undefined,
      u: undefined,
      c: undefined
    });
    return _el$;
  })();
}

// src/thread.ts
var HISTORY_LIMIT = 20;
var INSTRUCTIONS = [
  "The user is asking a side question about the conversation so far, from a separate panel.",
  "The side thread is not part of the main conversation and is never added to it.",
  "Answer directly and concisely in markdown from what you already know.",
  "Do not call any tools and do not take any actions."
].join(" ");
function buildPrompt(earlier, question) {
  const replay = earlier.filter((exchange) => exchange.status === "done").slice(-HISTORY_LIMIT).map((exchange) => `<question>
${exchange.question}
</question>
<answer>
${exchange.answer}
</answer>`);
  return [
    INSTRUCTIONS,
    ...replay.length > 0 ? ["Earlier side questions and your answers, oldest first:", replay.join(`

`)] : [],
    `Side question:
${question}`
  ].join(`

`);
}
var EMPTY_ANSWER = "No answer came back. Side questions can only use what is already in the conversation, so try asking differently.";
function errorMessage(error) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}

// src/tui.tsx
var SPINNER = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
var tui_default = Plugin.define({
  id: "opencode-ask",
  setup(context) {
    const [state, update] = context.storage.memory("state", {
      initial: {
        nextID: 1,
        threads: {}
      }
    });
    const queues = new Map;
    const requests = new Map;
    const [frame, setFrame] = createSignal2(0);
    let ticker;
    let disposed = false;
    const thread = (sessionID) => state.threads[sessionID] ?? [];
    const exists = (sessionID, id) => thread(sessionID).some((item) => item.id === id);
    const waiting = (sessionID) => Object.entries(state.threads).some(([id, exchanges]) => (sessionID === undefined || id === sessionID) && exchanges.some((item) => item.status === "waiting"));
    const tick = () => {
      if (waiting() && !ticker)
        ticker = setInterval(() => setFrame((value) => (value + 1) % SPINNER.length), 80);
      if (!waiting() && ticker) {
        clearInterval(ticker);
        ticker = undefined;
      }
    };
    const settle = (sessionID, id, status, answer) => update((draft) => {
      const exchange = draft.threads[sessionID]?.find((item) => item.id === id);
      if (!exchange)
        return;
      exchange.status = status;
      exchange.answer = answer;
    });
    const cancelWaiting = (answer) => update((draft) => {
      for (const exchanges of Object.values(draft.threads)) {
        for (const exchange of exchanges) {
          if (exchange.status !== "waiting")
            continue;
          exchange.status = "failed";
          exchange.answer = answer;
        }
      }
    });
    cancelWaiting("Cancelled because the plugin reloaded.");
    const notify = (sessionID, status) => {
      const open = context.ui.panel.current();
      if (open?.name === PANEL && open.sessionID === sessionID)
        return;
      context.ui.toast.show(status === "done" ? {
        title: "Ask",
        message: "Your answer is ready. Press shift+\u2192 to read it.",
        variant: "info",
        sessionID
      } : {
        title: "Ask",
        message: "Your side question failed. Press shift+\u2192 to see why.",
        variant: "error",
        sessionID
      });
    };
    const discard = (sessionID) => {
      for (const [request, owner] of requests)
        if (owner === sessionID)
          request.abort();
      update((draft) => {
        delete draft.threads[sessionID];
      });
      tick();
    };
    async function answer(sessionID, id, question) {
      if (disposed || !exists(sessionID, id))
        return;
      const earlier = thread(sessionID).filter((item) => item.id < id);
      const request = new AbortController;
      requests.set(request, sessionID);
      let status = "failed";
      let text;
      try {
        const response = await context.client.session.generate({
          sessionID,
          prompt: buildPrompt(earlier, question)
        }, {
          signal: request.signal
        });
        text = response.text.trim();
        if (text)
          status = "done";
        else
          text = EMPTY_ANSWER;
      } catch (error) {
        text = errorMessage(error);
      } finally {
        requests.delete(request);
      }
      if (disposed || !exists(sessionID, id))
        return;
      settle(sessionID, id, status, text);
      tick();
      notify(sessionID, status);
    }
    function ask(sessionID, question) {
      const id = state.nextID;
      update((draft) => {
        draft.nextID = id + 1;
        (draft.threads[sessionID] ??= []).push({
          id,
          question,
          status: "waiting",
          answer: ""
        });
      });
      tick();
      const next = (queues.get(sessionID) ?? Promise.resolve()).then(() => answer(sessionID, id, question));
      queues.set(sessionID, next);
      next.finally(() => {
        if (queues.get(sessionID) === next)
          queues.delete(sessionID);
      });
    }
    context.keymap.layer(() => ({
      mode: "global",
      commands: [{
        id: "opencode-ask.open",
        title: "Ask a side question",
        description: "Ask about this session in a full-screen panel without adding to the conversation",
        group: "Session",
        palette: true,
        slash: {
          name: "ask",
          arguments: true
        },
        run(input) {
          const route = context.ui.router.current();
          if (route.type !== "session") {
            context.ui.toast.show({
              message: "Open a session first",
              variant: "warning"
            });
            return;
          }
          const question = input?.trim();
          if (question)
            ask(route.sessionID, question);
          context.ui.panel.open(PANEL, {
            presentation: "fullscreen"
          });
        }
      }]
    }));
    context.keymap.layer(() => ({
      priority: 10,
      commands: [{
        bind: "shift+right",
        title: "Switch to the side conversation",
        run: () => {
          const route = context.ui.router.current();
          if (route.type !== "session" || context.ui.panel.current())
            return false;
          if (thread(route.sessionID).length === 0)
            return false;
          if (context.renderer.currentFocusedEditor?.plainText)
            return false;
          context.ui.panel.open(PANEL, {
            presentation: "fullscreen"
          });
        }
      }]
    }));
    context.ui.slot({
      append: "session.panel",
      render: (panel) => _$createComponent2(Show2, {
        get when() {
          return panel.name === PANEL;
        },
        get children() {
          return _$createComponent2(AskPanel, {
            context,
            panel,
            get thread() {
              return thread(panel.sessionID);
            },
            get spinner() {
              return SPINNER[frame()] ?? "";
            },
            onAsk: (question) => ask(panel.sessionID, question),
            onDiscard: () => discard(panel.sessionID)
          });
        }
      })
    });
    context.ui.slot({
      append: "prompt.footer.status",
      render: (footer) => _$createComponent2(Show2, {
        get when() {
          return _$memo(() => footer.sessionID !== undefined)() && thread(footer.sessionID).length > 0;
        },
        get children() {
          var _el$ = _$createElement2("text");
          _$setProp2(_el$, "flexShrink", 0);
          _$insert2(_el$, (() => {
            var _c$ = _$memo(() => !!waiting(footer.sessionID));
            return () => _c$() ? `${SPINNER[frame()] ?? ""} ask` : "shift+\u2192 for ask";
          })());
          _$effect2((_$p) => _$setProp2(_el$, "fg", context.theme.text.muted, _$p));
          return _el$;
        }
      })
    });
    return () => {
      disposed = true;
      for (const request of requests.keys())
        request.abort();
      if (ticker)
        clearInterval(ticker);
      cancelWaiting("Cancelled because the plugin reloaded.");
    };
  }
});
export {
  tui_default as default
};

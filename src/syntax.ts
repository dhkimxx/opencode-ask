import { SyntaxStyle, type ColorInput, type ThemeTokenStyle } from "@opentui/core"
import type { Context } from "@opencode/plugin/tui/context"

type Theme = Context["theme"]

function rule(scope: string[], foreground: ColorInput, style: Omit<ThemeTokenStyle["style"], "foreground"> = {}) {
  return { scope, style: { foreground, ...style } }
}

/** Colors answers like OpenCode's own transcript, using the active theme. */
export function syntaxStyle(theme: Theme) {
  const { syntax, markdown } = theme
  const feedback = theme.text.feedback
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
    rule(
      ["markup.heading", "markup.heading.2", "markup.heading.3", "markup.heading.4", "markup.heading.5", "markup.heading.6"],
      markdown.heading,
      { bold: true },
    ),
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
    rule(["diff.minus"], theme.diff.text.removed, { background: theme.diff.background.removed }),
  ])
}

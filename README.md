# opencode-ask

Ask side questions about your [OpenCode](https://opencode.ai) session and keep the side conversation going, without adding anything to the main conversation.

`/ask` opens a full-screen panel. Ask a question, read the answer, and ask follow-ups right there. When you close the panel, your session is exactly as you left it.

```text
 Ask  2/3

 Which file has the retry logic?

 `src/net/retry.ts`. The `withRetry` helper wraps every request and
 backs off after each failure.

 › Ask a follow-up
 enter send · shift+←/→ browse · ↑/↓ scroll · esc close
```

## Features

- **Follow-up questions.** Keep asking in the same panel. Each answer remembers your earlier side questions.
- **Nothing added to your session.** No new messages, no new sessions, no forks to clean up.
- **Full-screen panel.** Answers get the whole screen until you close the panel.
- **Browse earlier answers** with `shift+←` and `shift+→`.
- **Works while OpenCode is busy.** Ask while the main session is still running.

## Requirements

OpenCode 2. Tested with OpenCode 2.0.27. OpenCode 1 is not supported.

## Install

```sh
opencode plugin add github:dhkimxx/opencode-ask
```

This installs the plugin and adds it to your `cli.json`. If OpenCode is already running, restart it.

To install a specific release, add its tag:

```sh
opencode plugin add github:dhkimxx/opencode-ask#v0.1.0
```

Update or remove the plugin with the same name you installed it with:

```sh
opencode plugin update github:dhkimxx/opencode-ask
opencode plugin remove github:dhkimxx/opencode-ask
```

<details>
<summary>Manual install</summary>

Clone the repository into your global OpenCode plugins folder. OpenCode loads it automatically.

```sh
git clone https://github.com/dhkimxx/opencode-ask ~/.config/opencode/plugins/opencode-ask
```

To update, run `git pull` in that folder.

</details>

## Usage

| To do this                 | Do this                                                |
| -------------------------- | ------------------------------------------------------ |
| Ask a question             | `/ask your question`                                   |
| Ask a follow-up            | Type in the panel and press `enter`                    |
| See earlier answers        | `shift+←` / `shift+→` while the input is empty         |
| Scroll an answer           | `↑` / `↓`, `page up` / `page down`, or the mouse wheel |
| Close the panel            | `esc`                                                  |
| Open the panel again       | `/ask` with no question                                |

To copy part of an answer, select it with the mouse. OpenCode copies the selection for you.

If an answer arrives while the panel is closed, a short notice tells you it is ready.

## How it works

- Answers come from the session's model and use the conversation so far. The plugin calls OpenCode's `session.generate`, which reads the session without changing it.
- Side questions can't use tools, so they can't read files or run commands. To continue with tools, use OpenCode's `/fork`.
- Each new question includes your earlier side questions and answers, up to the last 20.
- The side conversation lives in memory. Closing the panel keeps it, and quitting OpenCode clears it.
- Questions in a session are answered one at a time, in the order you asked them.

## Development

You need [Bun](https://bun.sh).

```sh
git clone https://github.com/dhkimxx/opencode-ask
cd opencode-ask
bun install
bun run check
```

`bun run check` type-checks the code and builds `dist/tui.js`. To try your changes, point OpenCode at your clone in `~/.config/opencode/cli.json`, then restart OpenCode:

```json
{
  "plugins": ["/path/to/opencode-ask"]
}
```

`dist/` is committed on purpose. OpenCode only compiles plugin JSX outside `node_modules`, so GitHub and npm installs need the built JavaScript. Run `bun run build` and commit `dist/` with your change. CI fails if `dist/` is out of date.

Releases are described in [RELEASING.md](RELEASING.md).

## License

[MIT](LICENSE)

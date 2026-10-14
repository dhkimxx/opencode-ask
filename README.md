# opencode-ask

Ask side questions about your [OpenCode](https://opencode.ai) session and keep the side conversation going, without adding anything to the main conversation.

`/ask` opens a full-screen side conversation. Ask a question, read the answer, and ask follow-ups right there. Switch back to the main conversation with `shift+←` and return with `shift+→`, much like side conversations in Codex CLI. When you close the side conversation, your session is exactly as you left it.

```text
 Ask

 ┃
 ┃  Which file has the retry logic?
 ┃

    `src/net/retry.ts`. The `withRetry` helper wraps every request.

 ┃
 ┃  Does it back off between attempts?
 ┃

    Yes. It doubles the wait after each failure, up to 30 seconds.

 › Ask a follow-up
 main working · shift+← to switch · esc to close
```

## Features

- **A real side conversation.** Questions and answers stack up like the main transcript, newest at the bottom. Each answer remembers your earlier side questions.
- **Nothing added to your session.** No new messages, no new sessions, no forks to clean up.
- **Switch back and forth.** `shift+←` shows the main conversation and `shift+→` brings the side conversation back.
- **Closing clears it.** `esc` closes the side conversation and forgets it.
- **Works while OpenCode is busy.** Ask while the main session is running. The footer tells you when the main conversation is working, finished, or needs your approval.

## Requirements

OpenCode 2. Tested with OpenCode 2.0.27. OpenCode 1 is not supported.

## Install

```sh
opencode plugin add github:dhkimxx/opencode-ask
```

This installs the plugin and adds it to your `cli.json`. If OpenCode is already running, restart it.

To install a specific release, add its tag:

```sh
opencode plugin add github:dhkimxx/opencode-ask#v0.3.2
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

| To do this                        | Do this                                                |
| --------------------------------- | ------------------------------------------------------ |
| Ask a question                    | `/ask your question`                                   |
| Ask a follow-up                   | Type in the side conversation and press `enter`        |
| Switch to the main conversation   | `shift+←` while the input is empty                     |
| Switch back to the side           | `shift+→` while the prompt is empty                    |
| Scroll the side conversation      | `↑` / `↓`, `page up` / `page down`, or the mouse wheel |
| Close and clear it                | `esc`, or `ctrl+c` while the input is empty            |

While a side conversation is open, the main footer shows `shift+→ for ask`, with a spinner while an answer is being written. If an answer arrives while you are in the main conversation, a short notice tells you it is ready.

To copy part of an answer, select it with the mouse. OpenCode copies the selection for you.

## How it works

- Answers come from the session's model and use the conversation so far. The plugin calls OpenCode's `session.generate`, which reads the session without changing it.
- Side questions can't use tools, so they can't read files or run commands. To continue with tools, use OpenCode's `/fork`.
- Each new question includes your earlier side questions and answers, up to the last 20.
- The side conversation lives in memory, one per session. Switching keeps it. Closing it, or quitting OpenCode, clears it and cancels any answer still being written.
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

`dist/` is committed on purpose. OpenCode only compiles plugin JSX outside `node_modules`, so GitHub and npm installs need the built JavaScript. Run `bun run bundle` and commit `dist/` with your change. CI fails if `dist/` is out of date.

Don't add `build`, `prepare`, `prepack`, or install scripts to `package.json`. npm runs an extra install step for GitHub packages that have them, and that step fails inside OpenCode.

Releases are described in [RELEASING.md](RELEASING.md).

## License

[MIT](LICENSE)

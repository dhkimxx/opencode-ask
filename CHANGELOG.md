# Changelog

All notable changes to this project are listed here.
This project follows [Semantic Versioning](https://semver.org).

## [0.3.1] - 2026-10-14

### Changed

- The `/ask` description says it is a multi-turn chat, so it reads clearly next to `/btw`'s one-shot answer. The command palette lists it as "Open side chat".

## [0.3.0] - 2026-10-14

### Changed

- `shift+←` switches to the main conversation and `shift+→` switches back to the side conversation, which stays as it was. This replaces jumping between questions.
- Closing the side conversation with `esc`, or `ctrl+c` on an empty input, clears it from memory and cancels any answer still being written.

### Added

- The main footer shows `shift+→ for ask` while a side conversation is open.
- The side conversation footer shows what the main conversation is doing: working, finished, or waiting for your approval or input.

## [0.2.0] - 2026-10-14

### Changed

- The panel shows the whole side conversation as one scrolling thread, newest at the bottom, styled like the main transcript.
- `shift+←` and `shift+→` jump to the previous or next question.

## [0.1.0] - 2026-10-13

### Added

- `/ask` opens a full-screen panel for side questions about the current session.
- Ask follow-up questions in the panel. Each answer sees your earlier side questions (the last 20).
- Browse earlier answers with `shift+←` and `shift+→`.
- A spinner in the footer and a toast when an answer arrives while the panel is closed.
- `ctrl+c` in the panel clears the input or closes the panel, instead of quitting OpenCode.

[0.3.1]: https://github.com/dhkimxx/opencode-ask/releases/tag/v0.3.1
[0.3.0]: https://github.com/dhkimxx/opencode-ask/releases/tag/v0.3.0
[0.2.0]: https://github.com/dhkimxx/opencode-ask/releases/tag/v0.2.0
[0.1.0]: https://github.com/dhkimxx/opencode-ask/releases/tag/v0.1.0

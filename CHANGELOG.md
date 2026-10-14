# Changelog

All notable changes to this project are listed here.
This project follows [Semantic Versioning](https://semver.org).

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

[0.2.0]: https://github.com/dhkimxx/opencode-ask/releases/tag/v0.2.0
[0.1.0]: https://github.com/dhkimxx/opencode-ask/releases/tag/v0.1.0

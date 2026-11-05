# Change Log

All notable changes to the "open-in-new-window" extension are documented here.
Check [Keep a Changelog](http://keepachangelog.com/) for the recommended structure.

## [Unreleased]

## [0.0.5] - 2026-11-05

### Added

- "Open in New Window" in the Explorer context menu for files and folders, opening the target on the same host as the current window.

### Changed

- The new window inherits the current window's remote authority instead of rebuilding a `vscode-remote://` URI, so Remote-SSH and WSL stay on the same host.
- The file/folder decision, the supported-scheme check and the path helpers live in pure core functions covered by tests.

### Fixed

- Remote-SSH and WSL windows failed with "Cannot determine the remote authority for this window".
- A file at the file system root now opens that root as its workspace instead of reporting an error.

### Removed

- The scaffold's placeholder `helloWorld` command.

## [0.0.1] - 2026-11-05

### Added

- Project scaffold: manifest, esbuild bundling, ESLint, integration tests and VS Code tasks.

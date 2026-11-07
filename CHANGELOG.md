# Change Log

All notable changes to the "new-window-here" extension are documented here.
Check [Keep a Changelog](http://keepachangelog.com/) for the recommended structure.

## [Unreleased]

## [0.1.1] - 2026-11-07

### Added

- `openInNewWindow.allowMultiSelection` setting (default `false`): when enabled, the Explorer item is shown for a multi-selection and the Command Palette picker accepts several targets, opening one new window per selected resource.
- **Open in New Window** in the Command Palette: invoked without a resource, it shows a file picker that accepts a folder, a file or a `.code-workspace` file; cancelling the picker opens no window and shows no error.

### Changed

- A `.code-workspace` target now opens as that workspace in the new window instead of opening as a plain file inside its containing folder.
- An unreadable target now reports an error and is skipped while the remaining selected targets still open.

## [0.1.0] - 2026-11-05

### Added

- Extension icon, shown in the Extensions view and on the Marketplace.
- MIT license (`LICENSE`, reflected in the Marketplace metadata).

### Changed

- README rewritten for the Marketplace listing: features, usage, requirements, known limitations, license.

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

# Proposal

## Why

Opening a second folder, or a single file, in a fresh window currently means using the bottom-left remote picker and then File > Open, which discards the right-click target and takes several interactions. The Explorer offers no per-item action, even though VS Code can already open a folder in a new window.

## What Changes

- Add an `Open in New Window` item to the Explorer context menu for files and folders on a real file system.
- Invoking it on a folder opens a new window whose workspace root is that folder.
- Invoking it on a file opens a new window with the file visible in the editor area; the containing folder becomes that window's workspace root.
- The new window stays on the same host as the originating window: local stays local, WSL stays on the same distribution, SSH stays on the same host.
- Hide the item for virtual file systems and for multi-selection, where "which resource" would be ambiguous.
- Replace the scaffold's placeholder `helloWorld` command.

## Capabilities

### New Capabilities

- `open-in-new-window`: opening the Explorer-selected resource in a separate window on the same host, without disturbing the current window.

### Modified Capabilities

None.

## Impact

- `package.json`: new command contribution plus an `explorer/context` menu entry; the placeholder command is removed.
- `src/`: an environment/URI module and a command handler; the handler must not depend on the active editor.
- Tests: integration coverage that the command is registered and executes without throwing; the window behaviour itself needs manual verification because a test host cannot assert on new windows.
- No new dependencies. Delivery relies on `vscode.openFolder`, whose `forceNewWindow` and `filesToOpen` options are not part of the typed API.

# Open in New Window

A VS Code extension that opens Explorer files and folders in a separate window on the same host.

## Features

- Right-click a file or folder in the Explorer and choose **Open in New Window**.
- A folder opens as the workspace root of the new window.
- A file opens in the editor area of the new window; its containing folder becomes that window's workspace root.
- The new window stays on the same host the action was invoked from: local stays local, WSL stays on the same distribution, SSH stays on the same host.
- The action is hidden for virtual file systems and for multi-selection.

Not handled yet: converting between hosts (local to WSL, WSL to SSH), carrying editor state into the new window, and opening `.code-workspace` files as workspaces.

## Development

Requirements: Node.js 20 or newer and VS Code 1.104 or newer.

```bash
npm install
npm run compile      # type-check, lint, bundle to dist/
npm run watch        # esbuild + tsc in watch mode, used by F5
npm test             # integration tests in a downloaded VS Code host
npm run package      # production bundle, then VSIX via vsce
```

Press F5 in VS Code to launch the Extension Development Host.

## Layout

```
src/extension.ts        activation entry point
src/commands/           one handler per contributed command
src/core/               path helpers and open planning, no command wiring
src/test/               integration tests (mocha, run by @vscode/test-cli)
dist/                   bundled extension (gitignored)
openspec/               specs and in-flight changes
```

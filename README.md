# New Window Here

Open a file or folder in a new VS Code window without leaving the one you are working in.

## Features

- **Explorer context menu** — right-click a file or folder and choose **Open in New Window**.
- **Folders become workspaces** — the folder you picked is the workspace root of the new window.
- **Files open with their context** — the file opens in the editor and its containing folder becomes the workspace root, so the workspace, search and terminal in the new window point at the right place.
- **Same host** — the new window stays where the action was invoked: local stays local, WSL stays on the same distribution, Remote-SSH stays on the same host.
- **Stays out of the way** — the entry is hidden for multi-selection and for virtual file systems it cannot open.

## Usage

1. Right-click a file or folder in the Explorer.
2. Choose **Open in New Window**.

The command needs a target, so it is deliberately absent from the Command Palette. If the target cannot be read, the extension reports the failure in an error notification and no window opens.

## Requirements

- VS Code 1.104 or newer.
- Nothing else to install. It works in local windows and in existing remote windows (WSL, Remote-SSH).

## Known limitations

- **No host switching.** The new window stays on the host you invoked it from: there is no local to WSL, WSL to SSH or SSH to container conversion. Open a window on the other host first, then use the extension there.
- **No state hand-off.** The new window opens the target only; unsaved editors, breakpoints and terminals are not carried over.
- **`.code-workspace` files open as files.** Their containing folder becomes the workspace root and the workspace file is not applied.
- **Explorer only.** There is no Command Palette entry, because the command needs a resource to open.

## License

MIT — see [LICENSE](LICENSE).

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run compile            # type-check, lint, bundle to dist/
npm run watch              # esbuild + tsc watch, used by F5
npm test                   # integration tests in a downloaded VS Code host
npm run package            # production bundle (minified, no source maps)
npx @vscode/vsce package   # -> new-window-here-<version>.vsix
```

Press F5 to launch the Extension Development Host.

```
src/extension.ts   activation entry point, wiring only
src/commands/      one handler per contributed command
src/core/          path helpers and open planning, unit-tested
src/test/          integration tests (mocha, run by @vscode/test-cli)
```

Behaviour is specified under `openspec/`; a behaviour change goes through a change proposal there before it is implemented.

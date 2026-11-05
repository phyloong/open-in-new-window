# Tasks

## 1. Confirm the window-opening mechanics

- [x] 1.1 Confirm in the installed 1.144 and 1.145 bundles that `vscode.openFolder` accepts `forceNewWindow` and `filesToOpen`, and that no command opens a bare file in a window without a folder.
- [x] 1.2 Observe in a real Remote-SSH window that `env.asExternalUri` yields no `vscode-remote` segment, which is why authority rebuilding was replaced by the workbench's authority inheritance.
- [x] 1.3 Confirm with the manual run that a folder and a file both open in a new window on the same host.
- [x] 1.4 Keep the spike out of the shipped tree; verify `npm run check-types` and `npm run lint` pass on the final sources.

## 2. Command, menu and target resolution

- [x] 2.1 Replace the placeholder command with `openInNewWindow.open` and contribute the `explorer/context` entry guarded by `(resourceScheme == file || resourceScheme == 'vscode-remote') && !listMultiSelection`, hiding it from the Command Palette; verify `npm test` asserts the command is registered and `npx @vscode/vsce package` includes the updated manifest.
- [x] 2.2 Implement `planOpen` and `parentOf` as pure core functions; verify with integration tests that folder, file, trailing-slash, drive-root and no-parent cases are covered.
- [x] 2.3 Implement the folder branch with `workspace.fs.stat` and the folder open call; verify `planOpen` covers the folder case in tests, and leave the on-screen window check to 4.1.
- [x] 2.4 Implement the file branch using the parent folder plus `filesToOpen`; verify `planOpen` covers the file case and the no-parent rejection in tests, and leave the on-screen check to 4.1.
- [x] 2.5 Accept both `file` and `vscode-remote` resources and hand the URI to `vscode.openFolder` untouched so the workbench inherits the current window's remote authority; re-verify in Remote-SSH that the new window stays on the same host.

## 3. Documentation

- [x] 3.1 Document the action in `README.md` with its menu location and the two outcomes; verify the label written there matches the `package.json` command title exactly.
- [x] 3.2 Add an entry under `CHANGELOG.md` Unreleased; verify the file still starts with the Unreleased section and the entry names the action.
- [x] 3.3 Correct the `AGENTS.md` architecture notes so they describe `vscode.openFolder` as a built-in command, name `src/core/paths.ts` and `src/core/plan.ts` as the canonical homes for path and planning logic, and drop the stale `core/uri/` reference; verify `grep` finds no remaining `core/uri` reference or `vscode.openFolder` described as an API function.

## 4. Integration checks

- [x] 4.1 Verify on Windows: local folder, local file inside the current workspace and local file outside it each open one new window with the expected content and leave the originating window untouched.
- [x] 4.2 Verify in Remote-SSH: a folder and a file each open a window connected to the same host.
- [x] 4.3 Verify in WSL: a folder and a file each open a window on the same distribution.
- [x] 4.4 Verify `npm test` passes (13 tests) and `npx @vscode/vsce package` produces a VSIX containing only `dist/extension.js`, `package.json`, README and CHANGELOG.

## Verification gaps

- Every row was checked in a real window on Windows, Remote-SSH and WSL.
- The test host asserts registration, URI mapping and the open plan. It cannot assert that a second window appears, so 4.1-4.3 rely on manual checks.
- Remote behaviour is implemented defensively for both `file:` and `vscode-remote:` Explorer resources because the documented API does not settle which one a remote window reports.

## Workflow follow-up

- Archive the change after review and the manual matrix are complete.

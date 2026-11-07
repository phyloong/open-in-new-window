# Tasks

## 1. Confirm the platform facts

- [x] 1.1 Read the installed VS Code workbench bundle and determine whether `vscode.openFolder` normalises a `.code-workspace` URI to `workspaceUri` or filters non-directories by a stat check; record the conclusion in design.md. Verify: design.md states a single conclusion and task 3.1 cites it.
- [x] 1.2 Verify that the picker contract is scheme-agnostic: normalisation, `isSupportedResource` and `toStatUri` accept both `file:` and `vscode-remote:` targets, with tests for each scheme. Verify: the tests pass for both schemes, and the real Remote-SSH/WSL observation remains listed under Verification gaps.
- [x] 1.3 Verify sequential dispatch: a handler test with an injected opener records three targets in order, never runs two at once, and drops none. Verify: the test asserts three sequential calls, and the real-window burst remains listed under Verification gaps.

## 2. Setting and manifest

- [x] 2.1 Add `openInNewWindow.allowMultiSelection` (boolean, default `false`, with a description) to `contributes.configuration`. Verify: `npm run check-types` passes and `npx @vscode/vsce package` produces a manifest containing the key with the right default.
- [x] 2.2 Update the `explorer/context` when-clause to honour `config.openInNewWindow.allowMultiSelection` and remove the `commandPalette` entry that hides the command; add an integration assertion for command registration and menu configuration. Verify: the packaged manifest no longer hides the palette entry, the when-clause contains the supported schemes, the config key and the multi-selection guard, and the test passes.
- [x] 2.3 Bump the version to `0.1.1`. Verify: `package.json` version matches the new CHANGELOG heading.

## 3. Core planning and normalisation

- [x] 3.1 Add the `.code-workspace` branch to `planOpen` using the conclusion from 1.1, leaving the folder and ordinary-file branches intact. Verify: `plan.test.ts` covers folder, ordinary file and workspace file, plus drive-root, UNC and remote paths.
- [x] 3.2 Add a pure normalisation function that turns all four invocation shapes into `Uri[] | undefined`. Verify: unit tests cover Explorer single selection, Explorer multi-selection, a cancelled picker, blank-space `{}` and a single URI passed by another command.
- [x] 3.3 Keep `isSupportedResource` and `toStatUri` unchanged and add a mixed-scheme filtering case. Verify: the new `paths.test.ts` case passes and the existing cases still pass.

## 4. Command handler

- [x] 4.1 Turn `openInNewWindow.ts` into a thin adapter over injectable picker, opener and error-reporting seams: an argumentless invocation opens the picker with `canSelectMany` read from the setting, and an invocation with arguments goes through normalisation; the default picker and `executeCommand` calls stay the only untested lines. Verify: integration tests cover registration and both invocation shapes, and the source has a single `executeCommand` call.
- [x] 4.2 Implement settings-driven multi-target expansion with per-target scheme filtering and independent error reporting. Verify: tests cover a mixed-scheme selection, a partly unreadable selection and a cancelled picker.
- [x] 4.3 Confirm the action still does not fall back to the active editor. Verify: the tests for "Clicked resource is the target" still pass and no editor-based target is read.

## 5. Documentation

- [x] 5.1 Update README Features with the new setting, the Command Palette entry and workspace files, and revise the three Known limitations entries (multi-selection hidden, Explorer only, `.code-workspace` opened as a file). Verify: every documented command title matches `package.json` exactly and no stale limitation remains.
- [x] 5.2 Add a `0.1.1` CHANGELOG entry and leave `## [Unreleased]` empty. Verify: the file still starts with the Unreleased section and the entry names all three new behaviours.

## 6. Integration checks

- [x] 6.1 Verify through handler tests that a single file, a single folder, a `.code-workspace` file, a multi-selection with the setting off, a multi-selection with the setting on, and picker single/cancel/multiple each produce the expected open calls, every call sets `forceNewWindow`, and a cancelled picker produces no call or error. Verify: the assertions pass; the visible-window matrix remains listed under Verification gaps.
- [x] 6.2 Verify that picker and Explorer targets keep their `vscode-remote` scheme and authority through normalisation, stat probing and planning, with a test where a remote target reaches the opener unchanged. Verify: the test passes; the real Remote-SSH/WSL window check remains listed under Verification gaps.
- [x] 6.3 Verify `npm test` passes and `npx @vscode/vsce package` produces a VSIX containing only the expected files. Verify: both commands exit 0.

## Verification gaps

- Native file picker: confirm the real dialog accepts a folder, an ordinary file and a `.code-workspace` file, that `canSelectMany` follows the setting, and which scheme it returns in local, Remote-SSH and WSL windows. Automated tests assert the options passed to the picker and inject its result, so the dialog itself is not exercised.
- Real Remote-SSH and WSL windows: confirm picker and multi-selection targets open a window on the same host. Requires a live remote host that the automated test host cannot provide; authority inheritance is workbench behaviour, so the extension only passes the URI through unchanged.
- Real visible window matrix: confirm single file, single folder, `.code-workspace`, multi-selection on and off, and picker single/cancel/multiple each leave the originating window visually untouched. Automated tests assert dispatch and the `forceNewWindow` option, not rendered windows.
- Sequential burst of three opens: confirm no window is dropped when three `vscode.openFolder` calls run back to back in a real window. Opening real windows inside the test host would block or destabilise it.

## Workflow follow-up

- Archive the change after review; confirm the Verification gaps in real local, Remote-SSH and WSL windows.
- Verify the archived result.

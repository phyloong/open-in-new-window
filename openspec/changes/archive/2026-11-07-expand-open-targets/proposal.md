# Proposal

## Why

The shipped action accepts only the single Explorer resource that was right-clicked, hides itself for multi-selection and from the Command Palette, and opens `.code-workspace` files as plain files. That leaves gaps in the category the extension claims to cover (file, folder, workspace, remote), so target coverage must be completed before a differentiating capability is built on top of it.

## What Changes

- Add a boolean setting `openInNewWindow.allowMultiSelection`, default `false`, that decides whether one invocation may open more than one target. This is a new public API; its key is fixed by this change.
- With the setting at its default, behaviour is unchanged: the Explorer item is hidden for multi-selection and one invocation opens at most one target.
- With the setting `true`, the Explorer item is shown for multi-selection and opens one new window per selected resource; the Command Palette picker also allows multiple selection and opens one new window per picked target.
- Add the action to the Command Palette. Invoking it with no resource argument shows a file picker that accepts a folder, a file or a `.code-workspace` file. Cancelling the picker opens no window and shows no error.
- Open a `.code-workspace` target as that workspace in the new window, instead of as a plain file inside its containing folder.
- Normalise every invocation source (Explorer single selection, Explorer multi-selection, the Command Palette picker, and other commands passing a URI) into a list of target URIs. Existing folder/file planning, scheme filtering, same-host behaviour and the single `vscode.openFolder` call site are preserved.
- Update the README Known limitations and Features sections, add a CHANGELOG entry, and bump the version to `0.1.1`.
- No breaking changes: every new behaviour is additive or opt-in, and defaults preserve the v0.1.0 behaviour.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `open-in-new-window`: the Explorer menu visibility, Command Palette availability, target sources, target kinds (workspace files), unreadable-target reporting and target-selection requirements all change.

## Impact

- `package.json`: a new `contributes.configuration` entry, a changed `explorer/context` when-clause, removal of the `commandPalette` entry that hides the command, and a version bump.
- `src/commands/openInNewWindow.ts`: becomes a thin adapter over three invocation sources; the `vscode.openFolder` call stays the only untested line.
- `src/core/plan.ts`: gains a third target kind for workspace files.
- `src/core/paths.ts`: scheme handling stays as-is.
- Tests: unit coverage for the workspace-file branch, multi-target normalisation and mixed-scheme selections; integration coverage for command registration, the new setting and the Command Palette entry.
- Documentation: README (Features, Known limitations), CHANGELOG.
- No new dependencies. `vscode.window.showOpenDialog` and `vscode.workspace.getConfiguration` are typed APIs; `vscode.openFolder` remains the untyped built-in command.
- Out of scope (a separate change): differentiating capabilities such as profile/temp-profile windows, a file-only window with no workspace root, cross-host switching and editor-state hand-off.

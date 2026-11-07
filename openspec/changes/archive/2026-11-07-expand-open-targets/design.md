# Design

## Context

See proposal.md - Why. The shipped handler in `src/commands/openInNewWindow.ts` mixes two concerns: obtaining the target from the Explorer argument, and opening it through `planOpen` plus one `executeCommand('vscode.openFolder', ...)` call. Three platform facts shape this change:

- `vscode.openFolder` is an untyped built-in command. Its first argument is normalised to `{ folderUri }` or `{ workspaceUri }`, and its metadata accepts `forceNewWindow` and `filesToOpen`. The URI is passed unchanged so the workbench copies the originating window's `remoteAuthority` into the new window; reconstructing a `vscode-remote://` URI is not possible from the public API.
- The `explorer/context` menu passes the clicked resource URI as the first argument and an array of selected resource URIs as the second. The array always contains the first argument, follows the order in which items were selected, and is empty when the context menu is opened on blank space (where the first argument may be an empty object rather than a URI). These arguments are not supplied when the same command runs from the Command Palette or a keyboard shortcut.
- `vscode.window.showOpenDialog` returns `Uri[] | undefined`, keeps both files and folders selectable, and resolves paths against the current window's own file service. `vscode.workspace.fs.stat` accepts a `file:` URI reduced from a `vscode-remote:` resource, so the existing type probe is reusable.

The supported-scheme policy already appears in three places (manifest when-clause, handler guard, stat probe). This change adds a second policy that must also stay in sync across three places.

## Goals / Non-Goals

**Goals:**

- One normalisation point: every invocation source produces `Uri[] | undefined`, and every target flows through the same `planOpen` and the single `executeCommand` call site.
- One source of truth for multi-selection: the `openInNewWindow.allowMultiSelection` setting decides behaviour in the handler, with the manifest when-clause and the picker option as projections of that decision.
- No string-to-URI parsing. Picker output is already a valid `Uri`, so the path-handling risks called out in AGENTS.md (drive letters, UNC, case sensitivity, WSL, SSH) are not reintroduced.
- Keep the folder/file decision and every URI transformation in `src/core/` as pure functions; leave only the one-line platform calls untested.

**Non-Goals:**

- Differentiating capabilities (profile or temp-profile windows, a file-only window with no workspace root, `forceLocalWindow` host switching, editor-state hand-off). Those belong to a separate change.
- Combining several selected resources into a single multi-root window.
- Changing the "force a new window even if the folder is already open" behaviour.
- Adding a `defaultUri` or `filters` to the picker.

## Decisions

### Normalise all invocation sources to `Uri[] | undefined`

The handler becomes a thin adapter: Explorer single selection yields the selected-resource array, Explorer multi-selection yields the same array with several entries, the picker yields its result, and another command passing a URI yields a one-element array. `undefined` or an empty array means "do nothing". Each entry is scheme-checked and stat-probed, then passed to `planOpen`; the results are executed through the existing single call site.

Alternative rejected: separate branches per invocation source. That duplicates the scheme check, the probe and the error handling, and lets the sources drift apart — the same reason the original change rejected two command IDs for folders and files.

### Picker and opener are injectable seams

`createOpenInNewWindow(seams)` supplies the handler; the default seams call `vscode.window.showOpenDialog` and `executeCommand('vscode.openFolder')`, and tests replace them with recording doubles. This keeps the argumentless picker shape testable without a modal dialog blocking the test host, and leaves the two one-line platform calls as the only untested code. The picker options and the `forceNewWindow` option are built in the handler, so tests assert them instead of trusting the untyped metadata.

### The setting is the single runtime decision

The handler reads `openInNewWindow.allowMultiSelection` once and decides whether an incoming array is truncated to the clicked entry or fully expanded, and what `canSelectMany` value the picker receives. The manifest when-clause mirrors this for menu visibility using a `config.` context key, and is an optimisation only: it must never be the sole guard. If the two ever disagree, the symptom is "the item is shown but only one window opens", which is hard to diagnose, so the spec names all three positions and the tasks add an integration assertion for each.

Alternative rejected: letting the when-clause be authoritative and having the handler trust the argument count. That makes behaviour depend on UI state and leaves keyboard shortcuts and other callers unguarded.

### The Command Palette uses a picker, not a text input

`showOpenDialog` with `canSelectFiles`, `canSelectFolders` and no `filters` accepts folders, ordinary files and `.code-workspace` files in one control, and returns URIs that need no parsing. The original change rejected "letting VS Code's file picker open in a new window" because it needed interaction and lost the right-click target; here the picker only produces a target, the window is still opened by `vscode.openFolder`, and there is no right-click target to lose.

Alternatives rejected: `showInputBox` with a path string, which would require a new string-to-URI conversion in core and a full boundary test suite for drive letters, UNC paths, `~`, relative paths and cross-host `Uri.file` semantics; `env.openExternal`, which lets the receiving instance decide whether to reuse a window.

No `defaultUri` is set: seeding it from the active editor or the first workspace folder would read as a fallback, contradicting both the "clicked resource is the target" requirement and the AGENTS.md guidance against falling back to the first workspace folder. No `filters` is set, because any filter would hide one of the three target kinds the picker must accept.

### Workspace files are a third target kind in `planOpen`

A `.code-workspace` target is neither a folder nor an ordinary file. `planOpen` gains a branch that selects the workspace file itself as the window target with no `filesToOpen`, leaving the folder branch and the parent-folder-plus-file branch untouched. The "Opening a file" requirement is narrowed to exclude workspace files so the two requirements cannot contradict each other.

The `vscode.openFolder` contract for a workspace file is confirmed against the installed workbench bundle (VS Code 1.145.2, `workbench.desktop.main.js`): the command handler normalises its first argument by extension, not by stat — `r = isWorkspaceFile(i) || i.scheme === untitled ? { workspaceUri: i } : { folderUri: i }`, where the workspace-file check compares the URI's extension against `.code-workspace`. The downstream `_files.windowOpen` handler only remaps untitled workspace URIs and forwards every openable to the host's `openWindow`; there is no stat check that filters non-directories on the explicit-URI path. Task 3.1 therefore implements the workspace branch by passing the `.code-workspace` URI through unchanged (it is both the window target and the workspace root) with no `filesToOpen`; the command performs the `workspaceUri` normalisation itself.

Alternative rejected: treating `.code-workspace` as a file and letting the workbench sort it out. That silently produces the wrong workspace root and is the limitation this change removes.

### Accept both `file` and `vscode-remote` from the picker

The picker's scheme in a remote window is not asserted here. Both shapes are already accepted by `isSupportedResource`, reduced correctly by `toStatUri`, and passed untouched to `vscode.openFolder`. This reuses the defensive decision from the original change instead of adding a new assumption.

### Independent targets, no window cap

Each target is processed independently: an unreadable target produces an error and opens no window for that target, while the remaining targets continue. No cap is placed on the number of windows one invocation may open, because the spec states one window per selected target.

Alternatives rejected: failing the whole invocation when one target is unreadable, which discards selections that were already valid; silently skipping unreadable targets, which violates the error-reporting requirement. A cap is a product policy that would change the spec and is deferred to a later change if needed.

## Risks / Trade-offs

- **The multi-selection policy appears in three places (manifest when-clause, picker option, handler).** → Mitigation: the spec names all three, the handler is authoritative, task 2.2 asserts the manifest and tasks 4.2 and 6.1 assert the runtime behaviour.
- **Unused `vscode.openFolder` options are untyped and may change.** → Mitigation: all calls stay at one site, and the existing integration test fails loudly if the command stops accepting them.
- **Several rapid `executeCommand('vscode.openFolder')` calls may race or drop windows.** → Mitigation: task 1.3 verifies sequential dispatch with a recording opener; the real-window burst is listed under Verification gaps and targets are opened sequentially.
- **The picker's URI scheme in a remote window is unverified.** → Mitigation: both supported schemes are already handled; task 1.2 verifies both through tests, and the observed scheme is listed under Verification gaps.
- **The `workspaceUri` contract for `.code-workspace` is unverified.** → Mitigation: task 1.1 resolves it before implementation; the spec describes the outcome, not the mechanism.
- **One invocation can open many windows.** → Mitigation: accepted and recorded here; no cap in this change.
- **Authority inheritance remains workbench behaviour, not a documented API.** → Mitigation: the handler has no authority-specific code to break; the real local, Remote-SSH and WSL matrix is listed under Verification gaps.

## Migration Plan

No user migration is needed: the new setting defaults to `false`, which preserves v0.1.0 behaviour exactly, and the Command Palette entry is additive. The `openInNewWindow.open` command ID is unchanged. Deliver as version `0.1.1`; roll back by reverting the release, which restores the previous menu and palette state.

## Open Questions

- Which URI scheme `showOpenDialog` returns in Remote-SSH, WSL and container windows. Both supported schemes are handled, so this cannot change the spec; task 1.2 verifies both in tests and the observed scheme remains under Verification gaps.
- ~~Whether `vscode.openFolder` normalises a `.code-workspace` URI to `workspaceUri` itself or filters non-directories.~~ Answered (task 1.1, see the "Workspace files are a third target kind in `planOpen`" decision): the command normalises by extension — a URI ending in `.code-workspace` is passed to the workbench as `{ workspaceUri }`; the non-directory stat filtering applies only to the native-picker path, not to the explicit-URI path this extension uses.

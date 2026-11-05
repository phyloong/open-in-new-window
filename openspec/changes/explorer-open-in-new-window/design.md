# Design

## Context

See proposal.md - Why. The repository currently has a scaffold and one placeholder command; no behaviour is specified yet. The extension targets engine `^1.104.0` and is also exercised against VS Code 1.144.

Two platform facts shape the approach, both confirmed by reading the installed 1.144 workbench bundle rather than from documentation:

- `vscode.openFolder` is a built-in command, not a typed API function; `@types/vscode` has no declaration for it. Its command metadata accepts `forceNewWindow`, `forceReuseWindow`, `noRecentEntry`, `forceProfile`, `forceTempProfile`, `forceLocalWindow` and `filesToOpen`.
- The first argument is normalized to `{ folderUri }` or `{ workspaceUri }`, and non-directories are filtered out by a `stat` check. There is no built-in command that opens an arbitrary file path in a window without a folder; the built-in `openFileInNewWindow` opens a file picker instead.

## Goals / Non-Goals

**Goals:**

- One mechanism for both targets, so folder and file behaviour cannot drift apart.
- The new window's host identity is derived from the originating window, never from a setting.
- The implementation stays inside documented-on-the-command-surface options; no underscore-prefixed private commands.

**Non-Goals:**

- Converting between environments (local to WSL, WSL to SSH). The target is always the same host.
- Carrying editor state (open files, cursor, layout) into the new window.
- Making `.code-workspace` files open as workspaces; in this change they are treated as ordinary files.
- Guaranteeing a window with no workspace root for the file case.

## Decisions

### One command, one menu entry, two branches

A single command `openInNewWindow.open` is registered and contributed to `explorer/context`. The Explorer supplies the clicked URI as the first argument, so the handler never inspects the active editor. Folder and file are distinguished with `workspace.fs.stat` at invocation time rather than by separate command IDs, because a separate ID per type needs duplicate menu entries that can disagree with each other.

Alternative rejected: two commands with complementary `explorerResourceIsFolder` when-clauses. It duplicates the label and doubles the chance that one branch is hidden by a context-key bug.

### Folder target uses `vscode.openFolder`

`executeCommand('vscode.openFolder', folderUri, { forceNewWindow: true })`. This is the only mechanism that both targets a specific folder and guarantees a separate window. The option is not in the typed API, so the call site is isolated in one module. The decision around it (`planOpen`) is unit-tested; the `executeCommand` line itself is not, because running it in the test host would spawn a window.

### File target opens the containing folder with `filesToOpen`

`executeCommand('vscode.openFolder', parentFolderUri, { forceNewWindow: true, filesToOpen: [fileUri] })`. The `filesToOpen` option is declared in the command's own metadata as "files to open in the new window", which makes it a lower risk than the alternatives below. The accepted consequence is a workspace root the user did not ask for; it is recorded in the spec as an allowed outcome rather than a promised one.

The folder/file split lives in a pure `planOpen(target, isDirectory)` function so the decision is unit-tested; only the single `executeCommand` call is left without a test, because the test host cannot observe a new window.

Alternatives rejected:

- `env.openExternal('vscode://file/...')`: documented, but the receiving instance decides whether to reuse an existing window. If the file's folder is already open, the action can silently do nothing visible, which defeats the purpose.
- `_files.windowOpen` with `{ fileUri }`: private command, and it returns no signal that distinguishes "opened" from "dropped", so a runtime fallback is impossible.
- Letting VS Code's file picker open in a new window: needs user interaction and loses the right-click target.

### Hide the command from the Command Palette

`menus.commandPalette` sets `when: false` because the handler needs the URI the Explorer passes; invoked from the palette it has no target and can only do nothing. The command id stays contributed, so keybindings and other extensions can still call it with a resource.

### The host is inherited, not reconstructed

The resource URI is passed to `vscode.openFolder` unchanged. The command ends in the workbench's `WindowsMainService.doOpenWindow`, which copies the current window's authority into the new window whenever the caller leaves `remoteAuthority` undefined:

```js
const authority = this.environmentService.remoteAuthority;
if (authority && options?.remoteAuthority === undefined) {
  options = { ...options, remoteAuthority: authority };
}
```

So the new window lands on the same host without the extension ever naming it. This replaced an earlier implementation that resolved the authority through `env.asExternalUri` and rebuilt a `vscode-remote://` URI; in a real Remote-SSH window that call returns no remote segment, and the command failed with "Cannot determine the remote authority for this window". Reconstructing the authority is not possible from the public API in any case: `env.remoteName` yields only the remote type (`wsl`, `ssh-remote`), and neither the 1.104 nor the 1.145 type definitions expose a `remoteAuthority` member.

Alternatives rejected: `env.asExternalUri` plus string rewriting (fails in Remote-SSH, observed); reading an undocumented `env~ property (not part of the public surface).

### The type probe needs a file URI

`workspace.fs.stat` is called with the resource reduced to `file:` and with the authority cleared when the Explorer reports a `vscode-remote:` resource, because the window's file service resolves `file:` against its own disk. Only the probe uses that reduced URI; the original resource is what reaches `vscode.openFolder`, so the reduction never becomes the window's target.

### Accept both `file` and `vscode-remote` resources

Menu visibility is controlled by `(resourceScheme == file || resourceScheme == 'vscode-remote') && !listMultiSelection`, and the handler accepts the same two schemes. Official documentation does not state which scheme a remote window reports for Explorer resources, and both shapes are plausible. Supporting both costs one predicate: either shape is handed to `vscode.openFolder` untouched, and the workbench supplies the authority. Disabling the item was rejected because it would leave a dead entry for virtual file systems, where opening a window is impossible.

## Risks / Trade-offs

- **Undocumented command options can change.** Mitigation: both call sites live in one module, and the integration test fails loudly if the command stops accepting the arguments.
- **`filesToOpen` in a remote window is unverified.** The URI is passed through unchanged and the window carries the remote authority, so the file should resolve on the remote, but that has not been observed. Observed in Remote-SSH and WSL. There is no runtime signal that would let the handler detect a failure and fall back, so a regression shows up as a window without the file and only the manual matrix catches it.
- **Authority inheritance is workbench behaviour, not a documented API.** `doOpenWindow` copying `environmentService.remoteAuthority` is verified in the 1.144 and 1.145 bundles, but it is not in the extension API contract. Mitigation: the handler has no authority-specific code to break; a regression shows up as a local window and is caught by the manual matrix.
- **The supported scheme policy appears in three places.** The manifest when-clause, the handler guard and the stat probe must agree. Mitigation: the spec delta names the two accepted schemes, so adding one forces a spec change that lists all three sites in its tasks.
- **Repeated invocations create duplicate windows.** VS Code's own "Open Recent" has the same behaviour, and the spec explicitly requires a new window over focusing an existing one.
- **Container and tunnel authorities are untested.** The mechanism is authority-agnostic, but only WSL and SSH are in the verification scope of this change.

- **Authority inheritance is verified on Windows, Remote-SSH and WSL.** Each host was checked in a real window; nothing about it is covered by an automated test.

## Migration Plan

The placeholder `openInNewWindow.helloWorld` command and its test are removed in the same change. No published extension exists, so there is no migration for users.

## Open Questions

- Whether a future change can offer a file-only window (no workspace root) through an internal command once a reliable success signal exists. Deferring it does not change this change's requirements.

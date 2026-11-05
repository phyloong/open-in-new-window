# open-in-new-window Specification

## Purpose
Lets a user open the file or folder they right-click in the Explorer in a separate window on the same host, so a second workspace does not replace the one they are already working in.

## Requirements

### Requirement: Explorer context menu action

The extension SHALL contribute exactly one action labelled "Open in New Window" to the Explorer context menu for resources addressed with the `file` or `vscode-remote` scheme. Resources on any other scheme are excluded.

#### Scenario: Action shown for a file

- **WHEN** the user right-clicks a file in the Explorer
- **THEN** the context menu contains "Open in New Window"

#### Scenario: Action shown for a folder

- **WHEN** the user right-clicks a folder, including a workspace root, in the Explorer
- **THEN** the context menu contains "Open in New Window"

#### Scenario: Action shown in a remote window

- **WHEN** the user right-clicks a resource in a window connected to a remote host
- **THEN** the context menu contains "Open in New Window"

#### Scenario: Action hidden for virtual resources

- **WHEN** the right-clicked resource comes from a file system whose URI scheme is neither `file` nor `vscode-remote`
- **THEN** the context menu does not contain "Open in New Window"

#### Scenario: Action hidden for multi-selection

- **WHEN** more than one Explorer resource is selected
- **THEN** the context menu does not contain "Open in New Window"

#### Scenario: Action absent from the Command Palette

- **WHEN** the user opens the Command Palette
- **THEN** "Open in New Window" is not listed there, because the action needs a resource selected in the Explorer

### Requirement: Unreadable targets are reported

The extension SHALL show an error message and open no window when the clicked resource cannot be read.

#### Scenario: Target disappears before invocation

- **WHEN** the action runs on a resource that no longer exists
- **THEN** an error message is shown and no window is opened

### Requirement: Clicked resource is the target

The action SHALL operate on the resource passed by the Explorer context menu, and SHALL NOT fall back to the document of the active editor.

#### Scenario: Clicked file differs from the active editor

- **WHEN** the user right-clicks a file that is not open in any editor
- **THEN** the new window opens that file, not the file currently shown in the active editor

#### Scenario: Clicked folder while editing elsewhere

- **WHEN** the user right-clicks a folder while a file from a different folder is the active editor
- **THEN** the new window opens the clicked folder

### Requirement: Opening a folder

When the target is a folder, the extension SHALL open a new window whose workspace root is that folder.

#### Scenario: Folder becomes the workspace root

- **WHEN** the action runs on a folder
- **THEN** a new window opens with that folder as its single workspace root

#### Scenario: Originating window is left intact

- **WHEN** the action runs on any target
- **THEN** the originating window keeps its workspace, editors and unsaved changes

#### Scenario: Folder already open in another window

- **WHEN** the target folder is already the workspace root of another window
- **THEN** the action still opens a new window instead of focusing the existing one

### Requirement: Opening a file

When the target is a file, the extension SHALL open a new window with that file visible in the editor area. That window's workspace root MUST be either the file's containing folder or absent, and MUST NOT be any other folder.

#### Scenario: File is visible in the new window

- **WHEN** the action runs on a file
- **THEN** the new window shows that file in the editor area

#### Scenario: No unrelated workspace root

- **WHEN** the action runs on a file
- **THEN** the new window does not open a workspace root other than the file's containing folder

### Requirement: Same host as the originating window

The new window SHALL be connected to the same host as the originating window: a local window produces a local window, and a remote window stays on the same remote authority.

#### Scenario: Local window

- **WHEN** the action runs in a window with no remote connection
- **THEN** the new window opens locally

#### Scenario: WSL window

- **WHEN** the action runs in a window connected to a WSL distribution
- **THEN** the new window is connected to the same distribution

#### Scenario: SSH window

- **WHEN** the action runs in a window connected to a remote host over SSH
- **THEN** the new window is connected to the same host

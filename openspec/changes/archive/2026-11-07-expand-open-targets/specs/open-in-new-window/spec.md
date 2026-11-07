# Spec Delta

## REMOVED Requirements

### Requirement: Explorer context menu action

**Reason**: This requirement asserted that the item is hidden for multi-selection and absent from the Command Palette, both of which this change reverses. Retaining its scenario names while changing their outcomes would leave contradictory scenario titles in the shipped spec.

**Migration**: Replaced by "Explorer and Command Palette action" in the same capability. No user action is needed; the default setting preserves the previous menu visibility.

## MODIFIED Requirements

### Requirement: Unreadable targets are reported

The extension SHALL show an error message and open no window for a target that cannot be read.

#### Scenario: Target disappears before invocation

- **WHEN** the action runs on a resource that no longer exists
- **THEN** an error message is shown and no window is opened

#### Scenario: Picker target disappears before opening

- **WHEN** a target chosen in the Command Palette picker no longer exists when the action opens it
- **THEN** an error message is shown and no window is opened for that target

### Requirement: Clicked resource is the target

When the action is invoked from the Explorer, it SHALL operate on the resource or resources passed by the Explorer context menu, and SHALL NOT fall back to the document of the active editor.

#### Scenario: Clicked file differs from the active editor

- **WHEN** the user right-clicks a file that is not open in any editor
- **THEN** the new window opens that file, not the file currently shown in the active editor

#### Scenario: Clicked folder while editing elsewhere

- **WHEN** the user right-clicks a folder while a file from a different folder is the active editor
- **THEN** the new window opens the clicked folder

### Requirement: Opening a file

When the target is a file that is not a `.code-workspace` file, the extension SHALL open a new window with that file visible in the editor area. That window's workspace root MUST be either the file's containing folder or absent, and MUST NOT be any other folder.

#### Scenario: File is visible in the new window

- **WHEN** the action runs on a file that is not a `.code-workspace` file
- **THEN** the new window shows that file in the editor area

#### Scenario: No unrelated workspace root

- **WHEN** the action runs on a file that is not a `.code-workspace` file
- **THEN** the new window does not open a workspace root other than the file's containing folder

## ADDED Requirements

### Requirement: Explorer and Command Palette action

The extension SHALL contribute exactly one action labelled "Open in New Window" to the Explorer context menu for resources addressed with the `file` or `vscode-remote` scheme, and SHALL list that action in the Command Palette. Resources on any other scheme are excluded. The visibility of the item for a multi-selection SHALL be controlled by the `openInNewWindow.allowMultiSelection` setting, whose default is `false`.

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

#### Scenario: Action hidden for multi-selection by default

- **WHEN** more than one Explorer resource is selected and `openInNewWindow.allowMultiSelection` is at its default
- **THEN** the context menu does not contain "Open in New Window"

#### Scenario: Action shown for multi-selection when enabled

- **WHEN** more than one Explorer resource is selected and `openInNewWindow.allowMultiSelection` is `true`
- **THEN** the context menu contains "Open in New Window"

#### Scenario: Action listed in the Command Palette

- **WHEN** the user opens the Command Palette
- **THEN** "Open in New Window" is listed there

### Requirement: Multi-target setting

The extension SHALL contribute a boolean setting `openInNewWindow.allowMultiSelection` whose default value is `false`. The setting SHALL govern multi-selection across every invocation source: Explorer menu visibility, the Command Palette picker's ability to select several targets, and whether several targets are opened in one invocation.

#### Scenario: Default value limits an invocation to one target

- **WHEN** the user has not changed the setting
- **THEN** its value is `false` and one invocation opens at most one window

#### Scenario: Enabled value allows several targets

- **WHEN** the user sets `openInNewWindow.allowMultiSelection` to `true`
- **THEN** the Explorer item is shown for multi-selection and the Command Palette picker accepts several targets

### Requirement: Command Palette target selection

Invoking the action without a resource argument SHALL show a file picker that accepts a folder, a file or a `.code-workspace` file. Cancelling the picker SHALL open no window and show no error. The picker SHALL allow several targets only when `openInNewWindow.allowMultiSelection` is `true`.

#### Scenario: Picker shown for an argumentless invocation

- **WHEN** the action is invoked from the Command Palette or a keyboard shortcut with no resource argument
- **THEN** a file picker is shown that accepts folders, files and `.code-workspace` files

#### Scenario: Picker is cancelled

- **WHEN** the user cancels the file picker
- **THEN** no window is opened and no error is shown

#### Scenario: Picker offers one target by default

- **WHEN** the setting is at its default and the user picks one target
- **THEN** one new window is opened for that target

#### Scenario: Picker offers several targets when enabled

- **WHEN** the setting is `true` and the user picks several targets
- **THEN** a new window is opened for each target

#### Scenario: Picker target stays on the same host

- **WHEN** the picker is used in a window connected to a remote host
- **THEN** the new window is connected to that same host

### Requirement: Explorer multi-selection

When `openInNewWindow.allowMultiSelection` is `true` and the action is invoked on an Explorer multi-selection, the extension SHALL open one new window for each selected resource addressed with the `file` or `vscode-remote` scheme. Selected resources on any other scheme SHALL be excluded.

#### Scenario: Several selected resources

- **WHEN** the setting is `true` and the action is invoked on a multi-selection of files and folders
- **THEN** a new window opens for each selected resource

#### Scenario: Mixed supported and virtual resources

- **WHEN** the multi-selection contains a `file:` resource and a resource from a virtual file system
- **THEN** a window opens for the `file:` resource and no window opens for the virtual one

### Requirement: Opening a workspace file

When the target is a `.code-workspace` file, the extension SHALL open a new window whose workspace is that file. It SHALL NOT use the file's containing folder as the workspace root and SHALL NOT reveal the file as an editor.

#### Scenario: Workspace file from the Explorer

- **WHEN** the action runs on a `.code-workspace` file in the Explorer
- **THEN** the new window opens with that workspace file applied

#### Scenario: Workspace file from the Command Palette picker

- **WHEN** the user picks a `.code-workspace` file in the Command Palette picker
- **THEN** the new window opens with that workspace file applied

#### Scenario: Containing folder is not the workspace root

- **WHEN** the action runs on a `.code-workspace` file
- **THEN** the new window's workspace root is not that file's containing folder

import * as vscode from 'vscode';
import { extname } from 'node:path';
import { parentOf } from './paths';

export interface OpenPlan {
  readonly folderUri: vscode.Uri;
  readonly filesToOpen: readonly vscode.Uri[];
}

const WORKSPACE_FILE_EXTENSION = '.code-workspace';

/**
 * Whether the target is a workspace file. Mirrors the workbench's own check
 * for `vscode.openFolder`: the command compares the URI's extension against
 * `.code-workspace` with `path.extname`, so this check does the same. A name
 * such as `.code-workspace` has no extension and is therefore not a workspace
 * file to either side.
 */
export function isWorkspaceFile(target: vscode.Uri): boolean {
  return extname(target.path) === WORKSPACE_FILE_EXTENSION;
}

/**
 * Decides what a new window should open for a target. The directory decision
 * comes from the stat result, never from an extension: a directory takes
 * precedence over every name-based branch. A folder target is its own
 * workspace root; a file target opens its containing folder with the file
 * revealed, because VS Code cannot open a file without a folder. A
 * `.code-workspace` target is the workspace root itself: `vscode.openFolder`
 * normalises that URI to `{ workspaceUri }`, so it is passed through
 * unchanged and revealed as no file.
 */
export function planOpen(target: vscode.Uri, fileType: vscode.FileType): OpenPlan {
  if ((fileType & vscode.FileType.Directory) !== 0) {
    return { folderUri: target, filesToOpen: [] };
  }

  if (isWorkspaceFile(target)) {
    return { folderUri: target, filesToOpen: [] };
  }

  return { folderUri: parentOf(target), filesToOpen: [target] };
}

/**
 * Normalises every invocation source into a list of target URIs.
 *
 * - Explorer single selection: the clicked URI plus the selected array that
 *   contains it.
 * - Explorer multi-selection: the clicked URI plus an array with several
 *   entries.
 * - Command Palette picker: no URI argument; the picker result (an array, or
 *   `undefined` when cancelled) is passed as the second parameter.
 * - Another command passing a single URI: the URI with no array.
 *
 * A blank-space context menu passes an empty object instead of a URI and an
 * empty array; that yields `undefined`. `undefined` means "nothing to open":
 * the caller must not fall back to the active editor or to any other
 * resource. When `allowMultiSelection` is false an incoming list is truncated
 * to the clicked resource, or to its first entry when no clicked resource was
 * passed, so one invocation opens at most one target.
 */
export function normalizeTargets(
  resource?: unknown,
  selected?: unknown,
  allowMultiSelection?: boolean
): vscode.Uri[] | undefined {
  let targets: vscode.Uri[] | undefined;

  if (resource instanceof vscode.Uri) {
    const selectedList = asUriList(selected);
    targets = selectedList && selectedList.length > 0 ? selectedList : [resource];
  } else {
    targets = asUriList(selected);
  }

  if (!targets || targets.length === 0) {
    return undefined;
  }

  if (allowMultiSelection) {
    return targets;
  }

  // The Explorer's selected array is ordered by selection, not by the
  // right-clicked resource, so keep the clicked URI when it is available.
  return resource instanceof vscode.Uri ? [resource] : targets.slice(0, 1);
}

function asUriList(candidate: unknown): vscode.Uri[] | undefined {
  if (!Array.isArray(candidate)) {
    return undefined;
  }

  return candidate.filter((entry): entry is vscode.Uri => entry instanceof vscode.Uri);
}

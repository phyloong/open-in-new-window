import * as vscode from 'vscode';
import { parentOf } from './paths';

export interface OpenPlan {
  readonly folderUri: vscode.Uri;
  readonly filesToOpen: readonly vscode.Uri[];
}

/**
 * Decides which folder a new window should open and which files it should
 * reveal. A folder target is its own workspace root; a file target opens its
 * containing folder, because VS Code cannot open a file without one.
 */
export function planOpen(target: vscode.Uri, fileType: vscode.FileType): OpenPlan {
  if ((fileType & vscode.FileType.Directory) !== 0) {
    return { folderUri: target, filesToOpen: [] };
  }

  return { folderUri: parentOf(target), filesToOpen: [target] };
}

import * as vscode from 'vscode';

const SECTION = 'openInNewWindow';

/**
 * Reads `openInNewWindow.allowMultiSelection`. This is the single runtime
 * decision for multi-selection: the Explorer when-clause and the picker's
 * `canSelectMany` are projections of it, never the sole guard.
 */
export function isAllowMultiSelection(): boolean {
  return vscode.workspace
    .getConfiguration(SECTION)
    .get<boolean>('allowMultiSelection', false);
}

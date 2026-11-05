import * as vscode from 'vscode';
import { planOpen } from '../core/plan';
import { isSupportedResource, toStatUri } from '../core/paths';

/**
 * Opens the resource passed by the Explorer context menu in a separate window
 * on the same host.
 *
 * The URI is handed over untouched: `vscode.openFolder` goes through the
 * workbench's `openWindow`, which copies the current window's remote
 * authority into the new window when the caller leaves it undefined. Rebuilding
 * a `vscode-remote://` URI here would require an authority the public API
 * does not expose.
 */
export async function openInNewWindow(resource?: vscode.Uri): Promise<void> {
  if (!resource || !isSupportedResource(resource)) {
    return;
  }

  try {
    const stat = await vscode.workspace.fs.stat(toStatUri(resource));
    const plan = planOpen(resource, stat.type);

    await vscode.commands.executeCommand('vscode.openFolder', plan.folderUri, {
      forceNewWindow: true,
      filesToOpen: plan.filesToOpen
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`Open in New Window failed: ${message}`);
  }
}

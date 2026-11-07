import * as vscode from 'vscode';
import { normalizeTargets, planOpen, OpenPlan } from '../core/plan';
import { isSupportedResource, toStatUri } from '../core/paths';
import { isAllowMultiSelection } from '../config/settings';

/** Metadata handed to `vscode.openFolder`. */
export interface OpenOptions {
  readonly forceNewWindow: true;
  readonly filesToOpen: readonly vscode.Uri[];
}

/**
 * Replaceable edges of the handler. The defaults are the only code that talks
 * to the workbench or the user; tests replace them so the argumentless picker
 * shape can be exercised without a modal dialog blocking the test host.
 */
export interface OpenInNewWindowSeams {
  pickTargets?(options: vscode.OpenDialogOptions): Thenable<readonly vscode.Uri[] | undefined>;
  openTarget?(plan: OpenPlan, options: OpenOptions): Thenable<unknown>;
  reportError?(message: string): void;
}

/**
 * Opens one or more targets in separate windows on the same host.
 *
 * The handler is a thin adapter over the invocation sources:
 *
 * - Invoked without arguments (Command Palette, keyboard shortcut), it shows
 *   a file picker that accepts folders, ordinary files and `.code-workspace`
 *   files. No `defaultUri` and no `filters` are set: the picker must accept
 *   every target kind, and seeding it would read as a fallback target.
 * - Invoked with arguments (Explorer context menu, another command), it
 *   normalises them into a list of targets and never falls back to the active
 *   editor.
 *
 * Every target is processed independently: a target that cannot be read
 * reports an error and opens no window, while the remaining targets continue.
 *
 * The URI is handed over untouched: `vscode.openFolder` goes through the
 * workbench's `openWindow`, which copies the current window's remote
 * authority into the new window when the caller leaves it undefined. Rebuilding
 * a `vscode-remote://` URI here would require an authority the public API does
 * not expose. The default picker call and the single `executeCommand` call are
 * the only untested lines; every decision runs through the tested core.
 */
export function createOpenInNewWindow(
  seams: OpenInNewWindowSeams = {}
): (...args: unknown[]) => Promise<void> {
  const pickTargets =
    seams.pickTargets ??
    ((options: vscode.OpenDialogOptions) => vscode.window.showOpenDialog(options));

  const openTarget =
    seams.openTarget ??
    ((plan: OpenPlan, options: OpenOptions) =>
      vscode.commands.executeCommand('vscode.openFolder', plan.folderUri, options));

  const reportError =
    seams.reportError ??
    ((message: string) => {
      void vscode.window.showErrorMessage(message);
    });

  return async (...args: unknown[]): Promise<void> => {
    const allowMultiSelection = isAllowMultiSelection();
    let targets: readonly vscode.Uri[] | undefined;

    if (args.length === 0) {
      const picked = await pickTargets({
        canSelectFiles: true,
        canSelectFolders: true,
        canSelectMany: allowMultiSelection
      });
      targets = normalizeTargets(undefined, picked, allowMultiSelection);
    } else {
      targets = normalizeTargets(args[0], args[1], allowMultiSelection);
    }

    if (!targets) {
      return;
    }

    for (const target of targets) {
      if (!isSupportedResource(target)) {
        continue;
      }

      try {
        const stat = await vscode.workspace.fs.stat(toStatUri(target));
        const plan = planOpen(target, stat.type);
        const options: OpenOptions = {
          forceNewWindow: true,
          filesToOpen: plan.filesToOpen
        };

        await openTarget(plan, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        reportError(`Open in New Window failed: ${message}`);
      }
    }
  };
}

export const openInNewWindow = createOpenInNewWindow();

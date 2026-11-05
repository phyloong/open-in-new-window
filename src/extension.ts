import * as vscode from 'vscode';
import { openInNewWindow } from './commands/openInNewWindow';

const OPEN_COMMAND = 'openInNewWindow.open';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.commands.registerCommand(OPEN_COMMAND, openInNewWindow));
}

export function deactivate(): void {}

import * as vscode from 'vscode';

const SAMPLE_COMMAND = 'openInNewWindow.helloWorld';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(SAMPLE_COMMAND, () => {
      void vscode.window.showInformationMessage('Open in New Window is active.');
    })
  );
}

export function deactivate(): void {}

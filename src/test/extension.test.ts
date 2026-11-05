import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension host', () => {
  test('activates and registers the sample command', async () => {
    const extension = vscode.extensions.all.find(
      (candidate) => candidate.packageJSON.name === 'open-in-new-window'
    );

    assert.ok(extension, 'extension should be discoverable by name');
    await extension.activate();

    assert.strictEqual(extension.isActive, true);
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('openInNewWindow.helloWorld'));
  });
});

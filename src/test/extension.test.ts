import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension host', () => {
  test('activates and registers the open command', async () => {
    const extension = vscode.extensions.all.find(
      (candidate) => candidate.packageJSON.name === 'new-window-here'
    );

    assert.ok(extension, 'extension should be discoverable by name');
    await extension.activate();

    assert.strictEqual(extension.isActive, true);
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('openInNewWindow.open'), 'open command should be registered');
    assert.ok(
      !commands.includes('openInNewWindow.helloWorld'),
      'placeholder command should be gone'
    );
  });
});

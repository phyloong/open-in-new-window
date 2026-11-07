import * as assert from 'assert';
import * as vscode from 'vscode';

interface ExtensionManifest {
  contributes?: {
    commands?: { command: string; title: string }[];
    configuration?: {
      properties?: Record<string, { type: string; default: unknown; description?: string }>;
    };
    menus?: {
      'explorer/context'?: { command: string; when?: string }[];
      commandPalette?: { command: string; when?: string }[];
    };
  };
}

async function activateUnderTest(): Promise<vscode.Extension<unknown> & { packageJSON: ExtensionManifest }> {
  const extension = vscode.extensions.all.find(
    (candidate) => candidate.packageJSON.name === 'new-window-here'
  );

  assert.ok(extension, 'extension should be discoverable by name');
  await extension.activate();

  return extension as vscode.Extension<unknown> & { packageJSON: ExtensionManifest };
}

suite('Extension host', () => {
  test('activates and registers the open command', async () => {
    const extension = await activateUnderTest();

    assert.strictEqual(extension.isActive, true);
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('openInNewWindow.open'), 'open command should be registered');
    assert.ok(
      !commands.includes('openInNewWindow.helloWorld'),
      'placeholder command should be gone'
    );
  });

  test('contributes the multi-selection setting with a false default', async () => {
    const extension = await activateUnderTest();
    const property = extension.packageJSON.contributes?.configuration?.properties?.[
      'openInNewWindow.allowMultiSelection'
    ];

    assert.ok(property, 'allowMultiSelection should be contributed');
    assert.strictEqual(property.type, 'boolean');
    assert.strictEqual(property.default, false);
    assert.ok(property.description, 'the setting should carry a description');

    const runtime = vscode.workspace
      .getConfiguration('openInNewWindow')
      .get<boolean>('allowMultiSelection');
    assert.strictEqual(runtime, false, 'the runtime default should be false');
  });

  test('lists the command in the Command Palette instead of hiding it', async () => {
    const extension = await activateUnderTest();
    const palette: { command: string; when?: string }[] =
      extension.packageJSON.contributes?.menus?.commandPalette ?? [];
    const hidden = palette.find((entry) => entry.command === 'openInNewWindow.open');

    assert.ok(!hidden, 'the palette must not hide the open command');
  });

  test('shows the Explorer item for a multi-selection only when the setting allows it', async () => {
    const extension = await activateUnderTest();
    const explorer: { command: string; when?: string }[] =
      extension.packageJSON.contributes?.menus?.['explorer/context'] ?? [];
    const entry = explorer.find((candidate) => candidate.command === 'openInNewWindow.open');

    assert.ok(entry, 'the Explorer entry should be contributed');
    assert.ok(
      entry.when?.includes('resourceScheme == file'),
      'the when-clause should accept file resources'
    );
    assert.ok(
      entry.when?.includes("resourceScheme == 'vscode-remote'"),
      'the when-clause should accept remote resources'
    );
    assert.ok(
      entry.when?.includes('!listMultiSelection ||'),
      'the when-clause should hide the item for a default multi-selection'
    );
    assert.ok(
      entry.when?.includes('config.openInNewWindow.allowMultiSelection'),
      'the when-clause should honour the setting'
    );
  });
});

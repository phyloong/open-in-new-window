import * as assert from 'assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { createOpenInNewWindow, OpenOptions } from '../commands/openInNewWindow';
import { OpenPlan } from '../core/plan';

interface Recorder {
  readonly picks: vscode.OpenDialogOptions[];
  readonly plans: OpenPlan[];
  readonly options: OpenOptions[];
  readonly errors: string[];
}

function createRecorder(): Recorder {
  return { picks: [], plans: [], options: [], errors: [] };
}

suite('Open in New Window handler', () => {
  let tempDir: string;

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createTempFile(name: string): vscode.Uri {
    const file = path.join(tempDir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
    return vscode.Uri.file(file);
  }

  function createTempFolder(name: string): vscode.Uri {
    const folder = path.join(tempDir, name);
    fs.mkdirSync(folder, { recursive: true });
    return vscode.Uri.file(folder);
  }

  function createHandler(
    recorder: Recorder,
    picked: readonly vscode.Uri[] | undefined
  ): (...args: unknown[]) => Promise<void> {
    return createOpenInNewWindow({
      pickTargets: async (options) => {
        recorder.picks.push(options);
        return picked;
      },
      openTarget: async (plan, options) => {
        recorder.plans.push(plan);
        recorder.options.push(options);
      },
      reportError: (message) => {
        recorder.errors.push(message);
      }
    });
  }

  async function withAllowMultiSelection(
    value: boolean | undefined,
    run: () => Promise<void>
  ): Promise<void> {
    const configuration = vscode.workspace.getConfiguration('openInNewWindow');
    await configuration.update('allowMultiSelection', value, vscode.ConfigurationTarget.Global);
    try {
      await run();
    } finally {
      await configuration.update('allowMultiSelection', undefined, vscode.ConfigurationTarget.Global);
    }
  }

  test('asks the picker for one target by default and opens nothing when it is cancelled', async () => {
    await withAllowMultiSelection(undefined, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, undefined);

      await handler();

      assert.strictEqual(recorder.picks.length, 1);
      assert.strictEqual(recorder.picks[0].canSelectFiles, true);
      assert.strictEqual(recorder.picks[0].canSelectFolders, true);
      assert.strictEqual(recorder.picks[0].canSelectMany, false);
      assert.strictEqual(recorder.picks[0].defaultUri, undefined);
      assert.strictEqual(recorder.picks[0].filters, undefined);
      assert.strictEqual(recorder.plans.length, 0);
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('opens one window per picked target when multi-selection is enabled', async () => {
    const first = createTempFile('first.ts');
    const second = createTempFile('second.ts');

    await withAllowMultiSelection(true, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, [first, second]);

      await handler();

      assert.strictEqual(recorder.picks.length, 1);
      assert.strictEqual(recorder.picks[0].canSelectMany, true);
      assert.strictEqual(recorder.plans.length, 2);
      assert.strictEqual(recorder.options.length, 2);
      for (const options of recorder.options) {
        assert.strictEqual(options.forceNewWindow, true);
      }
      assert.deepStrictEqual(
        recorder.plans.map((plan) => plan.filesToOpen.map((uri) => uri.toString())),
        [[first.toString()], [second.toString()]]
      );
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('opens a picked folder as its own workspace root', async () => {
    const folder = createTempFolder('project');

    await withAllowMultiSelection(undefined, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, [folder]);

      await handler();

      assert.strictEqual(recorder.plans.length, 1);
      assert.strictEqual(recorder.plans[0].folderUri.toString(), folder.toString());
      assert.deepStrictEqual(recorder.plans[0].filesToOpen, []);
      assert.strictEqual(recorder.options[0].forceNewWindow, true);
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('opens a picked workspace file as the workspace itself', async () => {
    const workspaceFile = createTempFile('project.code-workspace');

    await withAllowMultiSelection(undefined, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, [workspaceFile]);

      await handler();

      assert.strictEqual(recorder.plans.length, 1);
      assert.strictEqual(recorder.plans[0].folderUri.toString(), workspaceFile.toString());
      assert.deepStrictEqual(recorder.plans[0].filesToOpen, []);
      assert.strictEqual(recorder.options[0].forceNewWindow, true);
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('reports an unreadable picked target and opens the remaining targets', async () => {
    const missing = vscode.Uri.file(path.join(tempDir, 'missing.ts'));
    const readable = createTempFile('readable.ts');

    await withAllowMultiSelection(true, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, [missing, readable]);

      await handler();

      assert.strictEqual(recorder.plans.length, 1);
      assert.deepStrictEqual(
        recorder.plans[0].filesToOpen.map((uri) => uri.toString()),
        [readable.toString()]
      );
      assert.strictEqual(recorder.errors.length, 1);
      assert.ok(recorder.errors[0].startsWith('Open in New Window failed: '));
    });
  });

  test('excludes a virtual picked target and opens the supported one', async () => {
    const virtual = vscode.Uri.parse('untitled:Untitled-1');
    const readable = createTempFile('readable.ts');

    await withAllowMultiSelection(true, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, [virtual, readable]);

      await handler();

      assert.strictEqual(recorder.plans.length, 1);
      assert.deepStrictEqual(
        recorder.plans[0].filesToOpen.map((uri) => uri.toString()),
        [readable.toString()]
      );
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('keeps a picked remote target on its host', async () => {
    const local = createTempFile('remote.ts');
    const remote = local.with({ scheme: 'vscode-remote', authority: 'wsl+Ubuntu' });

    await withAllowMultiSelection(undefined, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, [remote]);

      await handler();

      assert.strictEqual(recorder.plans.length, 1);
      assert.strictEqual(recorder.plans[0].folderUri.scheme, 'vscode-remote');
      assert.strictEqual(recorder.plans[0].folderUri.authority, 'wsl+Ubuntu');
      assert.deepStrictEqual(
        recorder.plans[0].filesToOpen.map((uri) => uri.toString()),
        [remote.toString()]
      );
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('opens the clicked Explorer resource, not the first selected one, when multi-selection is disabled', async () => {
    const first = createTempFile('first.ts');
    const clicked = createTempFile('clicked.ts');

    await withAllowMultiSelection(undefined, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, undefined);

      await handler(clicked, [first, clicked]);

      assert.strictEqual(recorder.picks.length, 0);
      assert.strictEqual(recorder.plans.length, 1);
      assert.deepStrictEqual(
        recorder.plans[0].filesToOpen.map((uri) => uri.toString()),
        [clicked.toString()]
      );
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('opens every selected Explorer resource when multi-selection is enabled', async () => {
    const first = createTempFile('first.ts');
    const second = createTempFile('second.ts');

    await withAllowMultiSelection(true, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, undefined);

      await handler(first, [first, second]);

      assert.strictEqual(recorder.picks.length, 0);
      assert.strictEqual(recorder.plans.length, 2);
      assert.deepStrictEqual(
        recorder.plans.map((plan) => plan.filesToOpen.map((uri) => uri.toString())),
        [[first.toString()], [second.toString()]]
      );
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('does nothing for a blank-space context menu invocation', async () => {
    await withAllowMultiSelection(undefined, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, undefined);

      await handler({}, []);

      assert.strictEqual(recorder.picks.length, 0);
      assert.strictEqual(recorder.plans.length, 0);
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('ignores a target on an unsupported scheme passed as an argument', async () => {
    await withAllowMultiSelection(undefined, async () => {
      const recorder = createRecorder();
      const handler = createHandler(recorder, undefined);

      await handler(vscode.Uri.parse('untitled:Untitled-1'));

      assert.strictEqual(recorder.plans.length, 0);
      assert.strictEqual(recorder.errors.length, 0);
    });
  });

  test('dispatches three targets sequentially without dropping any', async () => {
    const files = [
      createTempFile('one.ts'),
      createTempFile('two.ts'),
      createTempFile('three.ts')
    ];

    await withAllowMultiSelection(true, async () => {
      const recorder = createRecorder();
      let inFlight = 0;
      let maxInFlight = 0;
      const handler = createOpenInNewWindow({
        pickTargets: async () => files,
        openTarget: async (plan, options) => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          recorder.plans.push(plan);
          recorder.options.push(options);
          inFlight -= 1;
        },
        reportError: (message) => {
          recorder.errors.push(message);
        }
      });

      await handler();

      assert.strictEqual(maxInFlight, 1, 'targets should be opened sequentially');
      assert.deepStrictEqual(
        recorder.plans.map((plan) => plan.filesToOpen[0].toString()),
        files.map((uri) => uri.toString())
      );
      assert.strictEqual(recorder.errors.length, 0);
    });
  });
});

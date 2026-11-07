import * as assert from 'assert';
import * as vscode from 'vscode';
import { normalizeTargets, planOpen } from '../core/plan';

suite('Open plan', () => {
  test('opens a folder as its own workspace root', () => {
    const folder = vscode.Uri.parse('file:///home/user/project');
    const plan = planOpen(folder, vscode.FileType.Directory);
    assert.strictEqual(plan.folderUri.toString(), folder.toString());
    assert.deepStrictEqual(plan.filesToOpen, []);
  });

  test('opens a file together with its containing folder', () => {
    const file = vscode.Uri.parse('file:///home/user/project/src/a.ts');
    const plan = planOpen(file, vscode.FileType.File);
    assert.strictEqual(plan.folderUri.path, '/home/user/project/src');
    assert.deepStrictEqual(
      plan.filesToOpen.map((uri) => uri.toString()),
      [file.toString()]
    );
  });

  test('keeps a remote authority when planning a file', () => {
    const file = vscode.Uri.parse('vscode-remote://wsl%2BUbuntu/home/user/project/a.ts');
    const plan = planOpen(file, vscode.FileType.File);
    assert.strictEqual(plan.folderUri.scheme, 'vscode-remote');
    assert.strictEqual(plan.folderUri.authority, 'wsl+Ubuntu');
    assert.strictEqual(plan.folderUri.path, '/home/user/project');
  });

  test('opens the file system root for a file at the root', () => {
    const plan = planOpen(vscode.Uri.parse('file:///a.ts'), vscode.FileType.File);
    assert.strictEqual(plan.folderUri.path, '/');
  });

  test('keeps a windows drive root usable as the workspace of a file on it', () => {
    const plan = planOpen(vscode.Uri.parse('file:///c:/a.ts'), vscode.FileType.File);
    assert.strictEqual(plan.folderUri.path, '/c:/');
  });

  test('keeps a UNC server as the workspace of a file on a share', () => {
    const file = vscode.Uri.parse('file://server/share/project/a.ts');
    const plan = planOpen(file, vscode.FileType.File);
    assert.strictEqual(plan.folderUri.authority, 'server');
    assert.strictEqual(plan.folderUri.path, '/share/project');
  });

  test('opens a workspace file as the workspace itself, not as a file', () => {
    const workspaceFile = vscode.Uri.parse('file:///home/user/project.code-workspace');
    const plan = planOpen(workspaceFile, vscode.FileType.File);
    assert.strictEqual(plan.folderUri.toString(), workspaceFile.toString());
    assert.deepStrictEqual(plan.filesToOpen, []);
  });

  test('does not use the containing folder of a workspace file as the root', () => {
    const workspaceFile = vscode.Uri.parse('file:///home/user/project.code-workspace');
    const plan = planOpen(workspaceFile, vscode.FileType.File);
    assert.notStrictEqual(plan.folderUri.path, '/home/user');
  });

  test('opens a remote workspace file on its own host', () => {
    const workspaceFile = vscode.Uri.parse(
      'vscode-remote://wsl%2BUbuntu/home/user/project.code-workspace'
    );
    const plan = planOpen(workspaceFile, vscode.FileType.File);
    assert.strictEqual(plan.folderUri.scheme, 'vscode-remote');
    assert.strictEqual(plan.folderUri.authority, 'wsl+Ubuntu');
    assert.strictEqual(plan.folderUri.path, '/home/user/project.code-workspace');
    assert.deepStrictEqual(plan.filesToOpen, []);
  });

  test('treats a directory named like a workspace file as a folder', () => {
    const folder = vscode.Uri.parse('file:///home/user/project.code-workspace');
    const plan = planOpen(folder, vscode.FileType.Directory);
    assert.strictEqual(plan.folderUri.toString(), folder.toString());
    assert.deepStrictEqual(plan.filesToOpen, []);
  });

  test('treats a dotfile with the workspace suffix as an ordinary file', () => {
    const dotfile = vscode.Uri.parse('file:///home/user/.code-workspace');
    const plan = planOpen(dotfile, vscode.FileType.File);
    assert.strictEqual(plan.folderUri.path, '/home/user');
    assert.deepStrictEqual(
      plan.filesToOpen.map((uri) => uri.toString()),
      [dotfile.toString()]
    );
  });
});

suite('Target normalisation', () => {
  test('uses the selected array for an Explorer single selection', () => {
    const clicked = vscode.Uri.parse('file:///a.ts');
    const targets = normalizeTargets(clicked, [clicked], true);
    assert.deepStrictEqual(
      targets?.map((uri) => uri.toString()),
      ['file:///a.ts']
    );
  });

  test('keeps every entry of an Explorer multi-selection when allowed', () => {
    const first = vscode.Uri.parse('file:///a.ts');
    const second = vscode.Uri.parse('file:///b.ts');
    const targets = normalizeTargets(first, [first, second], true);
    assert.deepStrictEqual(
      targets?.map((uri) => uri.toString()),
      ['file:///a.ts', 'file:///b.ts']
    );
  });

  test('truncates a multi-selection to one target when not allowed', () => {
    const first = vscode.Uri.parse('file:///a.ts');
    const second = vscode.Uri.parse('file:///b.ts');
    const targets = normalizeTargets(first, [first, second], false);
    assert.deepStrictEqual(
      targets?.map((uri) => uri.toString()),
      ['file:///a.ts']
    );
  });

  test('truncates a multi-selection to the clicked resource when not allowed', () => {
    const first = vscode.Uri.parse('file:///a.ts');
    const clicked = vscode.Uri.parse('file:///b.ts');
    const targets = normalizeTargets(clicked, [first, clicked], false);
    assert.deepStrictEqual(
      targets?.map((uri) => uri.toString()),
      ['file:///b.ts']
    );
  });

  test('accepts a picker result array', () => {
    const first = vscode.Uri.parse('file:///a.ts');
    const second = vscode.Uri.parse('file:///folder/');
    const targets = normalizeTargets(undefined, [first, second], true);
    assert.deepStrictEqual(
      targets?.map((uri) => uri.toString()),
      ['file:///a.ts', 'file:///folder/']
    );
  });

  test('returns undefined for a cancelled picker', () => {
    assert.strictEqual(normalizeTargets(undefined, undefined, true), undefined);
    assert.strictEqual(normalizeTargets(undefined, undefined, false), undefined);
  });

  test('returns undefined for a blank-space context menu invocation', () => {
    assert.strictEqual(normalizeTargets({}, [], false), undefined);
    assert.strictEqual(normalizeTargets({}, [], true), undefined);
    assert.strictEqual(normalizeTargets({}), undefined);
  });

  test('wraps a single URI passed by another command', () => {
    const uri = vscode.Uri.parse('file:///a.ts');
    const targets = normalizeTargets(uri, undefined, false);
    assert.deepStrictEqual(
      targets?.map((candidate) => candidate.toString()),
      ['file:///a.ts']
    );
  });

  test('does not fall back to the active editor or any other resource', () => {
    assert.strictEqual(normalizeTargets(undefined, undefined, false), undefined);
    assert.strictEqual(normalizeTargets('file:///not-a-uri', undefined, false), undefined);
    assert.strictEqual(normalizeTargets({}, undefined, false), undefined);
  });
});

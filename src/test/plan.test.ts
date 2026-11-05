import * as assert from 'assert';
import * as vscode from 'vscode';
import { planOpen } from '../core/plan';

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
});

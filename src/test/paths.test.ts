import * as assert from 'assert';
import * as vscode from 'vscode';
import { isSupportedResource, parentOf, toStatUri } from '../core/paths';

suite('Path helpers', () => {
  test('returns the parent directory', () => {
    const parent = parentOf(vscode.Uri.parse('file:///home/user/project/a.ts'));
    assert.strictEqual(parent.path, '/home/user/project');
  });

  test('ignores a trailing slash when computing the parent', () => {
    const parent = parentOf(vscode.Uri.parse('file:///home/user/project/'));
    assert.strictEqual(parent.path, '/home/user');
  });

  test('keeps a windows drive root parent usable', () => {
    const parent = parentOf(vscode.Uri.parse('file:///c:/a.ts'));
    assert.strictEqual(parent.path, '/c:/');
  });

  test('returns the file system root for a file at the root', () => {
    const parent = parentOf(vscode.Uri.parse('file:///a.ts'));
    assert.strictEqual(parent.path, '/');
  });

  test('treats the root as its own parent', () => {
    const root = vscode.Uri.parse('file:///');
    assert.strictEqual(parentOf(root).toString(), root.toString());
  });

  test('accepts file and vscode-remote resources', () => {
    assert.strictEqual(isSupportedResource(vscode.Uri.parse('file:///a.ts')), true);
    assert.strictEqual(isSupportedResource(vscode.Uri.parse('vscode-remote://wsl%2BUbuntu/a.ts')), true);
    assert.strictEqual(isSupportedResource(vscode.Uri.parse('git:/a.ts')), false);
    assert.strictEqual(isSupportedResource(vscode.Uri.parse('untitled:Untitled-1')), false);
  });

  test('filters a mixed-scheme selection down to the supported schemes', () => {
    const mixed = [
      vscode.Uri.parse('file:///a.ts'),
      vscode.Uri.parse('vscode-remote://wsl%2Bubuntu/b.ts'),
      vscode.Uri.parse('git:/c.ts'),
      vscode.Uri.parse('untitled:Untitled-1'),
      vscode.Uri.parse('vscode-remote://ssh-remote%2Bhost/d.ts')
    ];
    const supported = mixed.filter(isSupportedResource);
    assert.deepStrictEqual(
      supported.map((uri) => uri.toString()),
      ['file:///a.ts', 'vscode-remote://wsl%2Bubuntu/b.ts', 'vscode-remote://ssh-remote%2Bhost/d.ts']
    );
  });

  test('leaves a file URI untouched before stat', () => {
    const uri = vscode.Uri.parse('file:///home/user/project/a.ts');
    assert.strictEqual(toStatUri(uri).toString(), uri.toString());
  });

  test('drops the authority when stat-ing a remote URI', () => {
    const stat = toStatUri(vscode.Uri.parse('vscode-remote://wsl%2BUbuntu/home/user/a.ts'));
    assert.strictEqual(stat.scheme, 'file');
    assert.strictEqual(stat.authority, '');
    assert.strictEqual(stat.path, '/home/user/a.ts');
  });
});

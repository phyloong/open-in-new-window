import * as vscode from 'vscode';

const SUPPORTED_SCHEMES = new Set(['file', 'vscode-remote']);

/** Whether the action can open resources from this URI's file system. */
export function isSupportedResource(uri: vscode.Uri): boolean {
  return SUPPORTED_SCHEMES.has(uri.scheme);
}

/**
 * Returns the parent directory of a URI. A file system root is its own parent,
 * so a file at the root of the file system opens that root as its workspace.
 */
export function parentOf(uri: vscode.Uri): vscode.Uri {
  const normalized = uri.path.length > 1 ? uri.path.replace(/\/+$/, '') : uri.path;
  const separator = normalized.lastIndexOf('/');

  if (normalized === '/' || separator < 0) {
    return uri;
  }

  const parentPath = separator === 0 ? '/' : normalized.slice(0, separator);
  const safeParent = /^\/[a-zA-Z]:$/.test(parentPath) ? `${parentPath}/` : parentPath;
  return uri.with({ path: safeParent });
}

/**
 * Returns a URI that the current window's file service can resolve. A
 * `vscode-remote` resource keeps its path but loses its authority, because
 * `workspace.fs` resolves `file:` against the window's own disk. Only the
 * probe uses this URI; the original one is what gets opened.
 */
export function toStatUri(uri: vscode.Uri): vscode.Uri {
  return uri.scheme === 'vscode-remote' ? uri.with({ scheme: 'file', authority: '' }) : uri;
}

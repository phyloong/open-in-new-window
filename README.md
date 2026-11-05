# Open in New Window

A VS Code extension that opens files, folders and remote contexts in a new window. The feature set is being defined through OpenSpec changes; see `openspec/changes/` and `openspec/specs/`.

## Development

Requirements: Node.js 20 or newer and VS Code 1.104 or newer.

`@bash
npm install
npm run compile      # type-check, lint, bundle to dist/
npm run watch        # esbuild + tsc in watch mode, used by F5
npm test             # integration tests in a downloaded VS Code host
npm run package      # production bundle, then VSIX via vsce
`@

Press F5 in VS Code to launch the Extension Development Host.

## Layout

`@
src/extension.ts        activation entry point
src/test/             integration tests (mocha, run by @vscode/test-cli)
dist/                 bundled extension (gitignored)
openspec/             specs and in-flight changes
`@

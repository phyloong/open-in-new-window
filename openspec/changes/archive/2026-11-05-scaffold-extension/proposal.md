# Proposal

## Why

The repository currently holds only OpenSpec configuration: no extension manifest, build, or test harness exists, so no behaviour can be implemented or verified. Every later change depends on a reproducible build and a way to run the extension inside a real VS Code host.

## What Changes

- Add a VS Code extension manifest (`package.json`) targeting engine `^1.104.0` with `main` at `./dist/extension.js` and the generator's sample command.
- Bundle the extension with esbuild (CommonJS, node platform, `vscode` marked external) into `dist/`.
- Type-check with TypeScript in strict mode (ES2022, module Node16) and lint with the flat ESLint config plus typescript-eslint.
- Add integration tests through `@vscode/test-cli` and `@vscode/test-electron` (mocha), compiled to `out/`.
- Add F5 launch configuration, background watch tasks, `.vscodeignore`, README, CHANGELOG, and `.gitignore`.

## Capabilities

### New Capabilities

None. This change is project tooling only and introduces no user-facing requirement, so the change sets `skip_specs: true`.

### Modified Capabilities

None.

## Impact

- Build, test and packaging workflow only; no shipped behaviour is defined here.
- Adds development dependencies (esbuild, eslint, typescript, typescript-eslint, `@vscode/test-cli`, `@vscode/test-electron`, mocha types, npm-run-all2).
- The placeholder command exists only to keep the manifest activatable and give F5 something to run; the first product change replaces it.

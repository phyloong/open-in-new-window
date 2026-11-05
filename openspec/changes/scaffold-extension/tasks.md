# Tasks

## 1. Manifest and compiler setup

- [x] 1.1 Create `package.json` with name, display name, engine `^1.104.0`, `main ./dist/extension.js`, the sample command contribution, and npm scripts for check-types, lint, compile, watch, compile-tests, test and package.
- [x] 1.2 Add `tsconfig.json` (strict, ES2022, module Node16, rootDir src) and `esbuild.js` (cjs, node platform, `vscode` external, minify on `--production`).
- [x] 1.3 Add `eslint.config.mjs` using typescript-eslint's flat config.

## 2. Test and editor harness

- [x] 2.1 Add `.vscode-test.mjs` pointing at `out/test/**/*.test.js`.
- [x] 2.2 Add `src/test/extension.test.ts` asserting the extension activates and the sample command is registered.
- [x] 2.3 Add `.vscode/launch.json`, `tasks.json`, `settings.json` and `extensions.json` for F5 and background watch builds.

## 3. Packaging and repository hygiene

- [x] 3.1 Add `.vscodeignore` excluding sources, tests, maps and tooling config from the VSIX.
- [x] 3.2 Add `.gitignore` covering `node_modules/`, `dist/`, `out/`, `.vscode-test/`, `*.vsix` and local editor state.
- [x] 3.3 Add `README.md` and `CHANGELOG.md` for the extension.

## 4. Verification

- [x] 4.1 Run `npm install` and keep `package-lock.json` under version control.
- [x] 4.2 `npm run check-types`, `npm run lint` and `npm run compile` pass.
- [x] 4.3 `npm test` passes in a downloaded VS Code host.
- [x] 4.4 `npx @vscode/vsce package` produces a VSIX containing only `dist/extension.js`, `package.json`, README and CHANGELOG.
- [x] 4.5 Update `AGENTS.md` command and layout sections to match the scaffold.

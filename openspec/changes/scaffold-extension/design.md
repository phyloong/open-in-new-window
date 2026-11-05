# Design

## Context

Greenfield VS Code extension. The official generator (`generator-code@1.12.0`) offers three bundling variants for the TypeScript command template: plain `tsc`, webpack, and esbuild. This change adopts the esbuild variant with its test harness, because it is the variant the generator ships for new projects and it keeps configuration small.

## Goals / Non-Goals

Goals:

- One command each for type-check, lint, bundle, watch, test, package.
- Tests run inside a real extension host so activation and command registration are exercised.
- No runtime dependencies; everything is bundled.

Non-Goals:

- Defining the product's commands or behaviour (separate change).
- CI pipelines and marketplace publishing credentials.

## Decisions

### esbuild instead of tsc-only or webpack

esbuild produces a single `dist/extension.js` with source maps in well under a second and needs one `esbuild.js` instead of a webpack config plus loaders. tsc-only would ship every compiled module and slow activation. Type checking is not lost: `npm run check-types` runs tsc with `--noEmit` over the same sources.

### `@vscode/test-cli` + `@vscode/test-electron`

The official harness downloads a VS Code build, loads the extension, and runs mocha. Tests are compiled separately to `out/` by `compile-tests`, because the host loads JavaScript while the bundle stays esbuild's output. `out/` is a test artifact and is gitignored.

### Engine pinned to `^1.104.0`

`@types/vscode` must not be newer than the declared engine, otherwise the extension can call APIs missing from older hosts. Pinning both to the same minor keeps the compile-time surface honest. Raise both together when a new API is needed.

### Strict TypeScript

`strict: true` from the start; retrofitting it after the URI and window code exists would be costly.

### npm-run-all2 instead of npm-run-all

The generator still uses `npm-run-all`, which is unmaintained. `npm-run-all2` is a drop-in fork exposing the same `run-p` / `run-s` binaries, so the `watch` script is unchanged.

## Risks / Trade-offs

- The integration test downloads a VS Code build on first run, which is slow and needs network access. Mitigation: `.vscode-test` caches the download and is gitignored.
- A single placeholder command is dead weight until the first real feature lands. Mitigation: the first product change replaces it and its test.
- Bundling hides `node_modules` from the debugger unless source maps are on. Mitigation: source maps are enabled outside production builds.

## Migration Plan

Not applicable: nothing depends on the previous state. Reverting means deleting the added files.

## Open Questions

None.

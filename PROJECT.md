# Craft

`SylphxAI/craft` provides `@sylphx/craft`, a high-performance TypeScript
library for immutable state updates, JSON patches, Map/Set support,
composition helpers, and package documentation.

## Lifecycle

- State: `production`
- Layer: `foundation`
- Machine manifest: [`.doctrine/project.json`](./.doctrine/project.json)

## Goals

- Provide the public `@sylphx/craft` package exports and debug export.
- Own immutable update behavior, draft/finalize helpers, patches,
  composition utilities, Map/Set support, benchmarks, tests, and docs.
- Keep package performance claims, bundle claims, release notes, and generated
  API docs backed by current evidence.

## Non-Goals

- This repo does not own application-specific state models, UI framework
  bindings, persistence, synchronization, or customer business workflows.
- This repo does not own enterprise doctrine, package release infrastructure, or
  consuming application delivery policy.

## Boundary

Craft is a tenant-neutral shared TypeScript package. It may change package
source, tests, benchmarks, docs, package metadata, and release notes. Consumers
must use the published package exports and documented APIs rather than internal
source paths or benchmark internals.

## Public Surfaces

- Package export: `package.json`
- Source exports: `src/index.ts`, `src/index-debug.ts`
- Documentation: `README.md`, `docs/`, `RELEASE_NOTES_v1.3.0.md`
- Benchmarks and tests: `benchmarks/`, `tests/`
- Release workflow: `.github/workflows/release.yml`

## Delivery

This repo currently has a main-branch release workflow but no PR CI workflow in
`.github/workflows/`. Production proof for package changes is lint, typecheck,
tests, build, relevant benchmarks for performance claims, release workflow
success, and package-registry/readme readback. Published package regressions are
recovered with forward fixes or replacement versions.

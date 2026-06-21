# Repository Agent Instructions

This repository follows the central doctrine in
[SylphxAI/doctrine](https://github.com/SylphxAI/doctrine).

Before changing behavior, read [PROJECT.md](./PROJECT.md) and
[.doctrine/project.json](./.doctrine/project.json). Keep enterprise policy in
doctrine; keep only repo-local package facts here.

Useful validation for package changes:

- `bun run lint`
- `bun run typecheck`
- `bun test`
- `bun run build`
- `bun run bench` for performance-sensitive changes

Do not add application-specific state models, UI framework assumptions,
persistence, synchronization, or customer workflow behavior to Craft core.
Consumers must use package exports and documented APIs.

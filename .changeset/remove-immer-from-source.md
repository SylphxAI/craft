---
"@sylphx/craft": patch
---

Remove immer references from source code while keeping benchmark comparisons

- Updated package description to remove "alternative to immer" reference
- Replaced "immer-inspired" and "immer-compatible" comments with generic terms in source code
- Changed "Aliases for immer compatibility" to "Convenience aliases" in exports
- Source code is now fully independent of immer terminology
- immer remains as devDependency for benchmark performance comparisons

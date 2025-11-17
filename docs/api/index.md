# API Reference

Complete API documentation for Craft.

## Core Functions

The main functions for creating and managing immutable state updates.

- [`craft()`](/api/core#craft) - Create immutable state updates
- [`createDraft()`](/api/core#createdraft-finishdraft) - Create a draft manually
- [`finishDraft()`](/api/core#createdraft-finishdraft) - Finalize a draft
- [`nothing`](/api/core#nothing) - Delete properties or array elements

## Composition

Utilities for composing and chaining state updates.

- [`crafted()`](/api/composition#crafted) - Create curried updater functions
- [`compose()`](/api/composition#compose) - Combine multiple producers
- [`pipe()`](/api/composition#pipe) - Apply producers sequentially
- [`composer()`](/api/composition#composer) - Fluent composition API

## Introspection

Functions for inspecting draft state.

- [`isDraft()`](/api/introspection#isdraft) - Check if value is a draft
- [`current()`](/api/introspection#current) - Get immutable snapshot
- [`original()`](/api/introspection#original) - Get original value

## Patches

JSON Patch support (RFC 6902) for tracking state changes.

- [`craftWithPatches()`](/api/core#craftwithpatches) - Generate patches
- [`applyPatches()`](/api/core#applypatches) - Apply patches to state

## Debugging

Development utilities for debugging draft state.

- [`inspectDraft()`](/api/debugging#inspectdraft) - Inspect draft metadata
- [`visualizeDraft()`](/api/debugging#visualizedraft) - Visualize draft tree
- [`assertDraft()`](/api/debugging#assertdraft) - Assert draft status
- [`assertNotDraft()`](/api/debugging#assertnotdraft) - Assert not draft
- [`describeDraft()`](/api/debugging#describedraft) - Human-readable description
- [`getDraftTreeSummary()`](/api/debugging#getdrafttreesummary) - Draft tree summary
- [`enableDebugMode()`](/api/debugging#enabledebugmode) - Enable debug mode
- [`disableDebugMode()`](/api/debugging#disabledebugmode) - Disable debug mode
- [`isDebugEnabled()`](/api/debugging#isdebugenabled) - Check debug status
- [`getDebugConfig()`](/api/debugging#getdebugconfig) - Get debug config

## Configuration

Functions for configuring Craft's behavior.

- [`setAutoFreeze()`](/api/configuration#setautofreeze) - Control auto-freeze
- [`setUseStrictShallowCopy()`](/api/configuration#setuseststrictshallowcopy) - Strict shallow copy
- [`setCustomShallowCopy()`](/api/configuration#setcustomshallowcopy) - Custom cloning logic

## Utilities

Helper functions and type utilities.

- [`freeze()`](/api/utilities#freeze) - Manually freeze objects
- [`castDraft()`](/api/utilities#castdraft) - Cast to draft type
- [`castImmutable()`](/api/utilities#castimmutable) - Cast to immutable type

## Type Exports

```typescript
import type {
  Draft,
  Immutable,
  Producer,
  Patch,
  PatchListener,
} from "@sylphx/craft";
```

## Quick Reference

### Basic Usage

```typescript
import { craft } from "@sylphx/craft";

const next = craft(state, draft => {
  draft.value = newValue;
});
```

### Curried Updates

```typescript
import { crafted } from "@sylphx/craft";

const increment = crafted((draft: State) => {
  draft.count++;
});

const next = increment(state);
```

### Composition

```typescript
import { compose, pipe } from "@sylphx/craft";

// Combine producers
const next = craft(state, compose(producer1, producer2));

// Sequential application
const next = pipe(state, producer1, producer2);
```

### Patches

```typescript
import { craftWithPatches, applyPatches } from "@sylphx/craft";

const [next, patches, inversePatches] = craftWithPatches(state, draft => {
  draft.value = newValue;
});

const recreated = applyPatches(state, patches);
const reverted = applyPatches(next, inversePatches);
```

### Introspection

```typescript
import { isDraft, current, original } from "@sylphx/craft";

craft(state, draft => {
  console.log(isDraft(draft)); // true
  console.log(current(draft)); // immutable snapshot
  console.log(original(draft)); // original value
});
```

## Next Steps

- [Core Functions](/api/core) - Main API functions
- [Composition](/api/composition) - Composition utilities
- [Debugging](/api/debugging) - Debug utilities
- [Examples](/examples/) - Real-world examples

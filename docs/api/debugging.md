# Debugging

Development utilities for debugging draft state and tracking changes.

::: warning Development Only
These utilities are intended for development and debugging. Don't use them in production code as they add overhead.
:::

## inspectDraft()

Get detailed information about a draft's internal state.

### Signature

```typescript
function inspectDraft(value: any): DraftInspection
```

### Returns

```typescript
interface DraftInspection {
  isDraft: boolean;
  isModified: boolean;
  type: 'object' | 'array' | 'map' | 'set' | 'primitive';
  depth: number;
  childDraftCount: number;
  // ... additional metadata
}
```

### Usage

```typescript
import { craft, inspectDraft } from "@sylphx/craft";

craft(state, (draft) => {
  draft.count++;
  draft.user.name = "Bob";

  const inspection = inspectDraft(draft);
  console.log(inspection);
  // {
  //   isDraft: true,
  //   isModified: true,
  //   type: "object",
  //   depth: 0,
  //   childDraftCount: 1,
  //   ...
  // }

  const userInspection = inspectDraft(draft.user);
  console.log(userInspection);
  // {
  //   isDraft: true,
  //   isModified: true,
  //   type: "object",
  //   depth: 1,
  //   ...
  // }
});
```

## visualizeDraft()

Log the structure of a draft tree with detailed metadata.

### Signature

```typescript
function visualizeDraft(value: any, label?: string): void
```

### Parameters

- `value` - The value to visualize
- `label` - Optional label for the output

### Usage

```typescript
import { craft, visualizeDraft } from "@sylphx/craft";

craft(state, (draft) => {
  draft.user.name = "Bob";
  draft.items.push({ id: 3 });

  visualizeDraft(draft, "State after updates");
  // Logs detailed tree structure:
  // State after updates
  // ├─ type: object
  // ├─ modified: true
  // ├─ user (object, modified)
  // │  └─ name: "Bob"
  // └─ items (array, modified)
  //    └─ [2]: { id: 3 }
});
```

## assertDraft()

Assert that a value is a draft (throws if not).

### Signature

```typescript
function assertDraft(value: any): void
```

### Usage

```typescript
import { craft, assertDraft } from "@sylphx/craft";

craft(state, (draft) => {
  assertDraft(draft); // ✅ OK - is a draft

  draft.count++;
  assertDraft(draft); // ✅ Still OK
});

assertDraft(state); // ❌ Throws: "Expected value to be a draft"
```

### Use Cases

```typescript
function updateDraft(draft: Draft<State>) {
  // Ensure we received a draft
  assertDraft(draft);

  draft.count++;
}

craft(state, (draft) => {
  updateDraft(draft); // OK
});

updateDraft(state); // Throws error
```

## assertNotDraft()

Assert that a value is NOT a draft (throws if it is).

### Signature

```typescript
function assertNotDraft(value: any): void
```

### Usage

```typescript
import { craft, assertNotDraft } from "@sylphx/craft";

const state = { count: 0 };
assertNotDraft(state); // ✅ OK - not a draft

craft(state, (draft) => {
  assertNotDraft(draft); // ❌ Throws: "Expected value to not be a draft"
});

const result = craft(state, draft => {
  draft.count++;
});
assertNotDraft(result); // ✅ OK - finalized result
```

## describeDraft()

Get a human-readable description of a draft.

### Signature

```typescript
function describeDraft(value: any): string
```

### Usage

```typescript
import { craft, describeDraft } from "@sylphx/craft";

craft(state, (draft) => {
  draft.user.name = "Bob";

  console.log(describeDraft(draft));
  // "Draft<object> at depth 0 (modified)"

  console.log(describeDraft(draft.user));
  // "Draft<object> at depth 1 (modified)"

  console.log(describeDraft(draft.items));
  // "Draft<array> at depth 1 (unmodified)"
});
```

## getDraftTreeSummary()

Get a summary of all drafts in a tree.

### Signature

```typescript
function getDraftTreeSummary(value: any): DraftTreeSummary
```

### Returns

```typescript
interface DraftTreeSummary {
  totalDrafts: number;
  modifiedDrafts: number;
  maxDepth: number;
}
```

### Usage

```typescript
import { craft, getDraftTreeSummary } from "@sylphx/craft";

craft(state, (draft) => {
  draft.users[0].name = "Alice";
  draft.users[1].name = "Bob";
  draft.settings.theme = "dark";

  const summary = getDraftTreeSummary(draft);
  console.log(summary);
  // {
  //   totalDrafts: 5,      // root + users array + 2 users + settings
  //   modifiedDrafts: 4,   // all except root
  //   maxDepth: 2          // root -> users -> user object
  // }
});
```

## enableDebugMode()

Enable global debug mode with optional configuration.

### Signature

```typescript
function enableDebugMode(config?: DebugConfig): void

interface DebugConfig {
  enabled: boolean;
  logChanges?: boolean;
  trackChanges?: boolean;
}
```

### Usage

```typescript
import { enableDebugMode } from "@sylphx/craft";

// Enable with all features
enableDebugMode({
  enabled: true,
  logChanges: true,
  trackChanges: true,
});

// Now all craft operations log changes
craft(state, draft => {
  draft.count++; // Logs: "Modified property 'count': 0 -> 1"
});
```

### Environment-Specific

```typescript
if (process.env.NODE_ENV === 'development') {
  enableDebugMode({
    enabled: true,
    logChanges: true,
    trackChanges: true,
  });
}
```

## disableDebugMode()

Disable global debug mode.

### Signature

```typescript
function disableDebugMode(): void
```

### Usage

```typescript
import { disableDebugMode } from "@sylphx/craft";

disableDebugMode();
```

## isDebugEnabled()

Check if debug mode is currently enabled.

### Signature

```typescript
function isDebugEnabled(): boolean
```

### Usage

```typescript
import { isDebugEnabled } from "@sylphx/craft";

if (isDebugEnabled()) {
  console.log("Debug mode is active");
}
```

## getDebugConfig()

Get the current debug configuration.

### Signature

```typescript
function getDebugConfig(): DebugConfig
```

### Usage

```typescript
import { getDebugConfig } from "@sylphx/craft";

const config = getDebugConfig();
console.log(config);
// {
//   enabled: true,
//   logChanges: true,
//   trackChanges: true
// }
```

## Debugging Workflows

### Development Setup

```typescript
// debug.ts
import {
  enableDebugMode,
  visualizeDraft,
  getDraftTreeSummary
} from "@sylphx/craft";

export function setupDebug() {
  if (process.env.NODE_ENV === 'development') {
    enableDebugMode({
      enabled: true,
      logChanges: true,
      trackChanges: true,
    });
  }
}

export function debugState(draft: any, label: string) {
  if (process.env.NODE_ENV === 'development') {
    console.group(label);
    visualizeDraft(draft);
    console.log("Summary:", getDraftTreeSummary(draft));
    console.groupEnd();
  }
}
```

### Testing

```typescript
import { craft, inspectDraft, assertDraft } from "@sylphx/craft";

test("draft is properly created", () => {
  craft(state, (draft) => {
    // Assert draft state
    assertDraft(draft);

    // Inspect for testing
    const inspection = inspectDraft(draft);
    expect(inspection.isDraft).toBe(true);
    expect(inspection.isModified).toBe(false);

    draft.count++;

    const updated = inspectDraft(draft);
    expect(updated.isModified).toBe(true);
  });
});
```

### Debugging Complex Updates

```typescript
import { craft, visualizeDraft, describeDraft } from "@sylphx/craft";

craft(complexState, (draft) => {
  console.log("Before:", describeDraft(draft));
  visualizeDraft(draft, "Initial state");

  // Make complex changes
  draft.users.forEach(user => {
    user.active = true;
  });

  visualizeDraft(draft, "After activation");

  draft.settings.preferences = { theme: "dark" };

  visualizeDraft(draft, "After preferences");
});
```

## Performance Impact

::: warning
Debug utilities add overhead:
- `inspectDraft()`: Creates inspection metadata
- `visualizeDraft()`: Traverses entire tree
- `getDraftTreeSummary()`: Traverses entire tree
- Debug mode: Logs on every change

Always disable in production!
:::

## Best Practices

1. **Enable in development only**
```typescript
if (process.env.NODE_ENV === 'development') {
  enableDebugMode({ enabled: true });
}
```

2. **Use assertions in tests**
```typescript
test("function accepts drafts", () => {
  craft(state, draft => {
    assertDraft(draft);
    myFunction(draft);
  });
});
```

3. **Visualize for debugging**
```typescript
// When debugging complex state updates
craft(state, draft => {
  visualizeDraft(draft, "Before update");
  complexUpdate(draft);
  visualizeDraft(draft, "After update");
});
```

4. **Remove before production**
```typescript
// ❌ Bad - leaves debug code
craft(state, draft => {
  visualizeDraft(draft);
  draft.count++;
});

// ✅ Good - conditional
craft(state, draft => {
  if (DEBUG) visualizeDraft(draft);
  draft.count++;
});
```

## Next Steps

- [Configuration](/api/configuration) - Configure Craft
- [Introspection](/api/introspection) - Inspect draft state
- [Core Functions](/api/core) - Main API

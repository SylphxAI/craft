# Core Functions

The main functions for creating and managing immutable state updates.

## craft()

The primary function to create immutable state updates.

### Signature

```typescript
function craft<T>(
  base: T,
  producer: (draft: Draft<T>) => void | T
): T
```

### Parameters

- `base` - The base state to update
- `producer` - Function that receives a mutable draft and makes changes

### Returns

A new immutable state with the changes applied.

### Basic Usage

```typescript
import { craft } from "@sylphx/craft";

const state = { count: 0, name: "Alice" };

const next = craft(state, draft => {
  draft.count = 1;
  draft.name = "Bob";
});

console.log(next); // { count: 1, name: "Bob" }
console.log(state); // { count: 0, name: "Alice" } - unchanged
```

### Returning Values

You can return a new value to replace the entire state:

```typescript
const next = craft(state, draft => {
  return { count: 100, name: "Charlie" };
});
```

::: warning
When you return a value, any mutations to the draft are ignored.
:::

### Nested Updates

```typescript
const state = {
  user: {
    profile: {
      name: "Alice",
      age: 25
    }
  }
};

const next = craft(state, draft => {
  draft.user.profile.age = 26;
});
```

### Array Updates

```typescript
const state = { items: [1, 2, 3] };

const next = craft(state, draft => {
  draft.items.push(4);
  draft.items[0] = 10;
});
```

## createDraft() / finishDraft()

Manual draft control for advanced use cases like async operations.

### Signatures

```typescript
function createDraft<T>(base: T): Draft<T>
function finishDraft<T>(draft: Draft<T>): T
```

### Parameters

- `base` - The base state to create a draft from
- `draft` - The draft to finalize

### Returns

- `createDraft()` - A mutable draft
- `finishDraft()` - The finalized immutable state

### Usage

```typescript
import { createDraft, finishDraft } from "@sylphx/craft";

const state = { count: 0, user: { name: "Alice" } };

// Create draft
const draft = createDraft(state);

// Make changes
draft.count++;
draft.user.name = "Bob";

// Finalize
const next = finishDraft(draft);

console.log(next); // { count: 1, user: { name: "Bob" } }
console.log(state); // { count: 0, user: { name: "Alice" } }
```

### Async Operations

Perfect for async operations:

```typescript
async function updateUser(state: State, userId: string) {
  const draft = createDraft(state);

  // Make changes over time
  const userData = await fetchUser(userId);
  draft.user = userData;

  // More async operations
  const settings = await fetchSettings(userId);
  draft.settings = settings;

  // Finalize when ready
  return finishDraft(draft);
}

const nextState = await updateUser(currentState, "123");
```

::: tip
Use `createDraft`/`finishDraft` when you need to make changes over multiple async operations or in complex control flow.
:::

## craftWithPatches()

Generate patches describing state changes.

### Signature

```typescript
function craftWithPatches<T>(
  base: T,
  producer: (draft: Draft<T>) => void | T
): [T, Patch[], Patch[]]
```

### Parameters

- `base` - The base state to update
- `producer` - Function that receives a mutable draft

### Returns

A tuple containing:
1. The new state
2. Forward patches (changes made)
3. Inverse patches (to undo changes)

### Usage

```typescript
import { craftWithPatches } from "@sylphx/craft";

const state = {
  count: 0,
  user: { name: "Alice" },
  items: [{ id: 1 }, { id: 2 }]
};

const [nextState, patches, inversePatches] = craftWithPatches(state, draft => {
  draft.count = 5;
  draft.user.name = "Bob";
  draft.items.push({ id: 3 });
});

console.log(patches);
// [
//   { op: 'replace', path: ['count'], value: 5 },
//   { op: 'replace', path: ['user', 'name'], value: 'Bob' },
//   { op: 'add', path: ['items', 2], value: { id: 3 } }
// ]

console.log(inversePatches);
// [
//   { op: 'replace', path: ['count'], value: 0 },
//   { op: 'replace', path: ['user', 'name'], value: 'Alice' },
//   { op: 'remove', path: ['items', 2] }
// ]
```

## applyPatches()

Apply patches to a state object.

### Signature

```typescript
function applyPatches<T>(base: T, patches: Patch[]): T
```

### Parameters

- `base` - The state to apply patches to
- `patches` - Array of patches to apply

### Returns

New state with patches applied.

### Usage

```typescript
import { craftWithPatches, applyPatches } from "@sylphx/craft";

const [nextState, patches, inversePatches] = craftWithPatches(state, draft => {
  draft.count = 5;
});

// Recreate state by applying patches
const recreated = applyPatches(state, patches);
console.log(recreated); // Same as nextState

// Undo by applying inverse patches
const reverted = applyPatches(nextState, inversePatches);
console.log(reverted); // Same as original state
```

### Undo/Redo

```typescript
class History<T> {
  private past: Patch[][] = [];
  private future: Patch[][] = [];

  constructor(private state: T) {}

  update(producer: (draft: Draft<T>) => void) {
    const [next, patches, inversePatches] = craftWithPatches(
      this.state,
      producer
    );

    this.past.push(inversePatches);
    this.future = [];
    this.state = next;

    return next;
  }

  undo() {
    const patches = this.past.pop();
    if (!patches) return this.state;

    const [next, _, inversePatches] = craftWithPatches(
      this.state,
      draft => applyPatches(draft, patches)
    );

    this.future.push(inversePatches);
    this.state = next;

    return next;
  }

  redo() {
    const patches = this.future.pop();
    if (!patches) return this.state;

    const [next, _, inversePatches] = craftWithPatches(
      this.state,
      draft => applyPatches(draft, patches)
    );

    this.past.push(inversePatches);
    this.state = next;

    return next;
  }
}

// Usage
const history = new History({ count: 0 });

history.update(draft => { draft.count = 1; });
history.update(draft => { draft.count = 2; });
history.update(draft => { draft.count = 3; });

history.undo(); // count: 2
history.undo(); // count: 1
history.redo(); // count: 2
```

## nothing

Symbol to delete properties or remove array elements.

### Usage

```typescript
import { craft, nothing } from "@sylphx/craft";

// Delete object property
const state = { name: "Alice", age: 25, temp: "delete" };
const next = craft(state, draft => {
  draft.temp = nothing;
});
// Result: { name: "Alice", age: 25 }

// Remove array element
const state2 = { items: [1, 2, 3, 4, 5] };
const next2 = craft(state2, draft => {
  draft.items[2] = nothing; // Remove 3rd element
});
// Result: { items: [1, 2, 4, 5] }

// Remove multiple elements
const state3 = {
  todos: [
    { id: 1, done: true },
    { id: 2, done: false },
    { id: 3, done: true }
  ]
};

const next3 = craft(state3, draft => {
  draft.todos.forEach((todo, i) => {
    if (todo.done) {
      draft.todos[i] = nothing;
    }
  });
});
// Result: { todos: [{ id: 2, done: false }] }
```

::: tip
When removing array elements, the array is automatically compacted with holes removed.
:::

## Patch Format

Patches follow RFC 6902 JSON Patch format:

```typescript
interface Patch {
  op: 'add' | 'remove' | 'replace';
  path: (string | number)[];
  value?: any;
}
```

### Operations

- `add` - Add a property or array element
- `remove` - Remove a property or array element
- `replace` - Change a value

### Examples

```typescript
// Add property
{ op: 'add', path: ['user', 'age'], value: 25 }

// Remove property
{ op: 'remove', path: ['user', 'temp'] }

// Replace value
{ op: 'replace', path: ['count'], value: 5 }

// Array operations
{ op: 'add', path: ['items', 2], value: { id: 3 } }
{ op: 'remove', path: ['items', 1] }
{ op: 'replace', path: ['items', 0, 'done'], value: true }
```

## Next Steps

- [Composition API](/api/composition) - Compose multiple updates
- [Introspection](/api/introspection) - Inspect draft state
- [Examples](/examples/patches) - Patch examples

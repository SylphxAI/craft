# Advanced Features

## Map and Set Support

Craft provides full support for ES6 Map and Set collections with automatic mutation tracking.

### Map Operations

```typescript
import { craft } from "@sylphx/craft";

const state = {
  users: new Map([
    ["alice", { name: "Alice", age: 25 }],
    ["bob", { name: "Bob", age: 30 }],
  ]),
};

const next = craft(state, (draft) => {
  // Add new entry
  draft.users.set("charlie", { name: "Charlie", age: 35 });

  // Delete entry
  draft.users.delete("alice");

  // Update existing entry
  const bob = draft.users.get("bob");
  if (bob) bob.age = 31;
});
```

All Map methods are fully supported:
- `set(key, value)` - Add or update entries
- `get(key)` - Retrieve values
- `has(key)` - Check for keys
- `delete(key)` - Remove entries
- `clear()` - Remove all entries
- `forEach()`, `keys()`, `values()`, `entries()` - Iteration

### Set Operations

```typescript
const state = {
  tags: new Set(["javascript", "typescript"]),
};

const next = craft(state, (draft) => {
  // Add elements
  draft.tags.add("react");
  draft.tags.add("vue");

  // Remove elements
  draft.tags.delete("javascript");
});
```

All Set methods are fully supported:
- `add(value)` - Add elements
- `has(value)` - Check for elements
- `delete(value)` - Remove elements
- `clear()` - Remove all elements
- `forEach()`, `keys()`, `values()`, `entries()` - Iteration

### Performance

Craft's Map/Set implementation is **3-35x faster** than immer:

| Operation | Performance vs immer |
|-----------|---------------------|
| Map.set() | 2.67-3.48x faster |
| Map.delete() | 3.15-3.34x faster |
| Set.add() | 6.13-7.60x faster |
| Set.delete() | 5.83-5.94x faster |
| Large Set (100 items) | 33-35x faster |

## JSON Patches (RFC 6902)

Generate and apply patches to track state mutations for advanced use cases like undo/redo and time-travel debugging.

### Generating Patches

```typescript
import { craftWithPatches } from "@sylphx/craft";

const state = {
  count: 0,
  user: { name: "Alice" },
  items: [{ id: 1 }, { id: 2 }]
};

const [nextState, patches, inversePatches] = craftWithPatches(state, (draft) => {
  draft.count = 5;
  draft.user.name = "Bob";
  draft.items.push({ id: 3 });
});

// patches describe the changes:
// [
//   { op: 'replace', path: ['count'], value: 5 },
//   { op: 'replace', path: ['user', 'name'], value: 'Bob' },
//   { op: 'add', path: ['items', 2], value: { id: 3 } }
// ]
```

### Applying Patches

```typescript
import { applyPatches } from "@sylphx/craft";

// Apply patches to recreate state
const recreated = applyPatches(state, patches);
console.log(recreated === nextState); // true (deep equal)

// Undo changes using inverse patches
const reverted = applyPatches(nextState, inversePatches);
console.log(reverted === state); // true (deep equal)
```

### Use Cases

- 🕐 **Undo/Redo** - Apply inverse patches to revert changes
- 🐛 **Time-travel debugging** - Replay state mutations step by step
- 🔄 **State synchronization** - Send patches over the network
- 📝 **Audit logging** - Track what changed and when
- 💾 **Optimistic updates** - Roll back failed operations

### Performance

Craft's patch implementation is **1.6-24x faster** than immer:

| Operation | Performance vs immer |
|-----------|---------------------|
| Generate simple patches | 1.39-1.71x faster |
| Generate array patches | 1.56-1.77x faster |
| Generate nested patches | 1.64-1.70x faster |
| **Apply patches** | **24-25x faster** 🚀 |
| Undo/Redo | 2.15-2.28x faster |

## Async Operations

For async operations, use `createDraft` and `finishDraft` for manual control:

```typescript
import { createDraft, finishDraft } from "@sylphx/craft";

async function updateUser(state, userId) {
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

const nextState = await updateUser(currentState, 123);
```

::: warning
Don't use the regular `craft` function with async producers. The draft is finalized immediately when the producer returns, even if it returns a Promise.
:::

## Curried Updates

Create reusable updater functions with `crafted`:

```typescript
import { crafted } from "@sylphx/craft";

interface State {
  count: number;
  active: boolean;
}

// Create reusable updaters
const increment = crafted((draft: State) => {
  draft.count++;
});

const activate = crafted((draft: State) => {
  draft.active = true;
});

// Use them
const state1 = { count: 0, active: false };
const state2 = increment(state1); // { count: 1, active: false }
const state3 = activate(state2); // { count: 1, active: true }
const state4 = increment(state3); // { count: 2, active: true }
```

## Composition

Combine multiple producers using composition utilities.

### compose()

```typescript
import { craft, compose } from "@sylphx/craft";

const increment = (draft: State) => {
  draft.count++;
};

const activate = (draft: State) => {
  draft.active = true;
};

const setName = (name: string) => (draft: State) => {
  draft.name = name;
};

// Combine multiple producers
const nextState = craft(
  baseState,
  compose(increment, activate, setName("Alice"))
);
```

### pipe()

Apply producers sequentially:

```typescript
import { pipe } from "@sylphx/craft";

const result = pipe(
  baseState,
  (draft) => {
    draft.count++;
  },
  (draft) => {
    draft.count *= 2;
  },
  (draft) => {
    draft.name = "Result";
  }
);
```

### composer()

Fluent API for chaining:

```typescript
import { composer } from "@sylphx/craft";

const updater = composer<State>((draft) => {
  draft.count++;
})
  .with((draft) => {
    draft.name = "Bob";
  })
  .with((draft) => {
    draft.active = true;
  });

const nextState = updater.produce(baseState);
```

## Custom Shallow Copy

Provide custom cloning logic for special object types:

```typescript
import { setCustomShallowCopy } from "@sylphx/craft";

class CustomClass {
  constructor(public id: number, public data: string) {}

  clone(): CustomClass {
    return new CustomClass(this.id, this.data);
  }
}

setCustomShallowCopy((value, defaultCopy) => {
  // Handle special types with custom cloning
  if (value instanceof CustomClass) {
    return value.clone();
  }

  // Fall back to default shallow copy
  return defaultCopy(value);
});

// Now CustomClass instances will use .clone() method
const nextState = craft(
  { obj: new CustomClass(1, "test") },
  draft => {
    draft.obj.data = "updated"; // Uses custom clone
  }
);
```

## Next Steps

- [Configuration](/guide/configuration) - Configure Craft's behavior
- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - Real-world usage examples

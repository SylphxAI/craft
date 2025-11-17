# Utilities

Helper functions and type utilities.

## freeze()

Manually freeze an object to make it immutable.

### Signature

```typescript
function freeze<T>(obj: T, deep?: boolean): T
```

### Parameters

- `obj` - The object to freeze
- `deep` - If `true`, recursively freeze nested objects (default: `false`)

### Returns

The frozen object.

### Usage

**Shallow freeze:**
```typescript
import { freeze } from "@sylphx/craft";

const obj = {
  count: 0,
  user: { name: "Alice" }
};

const frozen = freeze(obj);

frozen.count = 1; // ❌ Error: Cannot assign to read only property
frozen.user.name = "Bob"; // ✅ Works - nested object not frozen
```

**Deep freeze:**
```typescript
const frozen = freeze(obj, true);

frozen.count = 1; // ❌ Error
frozen.user.name = "Bob"; // ❌ Error - nested object also frozen
```

### Use Cases

#### Manual Immutability

```typescript
// When not using craft
const state = freeze({
  count: 0,
  items: []
}, true);

// State is immutable
state.count = 1; // ❌ Error
```

#### API Responses

```typescript
async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();

  // Freeze API response
  return freeze(data, true);
}
```

#### Constants

```typescript
export const CONFIG = freeze({
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000
  },
  features: {
    darkMode: true,
    notifications: true
  }
}, true);
```

## castDraft()

Cast an immutable type to a draft type (type-level only).

### Signature

```typescript
function castDraft<T>(value: T): Draft<T>
```

### Parameters

- `value` - The value to cast

### Returns

The value with Draft type.

::: warning Type-Level Only
This is a type-level cast only. It doesn't actually make the object mutable at runtime.
:::

### Usage

```typescript
import { castDraft } from "@sylphx/craft";

interface State {
  readonly count: number;
  readonly items: readonly string[];
}

const immutableState: State = {
  count: 0,
  items: ["a", "b"]
};

// Cast to draft type
const draft = castDraft(immutableState);

// TypeScript allows mutations
draft.count = 1;
draft.items.push("c");

// But runtime may still throw if frozen!
```

### Use Cases

#### Type Assertions

```typescript
function processDraft(draft: Draft<State>) {
  draft.count++;
}

const state: Readonly<State> = { count: 0 };

// Need to cast for type compatibility
processDraft(castDraft(state));
```

#### Generic Functions

```typescript
function createUpdater<T>(initialValue: T) {
  return (producer: (draft: Draft<T>) => void) => {
    const draft = castDraft(initialValue);
    producer(draft);
    return draft;
  };
}
```

## castImmutable()

Cast a mutable type to an immutable type (type-level only).

### Signature

```typescript
function castImmutable<T>(value: T): Immutable<T>
```

### Parameters

- `value` - The value to cast

### Returns

The value with Immutable type.

::: warning Type-Level Only
This is a type-level cast only. It doesn't actually freeze the object at runtime.
:::

### Usage

```typescript
import { castImmutable } from "@sylphx/craft";

interface State {
  count: number;
  items: string[];
}

const mutableState: State = {
  count: 0,
  items: ["a", "b"]
};

// Cast to immutable type
const immutable = castImmutable(mutableState);

// TypeScript prevents mutations
immutable.count = 1; // ❌ Type error
immutable.items.push("c"); // ❌ Type error
```

### Use Cases

#### API Boundaries

```typescript
class Store<T> {
  private state: T;

  constructor(initialState: T) {
    this.state = initialState;
  }

  // Return immutable type to prevent external mutations
  getState(): Immutable<T> {
    return castImmutable(this.state);
  }

  setState(producer: (draft: Draft<T>) => void) {
    this.state = craft(this.state, producer);
  }
}
```

#### Type Guards

```typescript
function isImmutable<T>(value: T | Immutable<T>): value is Immutable<T> {
  return Object.isFrozen(value);
}

const state = { count: 0 };

if (isImmutable(state)) {
  // state is Immutable<State>
} else {
  // state is State
  const immutable = castImmutable(state);
}
```

## Type Exports

Craft exports several useful TypeScript types.

### Draft&lt;T&gt;

Represents a mutable version of a type with all readonly modifiers removed.

```typescript
import type { Draft } from "@sylphx/craft";

interface State {
  readonly count: number;
  readonly items: readonly string[];
}

type DraftState = Draft<State>;
// {
//   count: number;
//   items: string[];
// }
```

### Immutable&lt;T&gt;

Represents an immutable version of a type with all properties readonly.

```typescript
import type { Immutable } from "@sylphx/craft";

interface State {
  count: number;
  items: string[];
}

type ImmutableState = Immutable<State>;
// {
//   readonly count: number;
//   readonly items: readonly string[];
// }
```

### Producer&lt;T&gt;

Type for producer functions.

```typescript
import type { Producer } from "@sylphx/craft";

interface State {
  count: number;
}

const increment: Producer<State> = (draft) => {
  draft.count++;
};
```

### Patch

Type for JSON Patch operations.

```typescript
import type { Patch } from "@sylphx/craft";

const patches: Patch[] = [
  { op: 'replace', path: ['count'], value: 5 },
  { op: 'add', path: ['items', 2], value: 'new' },
  { op: 'remove', path: ['temp'] }
];
```

### PatchListener

Type for patch listener callbacks.

```typescript
import type { PatchListener } from "@sylphx/craft";

const listener: PatchListener = (patches, inversePatches) => {
  console.log("Patches:", patches);
  console.log("Inverse:", inversePatches);
};
```

## Practical Examples

### Store Implementation

```typescript
import {
  craft,
  freeze,
  castImmutable,
  type Draft,
  type Immutable
} from "@sylphx/craft";

class ImmutableStore<T> {
  private state: T;

  constructor(initialState: T) {
    this.state = freeze(initialState, true);
  }

  getState(): Immutable<T> {
    return castImmutable(this.state);
  }

  update(producer: (draft: Draft<T>) => void): void {
    this.state = craft(this.state, producer);
  }
}

// Usage
interface AppState {
  count: number;
  user: { name: string };
}

const store = new ImmutableStore<AppState>({
  count: 0,
  user: { name: "Alice" }
});

const state = store.getState();
// state is Immutable<AppState>

store.update(draft => {
  draft.count++;
});
```

### Type-Safe Utilities

```typescript
import { castDraft, castImmutable, type Draft } from "@sylphx/craft";

function deepFreeze<T>(obj: T): Immutable<T> {
  Object.freeze(obj);

  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });

  return castImmutable(obj);
}

function createMutableCopy<T>(immutable: Immutable<T>): Draft<T> {
  const copy = JSON.parse(JSON.stringify(immutable));
  return castDraft(copy);
}
```

### Testing Helpers

```typescript
import { freeze, castDraft } from "@sylphx/craft";

export function createTestState<T>(state: T): Immutable<T> {
  return freeze(state, true);
}

export function createMockDraft<T>(state: T): Draft<T> {
  return castDraft(state);
}

// Usage in tests
const testState = createTestState({
  count: 0,
  items: []
});

const mockDraft = createMockDraft(testState);
```

## Best Practices

### freeze()

- Use `freeze(obj, true)` for deep immutability
- Freeze configuration objects
- Freeze API responses
- Don't overuse - Craft handles freezing automatically

### castDraft() / castImmutable()

- Use for type compatibility, not runtime behavior
- Don't rely on these for actual immutability
- Use with type guards and generic functions
- Helpful for library APIs

### Type Exports

- Import types with `import type` for tree-shaking
- Use `Producer<T>` for reusable updater functions
- Use `Draft<T>` and `Immutable<T>` for APIs
- Use `Patch` for patch-related code

## Summary

| Utility | Purpose | Use Case |
|---------|---------|----------|
| `freeze()` | Freeze objects | Manual immutability |
| `castDraft()` | Type cast to Draft | Type compatibility |
| `castImmutable()` | Type cast to Immutable | API boundaries |
| Type exports | TypeScript types | Type safety |

## Next Steps

- [Core Functions](/api/core) - Main API
- [Type Safety](/guide/type-safety) - TypeScript guide
- [Examples](/examples/) - Real-world examples

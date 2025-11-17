# Introspection

Functions for inspecting draft state and metadata.

## isDraft()

Check if a value is a draft.

### Signature

```typescript
function isDraft(value: any): boolean
```

### Parameters

- `value` - The value to check

### Returns

`true` if the value is a draft, `false` otherwise.

### Usage

```typescript
import { craft, isDraft } from "@sylphx/craft";

const state = { count: 0 };

console.log(isDraft(state)); // false

craft(state, (draft) => {
  console.log(isDraft(draft)); // true
  console.log(isDraft(state)); // false
  console.log(isDraft(draft.count)); // false (primitive)
});
```

### Nested Drafts

```typescript
craft(state, (draft) => {
  console.log(isDraft(draft)); // true
  console.log(isDraft(draft.user)); // true (nested object)
  console.log(isDraft(draft.items)); // true (array)
  console.log(isDraft(draft.items[0])); // true (array element)
});
```

## current()

Get an immutable snapshot of the current draft state.

### Signature

```typescript
function current<T>(draft: Draft<T>): T
```

### Parameters

- `draft` - The draft to snapshot

### Returns

An immutable snapshot of the current state.

### Usage

```typescript
import { craft, current } from "@sylphx/craft";

let snapshot;

craft(state, (draft) => {
  draft.count = 5;
  draft.items.push(4);

  // Get immutable snapshot
  snapshot = current(draft);

  // Continue making changes
  draft.count = 10;
});

// Use snapshot outside producer
console.log(snapshot.count); // 5
console.log(snapshot.items); // [1, 2, 3, 4]
```

### Use Cases

#### Pass State to Functions

```typescript
function processData(data: State) {
  // This function expects immutable state
}

craft(state, (draft) => {
  draft.count++;

  // Can't pass draft directly
  // processData(draft); // ❌ Type error

  // Get snapshot first
  processData(current(draft)); // ✅ OK
});
```

#### Early Return with Current State

```typescript
craft(state, (draft) => {
  draft.user.name = "Alice";

  if (someCondition) {
    return current(draft); // Return snapshot
  }

  draft.user.age = 26;
});
```

#### Logging

```typescript
craft(state, (draft) => {
  draft.count++;
  console.log("After increment:", current(draft));

  draft.count *= 2;
  console.log("After double:", current(draft));
});
```

## original()

Get the original value that a draft was created from.

### Signature

```typescript
function original<T>(draft: Draft<T>): T | undefined
```

### Parameters

- `draft` - The draft to get the original from

### Returns

The original value, or `undefined` if not a draft.

### Usage

```typescript
import { craft, original } from "@sylphx/craft";

const state = { count: 0, name: "Alice" };

craft(state, (draft) => {
  draft.count = 10;
  draft.name = "Bob";

  // Compare with original
  console.log(draft.count);             // 10 (current)
  console.log(original(draft)?.count);  // 0 (original)

  console.log(draft.name);              // "Bob" (current)
  console.log(original(draft)?.name);   // "Alice" (original)
});
```

### Nested Originals

```typescript
craft(state, (draft) => {
  draft.user.age = 30;

  // Original of nested draft
  console.log(original(draft.user)?.age); // 25

  // Original of root draft
  console.log(original(draft)?.user.age); // 25
});
```

### Comparison

```typescript
craft(state, (draft) => {
  draft.count++;

  const orig = original(draft);

  if (orig && draft.count > orig.count + 10) {
    // Reset if changed too much
    draft.count = orig.count;
  }
});
```

### Use Cases

#### Conditional Updates

```typescript
craft(state, (draft) => {
  const newAge = 30;
  const oldAge = original(draft)?.user.age;

  if (oldAge && newAge > oldAge) {
    draft.user.age = newAge;
    draft.user.updatedAt = Date.now();
  }
});
```

#### Delta Calculation

```typescript
craft(state, (draft) => {
  draft.count = 100;

  const orig = original(draft);
  if (orig) {
    const delta = draft.count - orig.count;
    console.log(`Changed by ${delta}`);
  }
});
```

#### Validation

```typescript
craft(state, (draft) => {
  draft.items.push(newItem);

  const orig = original(draft);
  if (orig && draft.items.length > orig.items.length + 10) {
    throw new Error("Too many items added at once");
  }
});
```

## Combining Introspection Functions

```typescript
import { craft, isDraft, current, original } from "@sylphx/craft";

craft(state, (draft) => {
  // Check if draft
  if (isDraft(draft)) {
    // Get original
    const orig = original(draft);
    console.log("Original:", orig);

    // Make changes
    draft.count++;

    // Get current snapshot
    const snap = current(draft);
    console.log("Current:", snap);

    // Compare
    if (orig && snap.count !== orig.count) {
      console.log("Count changed!");
    }
  }
});
```

## Type Guards

Use with TypeScript type guards:

```typescript
function processValue(value: State | Draft<State>) {
  if (isDraft(value)) {
    // value is Draft<State>
    const orig = original(value);
    const curr = current(value);
  } else {
    // value is State
    console.log(value);
  }
}
```

## Best Practices

### current()

- Use `current()` when you need to pass draft state to functions expecting immutable data
- Use for logging or debugging intermediate state
- Don't use excessively as it creates copies

### original()

- Use `original()` for comparisons or validation
- Check for `undefined` as it returns `undefined` for non-drafts
- Useful for conditional logic based on changes

### isDraft()

- Use for type guards and runtime checks
- Useful in utility functions that may receive drafts or regular values
- Don't check primitives (always returns `false`)

## Performance Notes

- `isDraft()` is very fast (O(1))
- `current()` creates a copy, use sparingly
- `original()` is very fast (O(1))

## Next Steps

- [Core Functions](/api/core) - Main API functions
- [Debugging](/api/debugging) - Debug utilities
- [Examples](/examples/) - Real-world examples

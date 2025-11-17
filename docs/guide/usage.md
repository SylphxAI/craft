# Core Concepts

## Basic Usage

The `craft` function is the heart of the library. It takes a base state and a producer function that receives a draft:

```typescript
import { craft } from "@sylphx/craft";

const state = {
  user: { name: "Alice", age: 25 },
  count: 0
};

const nextState = craft(state, (draft) => {
  // Mutate the draft freely
  draft.user.age = 26;
  draft.count++;
});

console.log(state.user.age); // 25 (unchanged)
console.log(nextState.user.age); // 26 (updated)
```

## Immutability

Craft ensures your original state is never modified:

```typescript
const state = { items: [1, 2, 3] };

const next = craft(state, draft => {
  draft.items.push(4);
});

console.log(state.items); // [1, 2, 3] - original unchanged
console.log(next.items); // [1, 2, 3, 4] - new state
```

By default, the returned state is frozen to prevent accidental mutations:

```typescript
const next = craft(state, draft => {
  draft.count = 5;
});

next.count = 10; // ❌ Error: Cannot assign to read only property
```

## Structural Sharing

Craft only copies the parts of your state tree that actually change. Unchanged objects maintain their references:

```typescript
const state = {
  user: { name: "Alice" },
  settings: { theme: "dark" }
};

const next = craft(state, draft => {
  draft.user.name = "Bob";
});

// Only user was changed, settings stays the same
console.log(state.settings === next.settings); // true
console.log(state.user === next.user); // false
```

This is crucial for performance in frameworks like React that rely on reference equality for change detection.

## Returning New Values

You can return a completely new value from the producer to replace the entire state:

```typescript
const state = { count: 0, name: "Alice" };

const next = craft(state, (draft) => {
  return { count: 100, name: "Bob" };
});

console.log(next); // { count: 100, name: "Bob" }
```

::: warning
When you return a value, any mutations to the draft are ignored.
:::

## Working with Arrays

Craft makes array operations simple:

```typescript
const state = {
  todos: [
    { id: 1, text: "Learn Craft", done: false },
    { id: 2, text: "Build app", done: false }
  ]
};

// Add items
const next1 = craft(state, draft => {
  draft.todos.push({ id: 3, text: "Deploy", done: false });
});

// Update items
const next2 = craft(state, draft => {
  draft.todos[0].done = true;
});

// Remove items
const next3 = craft(state, draft => {
  draft.todos.splice(1, 1); // Remove second item
});

// Filter
const next4 = craft(state, draft => {
  const completed = draft.todos.filter(todo => todo.done);
  return { todos: completed };
});
```

## The `nothing` Symbol

Use the `nothing` symbol to delete properties or remove array elements:

```typescript
import { craft, nothing } from "@sylphx/craft";

// Delete object property
const state = { name: "Alice", age: 25, temp: "delete me" };
const next = craft(state, draft => {
  draft.temp = nothing;
});
// Result: { name: "Alice", age: 25 }

// Remove array elements
const state2 = { items: [1, 2, 3, 4, 5] };
const next2 = craft(state2, draft => {
  draft.items[2] = nothing; // Remove 3rd element
});
// Result: { items: [1, 2, 4, 5] }

// Remove completed todos
const next3 = craft(todoState, draft => {
  draft.todos.forEach((todo, i) => {
    if (todo.done) {
      draft.todos[i] = nothing;
    }
  });
});
```

## Nested Objects

Craft handles deeply nested objects effortlessly:

```typescript
const state = {
  user: {
    profile: {
      personal: {
        name: "Alice",
        age: 25
      },
      settings: {
        theme: "dark"
      }
    }
  }
};

const next = craft(state, draft => {
  draft.user.profile.personal.age = 26;
  draft.user.profile.settings.theme = "light";
});
```

Compare this to manual immutable updates:

```typescript
// ❌ Manual way (error-prone and verbose)
const next = {
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      personal: {
        ...state.user.profile.personal,
        age: 26
      },
      settings: {
        ...state.user.profile.settings,
        theme: "light"
      }
    }
  }
};

// ✅ Craft way (simple and safe)
const next = craft(state, draft => {
  draft.user.profile.personal.age = 26;
  draft.user.profile.settings.theme = "light";
});
```

## No-op Detection

If you don't make any changes, Craft returns the original state:

```typescript
const state = { count: 5 };

const next = craft(state, draft => {
  // No changes made
});

console.log(state === next); // true
```

This optimization is important for preventing unnecessary re-renders in UI frameworks.

## Next Steps

- [Advanced Features](/guide/advanced) - Map/Set, Patches, Async operations
- [Configuration](/guide/configuration) - Customize Craft's behavior
- [Type Safety](/guide/type-safety) - TypeScript tips and tricks
- [API Reference](/api/) - Complete API documentation

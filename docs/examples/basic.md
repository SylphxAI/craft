# Basic Usage Examples

Examples of basic Craft usage patterns.

## Simple Object Updates

```typescript
import { craft } from "@sylphx/craft";

const state = {
  count: 0,
  name: "Alice",
  active: false
};

const next = craft(state, draft => {
  draft.count = 10;
  draft.name = "Bob";
  draft.active = true;
});

console.log(next);
// { count: 10, name: "Bob", active: true }

console.log(state);
// { count: 0, name: "Alice", active: false } - unchanged
```

## Incrementing Values

```typescript
const state = { count: 0, score: 100 };

const next = craft(state, draft => {
  draft.count++;
  draft.score += 10;
});

console.log(next); // { count: 1, score: 110 }
```

## Nested Objects

```typescript
const state = {
  user: {
    profile: {
      name: "Alice",
      age: 25,
      address: {
        city: "New York",
        country: "USA"
      }
    }
  }
};

const next = craft(state, draft => {
  draft.user.profile.age = 26;
  draft.user.profile.address.city = "Boston";
});

// Only modified parts are copied
console.log(state.user.profile.name === next.user.profile.name); // true
console.log(state.user.profile.age === next.user.profile.age); // false
```

## Arrays - Adding Elements

```typescript
const state = { items: [1, 2, 3] };

const next = craft(state, draft => {
  draft.items.push(4);
  draft.items.push(5);
});

console.log(next.items); // [1, 2, 3, 4, 5]
```

## Arrays - Updating Elements

```typescript
const state = {
  todos: [
    { id: 1, text: "Learn Craft", done: false },
    { id: 2, text: "Build app", done: false }
  ]
};

const next = craft(state, draft => {
  draft.todos[0].done = true;
  draft.todos[1].text = "Build amazing app";
});

console.log(next.todos[0].done); // true
console.log(next.todos[1].text); // "Build amazing app"
```

## Arrays - Removing Elements

```typescript
import { craft } from "@sylphx/craft";

const state = { items: [1, 2, 3, 4, 5] };

// Remove by index
const next1 = craft(state, draft => {
  draft.items.splice(2, 1); // Remove 3rd element
});
console.log(next1.items); // [1, 2, 4, 5]

// Remove by value
const next2 = craft(state, draft => {
  const index = draft.items.indexOf(3);
  if (index !== -1) {
    draft.items.splice(index, 1);
  }
});
console.log(next2.items); // [1, 2, 4, 5]
```

## Using nothing

```typescript
import { craft, nothing } from "@sylphx/craft";

// Delete object property
const state = { name: "Alice", age: 25, temp: "delete me" };
const next = craft(state, draft => {
  draft.temp = nothing;
});
console.log(next); // { name: "Alice", age: 25 }

// Remove array element
const state2 = { items: ["a", "b", "c", "d"] };
const next2 = craft(state2, draft => {
  draft.items[1] = nothing; // Remove "b"
});
console.log(next2.items); // ["a", "c", "d"]
```

## Returning New Values

You can return a completely new value to replace the entire state:

```typescript
const state = { count: 0, name: "Alice" };

const next = craft(state, draft => {
  // Return new value - mutations are ignored
  return { count: 100, name: "Bob" };
});

console.log(next); // { count: 100, name: "Bob" }
```

Conditional returns:

```typescript
const next = craft(state, draft => {
  if (shouldReset) {
    return { count: 0, name: "Default" };
  }

  draft.count++;
});
```

## Multiple Updates

```typescript
const state = {
  user: { name: "Alice", age: 25 },
  settings: { theme: "light", notifications: true },
  stats: { views: 0, likes: 0 }
};

const next = craft(state, draft => {
  // Update user
  draft.user.age = 26;

  // Update settings
  draft.settings.theme = "dark";
  draft.settings.notifications = false;

  // Update stats
  draft.stats.views++;
  draft.stats.likes += 5;
});
```

## Conditional Updates

```typescript
const next = craft(state, draft => {
  if (draft.count < 10) {
    draft.count++;
  }

  if (draft.user.age >= 18) {
    draft.user.verified = true;
  }

  if (draft.items.length === 0) {
    draft.items.push("default");
  }
});
```

## Type-Safe Updates

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

interface State {
  user: User;
  count: number;
}

const state: State = {
  user: { name: "Alice", age: 25, email: "alice@example.com" },
  count: 0
};

const next = craft(state, draft => {
  draft.user.name = "Bob"; // ✅ OK
  draft.count = 10; // ✅ OK

  // draft.user.age = "invalid"; // ❌ Type error
  // draft.nonexistent = true; // ❌ Type error
});
```

## No-op Detection

If no changes are made, the original state is returned:

```typescript
const state = { count: 5 };

const next = craft(state, draft => {
  // No changes
});

console.log(state === next); // true - same reference
```

This is important for preventing unnecessary re-renders in React:

```typescript
setState(current =>
  craft(current, draft => {
    // Only update if needed
    if (condition) {
      draft.value = newValue;
    }
  })
); // Won't cause re-render if condition is false
```

## Structural Sharing

Unchanged parts of the state tree maintain their references:

```typescript
const state = {
  users: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ],
  settings: { theme: "light" }
};

const next = craft(state, draft => {
  draft.users[0].name = "Alice Smith";
});

// Only changed parts are new references
console.log(state.users === next.users); // false - array changed
console.log(state.users[0] === next.users[0]); // false - first user changed
console.log(state.users[1] === next.users[1]); // true - second user unchanged
console.log(state.settings === next.settings); // true - settings unchanged
```

## Practical Example: Form State

```typescript
interface FormState {
  values: {
    name: string;
    email: string;
    age: number;
  };
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

const initialState: FormState = {
  values: { name: "", email: "", age: 0 },
  errors: {},
  touched: {},
  isSubmitting: false
};

// Update field
const updateField = (field: string, value: any) =>
  craft(state, draft => {
    draft.values[field] = value;
    draft.touched[field] = true;

    // Clear error when field is edited
    delete draft.errors[field];
  });

// Set errors
const setErrors = (errors: Record<string, string>) =>
  craft(state, draft => {
    draft.errors = errors;
  });

// Submit
const setSubmitting = (isSubmitting: boolean) =>
  craft(state, draft => {
    draft.isSubmitting = isSubmitting;
  });

// Reset
const reset = () =>
  craft(state, () => initialState);
```

## Next Steps

- [Arrays](/examples/arrays) - Array manipulation examples
- [Map & Set](/examples/map-set) - Collection examples
- [Async](/examples/async) - Async operation examples

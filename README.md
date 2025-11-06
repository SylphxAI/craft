# Craft

> A lightweight, functional, and blazingly fast alternative to immer for immutable state updates

Craft is a TypeScript library that makes working with immutable state simple and performant. It provides a clean API for updating complex nested state while maintaining structural sharing and type safety.

## Features

- **Blazingly Fast** - Optimized for performance, consistently faster than immer
- **Lightweight** - Minimal bundle size with zero dependencies
- **Type Safe** - Full TypeScript support with perfect type inference
- **Functional** - Embraces functional programming principles
- **Composable** - Chain and compose state transformations easily
- **Structural Sharing** - Unchanged parts of state are preserved (===)
- **Auto-freeze** - Results are automatically frozen in production

## Installation

```bash
# Using bun
bun add @sylphx/craft

# Using npm
npm install @sylphx/craft

# Using pnpm
pnpm add @sylphx/craft
```

## Quick Start

```typescript
import { craft } from "@sylphx/craft";

const baseState = {
  user: { name: "Alice", age: 25 },
  todos: [
    { id: 1, text: "Learn Craft", done: false },
    { id: 2, text: "Use Craft", done: false },
  ],
};

const nextState = craft(baseState, (draft) => {
  draft.user.age = 26;
  draft.todos[0].done = true;
  draft.todos.push({ id: 3, text: "Master Craft", done: false });
});

// Original is unchanged
console.log(baseState.user.age); // 25

// New state has the updates
console.log(nextState.user.age); // 26
console.log(nextState.todos.length); // 3

// Structural sharing - unchanged parts are the same reference
console.log(baseState.todos[1] === nextState.todos[1]); // true
```

## API

### `craft(base, producer)`

The main function to create a new state from an existing one.

```typescript
const nextState = craft(currentState, (draft) => {
  // Mutate draft as you like
  draft.count++;
  draft.user.name = "Bob";
});
```

**Direct return**: You can also return a new value directly from the producer:

```typescript
const nextState = craft(currentState, (draft) => {
  return { ...draft, count: 100 };
});
```

### `crafted(producer)`

Create a reusable updater function (curried version):

```typescript
const increment = crafted((draft: State) => {
  draft.count++;
});

const state1 = { count: 0 };
const state2 = increment(state1); // { count: 1 }
const state3 = increment(state2); // { count: 2 }
```

### `compose(...producers)`

Combine multiple producers into one:

```typescript
const increment = (draft: State) => {
  draft.count++;
};
const activate = (draft: State) => {
  draft.active = true;
};

const nextState = craft(baseState, compose(increment, activate));
```

### `composer(producer)`

Fluent API for chaining producers:

```typescript
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

### `pipe(base, ...producers)`

Apply multiple producers sequentially:

```typescript
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
  },
);
```

### `freeze(obj, deep?)`

Manually freeze an object:

```typescript
import { freeze } from "@sylphx/craft";

const frozen = freeze(myObject);
const deepFrozen = freeze(myObject, true);
```

## Performance

Craft is designed to be faster than immer while providing the same functionality. Run benchmarks yourself:

```bash
bun run bench
```

Typical results show Craft is **2-3x faster** than immer for most operations, with even better performance on simple updates.

## Why Craft?

**vs Manual Immutable Updates**

```typescript
// Manual (error-prone, verbose)
const nextState = {
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      age: state.user.profile.age + 1,
    },
  },
};

// Craft (simple, safe)
const nextState = craft(state, (draft) => {
  draft.user.profile.age++;
});
```

**vs Immer**

- Faster performance (2-3x in many cases)
- Smaller bundle size
- Simpler implementation
- Better TypeScript integration
- More functional API with composition utilities

## Type Safety

Craft has excellent TypeScript support with full type inference:

```typescript
interface State {
  count: number;
  user: {
    name: string;
    age: number;
  };
}

const state: State = { count: 0, user: { name: "Alice", age: 25 } };

craft(state, (draft) => {
  draft.count = "invalid"; // ❌ Type error
  draft.user.age = 26; // ✅ OK
  draft.nonexistent = true; // ❌ Type error
});
```

## How It Works

Craft uses ES6 Proxies to track which parts of your state tree are modified. When you modify a draft:

1. The proxy intercepts the change
2. A shallow copy of the changed object is created (copy-on-write)
3. Parent objects are also copied up to the root
4. Unchanged parts maintain their original references (structural sharing)
5. The result is automatically frozen

This ensures immutability while maximizing performance and memory efficiency.

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run benchmarks
bun bench

# Type checking
bun run typecheck

# Linting
bun run lint

# Format code
bun run format

# Build
bun run build
```

## License

MIT

## Credits

Inspired by [immer](https://github.com/immerjs/immer), but built for maximum performance and a functional API.

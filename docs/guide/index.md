# Getting Started

Welcome to Craft, the fastest immutable state library for TypeScript!

## What is Craft?

Craft is a **high-performance** TypeScript library that makes working with immutable state **simple, safe, and blazingly fast**. Through advanced architectural optimizations and zero-overhead design, Craft delivers performance that crushes the competition while maintaining a clean, functional API.

**Stop settling for slow immutable updates. Choose Craft.**

## Why Craft?

### Unmatched Performance

- 🚀 **1.4-7.6x faster** than immer across all operations
- 🔥 **Up to 35x faster** on large Set operations
- ⚡ **24x faster** applying JSON patches
- 💨 **3-6x faster** on Map/Set mutations
- 📦 **Only 4.6 KB gzipped** - 65% smaller than immer (13 KB)

### Developer Experience

- 🎯 **Type Safe** - Full TypeScript support with perfect inference
- 🧩 **Composable** - Powerful functional composition utilities
- 🛡️ **Battle-tested** - 100% immer API compatible
- 📚 **Zero Dependencies** - No bloat, just pure performance
- 🎨 **Modern API** - Functional-first design with currying support

## Quick Example

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

## How It Works

Craft uses ES6 Proxies to track which parts of your state tree are modified. When you modify a draft:

1. The proxy intercepts the change
2. A shallow copy of the changed object is created (copy-on-write)
3. Parent objects are also copied up to the root
4. Unchanged parts maintain their original references (structural sharing)
5. The result is automatically frozen

This ensures immutability while maximizing performance and memory efficiency.

## Next Steps

- [Installation](/guide/installation) - Install Craft in your project
- [Core Concepts](/guide/usage) - Learn the fundamentals
- [Advanced Features](/guide/advanced) - Explore Map/Set, patches, and more
- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - Real-world usage examples

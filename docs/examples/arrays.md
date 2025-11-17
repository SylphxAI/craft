# Array Examples

Comprehensive examples for working with arrays in Craft.

## Adding Elements

### push()

```typescript
import { craft } from "@sylphx/craft";

const state = { items: [1, 2, 3] };

const next = craft(state, draft => {
  draft.items.push(4);
  draft.items.push(5, 6); // Multiple at once
});

console.log(next.items); // [1, 2, 3, 4, 5, 6]
```

### unshift()

```typescript
const next = craft(state, draft => {
  draft.items.unshift(0); // Add to beginning
});

console.log(next.items); // [0, 1, 2, 3]
```

### splice()

```typescript
const next = craft(state, draft => {
  draft.items.splice(1, 0, 1.5); // Insert at index 1
});

console.log(next.items); // [1, 1.5, 2, 3]
```

## Updating Elements

### By Index

```typescript
const state = { items: [1, 2, 3, 4, 5] };

const next = craft(state, draft => {
  draft.items[0] = 10;
  draft.items[2] = 30;
});

console.log(next.items); // [10, 2, 30, 4, 5]
```

### By Condition

```typescript
const state = {
  todos: [
    { id: 1, text: "Task 1", done: false },
    { id: 2, text: "Task 2", done: false },
    { id: 3, text: "Task 3", done: false }
  ]
};

const next = craft(state, draft => {
  const todo = draft.todos.find(t => t.id === 2);
  if (todo) {
    todo.done = true;
    todo.text = "Updated Task 2";
  }
});
```

### Map Over Array

```typescript
const next = craft(state, draft => {
  draft.items.forEach((item, i) => {
    draft.items[i] = item * 2;
  });
});

console.log(next.items); // [2, 4, 6, 8, 10]
```

## Removing Elements

### splice()

```typescript
const state = { items: [1, 2, 3, 4, 5] };

const next = craft(state, draft => {
  draft.items.splice(2, 1); // Remove 1 element at index 2
});

console.log(next.items); // [1, 2, 4, 5]
```

### pop() / shift()

```typescript
// Remove last
const next1 = craft(state, draft => {
  draft.items.pop();
});
console.log(next1.items); // [1, 2, 3, 4]

// Remove first
const next2 = craft(state, draft => {
  draft.items.shift();
});
console.log(next2.items); // [2, 3, 4, 5]
```

### Using nothing

```typescript
import { craft, nothing } from "@sylphx/craft";

// Remove specific element
const next = craft(state, draft => {
  draft.items[2] = nothing;
});
console.log(next.items); // [1, 2, 4, 5]

// Remove multiple
const next2 = craft(state, draft => {
  draft.items[1] = nothing;
  draft.items[3] = nothing;
});
console.log(next2.items); // [1, 3, 5]
```

### Filter Pattern

```typescript
const state = {
  todos: [
    { id: 1, done: true },
    { id: 2, done: false },
    { id: 3, done: true }
  ]
};

// Remove completed todos
const next = craft(state, draft => {
  draft.todos.forEach((todo, i) => {
    if (todo.done) {
      draft.todos[i] = nothing;
    }
  });
});
console.log(next.todos); // [{ id: 2, done: false }]
```

## Array Methods

### sort()

```typescript
const state = { items: [3, 1, 4, 1, 5, 9] };

const next = craft(state, draft => {
  draft.items.sort((a, b) => a - b);
});

console.log(next.items); // [1, 1, 3, 4, 5, 9]
```

### reverse()

```typescript
const next = craft(state, draft => {
  draft.items.reverse();
});

console.log(next.items); // [5, 4, 3, 2, 1]
```

### concat() Pattern

```typescript
const state = { items: [1, 2, 3] };
const moreItems = [4, 5, 6];

const next = craft(state, draft => {
  draft.items.push(...moreItems);
});

console.log(next.items); // [1, 2, 3, 4, 5, 6]
```

## Complex Array Operations

### Reordering

```typescript
const state = {
  items: ["A", "B", "C", "D", "E"]
};

// Move item from index 1 to index 3
const next = craft(state, draft => {
  const [item] = draft.items.splice(1, 1); // Remove
  draft.items.splice(3, 0, item); // Insert
});

console.log(next.items); // ["A", "C", "D", "B", "E"]
```

### Swapping

```typescript
// Swap elements at index 0 and 2
const next = craft(state, draft => {
  [draft.items[0], draft.items[2]] = [draft.items[2], draft.items[0]];
});
```

### Bulk Updates

```typescript
const state = {
  users: [
    { id: 1, name: "Alice", active: false },
    { id: 2, name: "Bob", active: false },
    { id: 3, name: "Charlie", active: false }
  ]
};

// Activate all users
const next = craft(state, draft => {
  draft.users.forEach(user => {
    user.active = true;
  });
});
```

## Nested Arrays

```typescript
const state = {
  matrix: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]
};

const next = craft(state, draft => {
  draft.matrix[1][1] = 50; // Update middle element
  draft.matrix[0].push(4); // Add to first row
});

console.log(next.matrix);
// [
//   [1, 2, 3, 4],
//   [4, 50, 6],
//   [7, 8, 9]
// ]
```

## Array of Objects

### Update Specific Object

```typescript
const state = {
  users: [
    { id: 1, name: "Alice", score: 100 },
    { id: 2, name: "Bob", score: 150 },
    { id: 3, name: "Charlie", score: 200 }
  ]
};

// Update by ID
const next = craft(state, draft => {
  const user = draft.users.find(u => u.id === 2);
  if (user) {
    user.score += 50;
    user.name = "Robert";
  }
});
```

### Update Multiple Objects

```typescript
// Give everyone bonus points
const next = craft(state, draft => {
  draft.users.forEach(user => {
    user.score += 10;
  });
});
```

### Add New Object

```typescript
const next = craft(state, draft => {
  draft.users.push({
    id: Date.now(),
    name: "David",
    score: 0
  });
});
```

### Remove Object by ID

```typescript
const next = craft(state, draft => {
  const index = draft.users.findIndex(u => u.id === 2);
  if (index !== -1) {
    draft.users.splice(index, 1);
  }
});
```

## Practical Examples

### Shopping Cart

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface State {
  items: CartItem[];
}

// Add to cart
const addItem = (item: CartItem) =>
  craft(state, draft => {
    const existing = draft.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      draft.items.push(item);
    }
  });

// Update quantity
const updateQuantity = (id: string, quantity: number) =>
  craft(state, draft => {
    const item = draft.items.find(i => i.id === id);
    if (item) {
      item.quantity = quantity;
    }
  });

// Remove item
const removeItem = (id: string) =>
  craft(state, draft => {
    const index = draft.items.findIndex(i => i.id === id);
    if (index !== -1) {
      draft.items.splice(index, 1);
    }
  });

// Clear cart
const clearCart = () =>
  craft(state, draft => {
    draft.items = [];
  });
```

### Todo List

```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
  priority: "low" | "medium" | "high";
}

interface State {
  todos: Todo[];
}

// Add todo
const addTodo = (text: string, priority: Todo["priority"]) =>
  craft(state, draft => {
    draft.todos.push({
      id: Date.now(),
      text,
      done: false,
      priority
    });
  });

// Toggle todo
const toggleTodo = (id: number) =>
  craft(state, draft => {
    const todo = draft.todos.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
  });

// Remove completed
const removeCompleted = () =>
  craft(state, draft => {
    draft.todos.forEach((todo, i) => {
      if (todo.done) {
        draft.todos[i] = nothing;
      }
    });
  });

// Update priority
const updatePriority = (id: number, priority: Todo["priority"]) =>
  craft(state, draft => {
    const todo = draft.todos.find(t => t.id === id);
    if (todo) todo.priority = priority;
  });

// Sort by priority
const sortByPriority = () =>
  craft(state, draft => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    draft.todos.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  });
```

### Pagination

```typescript
interface State {
  items: any[];
  page: number;
  pageSize: number;
}

// Go to next page
const nextPage = () =>
  craft(state, draft => {
    draft.page++;
  });

// Go to previous page
const prevPage = () =>
  craft(state, draft => {
    if (draft.page > 0) {
      draft.page--;
    }
  });

// Change page size
const setPageSize = (size: number) =>
  craft(state, draft => {
    draft.pageSize = size;
    draft.page = 0; // Reset to first page
  });
```

## Performance Tips

1. **Use forEach for updates instead of map**
```typescript
// ✅ Good - modify in place
craft(state, draft => {
  draft.items.forEach((item, i) => {
    draft.items[i] = transform(item);
  });
});

// ❌ Less efficient - creates new array
craft(state, draft => {
  draft.items = draft.items.map(transform);
});
```

2. **Remove multiple elements efficiently**
```typescript
// ✅ Good - mark with nothing
craft(state, draft => {
  draft.items.forEach((item, i) => {
    if (shouldRemove(item)) {
      draft.items[i] = nothing;
    }
  });
});

// ❌ Less efficient - multiple splices
craft(state, draft => {
  draft.items.forEach((item, i) => {
    if (shouldRemove(item)) {
      draft.items.splice(i, 1);
    }
  });
});
```

## Next Steps

- [Map & Set](/examples/map-set) - Collection examples
- [Async](/examples/async) - Async operations
- [Composition](/examples/composition) - Reusable updaters

# Examples

Real-world usage examples for Craft.

## Quick Examples

### Simple Counter

```typescript
import { craft } from "@sylphx/craft";

interface State {
  count: number;
}

const state: State = { count: 0 };

const next = craft(state, draft => {
  draft.count++;
});

console.log(next.count); // 1
```

### Todo List

```typescript
import { craft, nothing } from "@sylphx/craft";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface State {
  todos: Todo[];
}

const state: State = {
  todos: [
    { id: 1, text: "Learn Craft", done: false },
    { id: 2, text: "Build app", done: false }
  ]
};

// Add todo
const next1 = craft(state, draft => {
  draft.todos.push({
    id: 3,
    text: "Deploy",
    done: false
  });
});

// Toggle todo
const next2 = craft(state, draft => {
  const todo = draft.todos.find(t => t.id === 1);
  if (todo) todo.done = true;
});

// Remove completed
const next3 = craft(state, draft => {
  draft.todos.forEach((todo, i) => {
    if (todo.done) {
      draft.todos[i] = nothing;
    }
  });
});
```

### User Profile

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

interface State {
  user: User;
}

// Update nested properties
const next = craft(state, draft => {
  draft.user.name = "Alice Smith";
  draft.user.settings.theme = "dark";
  draft.user.settings.notifications = true;
});
```

## More Examples

Explore detailed examples by category:

### [Basic Usage](/examples/basic)
- Simple updates
- Nested objects
- Arrays
- Returning values

### [Arrays](/examples/arrays)
- Adding elements
- Updating elements
- Removing elements
- Filtering and mapping

### [Map & Set](/examples/map-set)
- Map operations
- Set operations
- Nested collections
- Performance tips

### [JSON Patches](/examples/patches)
- Generating patches
- Applying patches
- Undo/Redo system
- State synchronization

### [Async Operations](/examples/async)
- Using createDraft/finishDraft
- Async updates
- Loading states
- Error handling

### [Composition](/examples/composition)
- Reusable updaters
- Composing producers
- Piping updates
- State machines

## Integration Examples

### React

```typescript
import { useState } from 'react';
import { craft } from '@sylphx/craft';

function TodoApp() {
  const [state, setState] = useState({
    todos: []
  });

  const addTodo = (text: string) => {
    setState(current =>
      craft(current, draft => {
        draft.todos.push({
          id: Date.now(),
          text,
          done: false
        });
      })
    );
  };

  const toggleTodo = (id: number) => {
    setState(current =>
      craft(current, draft => {
        const todo = draft.todos.find(t => t.id === id);
        if (todo) todo.done = !todo.done;
      })
    );
  };

  return (
    // ... JSX
  );
}
```

### Redux

```typescript
import { craft } from '@sylphx/craft';
import type { Reducer } from 'redux';

interface State {
  count: number;
  user: { name: string };
}

type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_NAME'; payload: string };

const reducer: Reducer<State, Action> = (state = initialState, action) => {
  return craft(state, draft => {
    switch (action.type) {
      case 'INCREMENT':
        draft.count++;
        break;
      case 'DECREMENT':
        draft.count--;
        break;
      case 'SET_NAME':
        draft.user.name = action.payload;
        break;
    }
  });
};
```

### Zustand

```typescript
import { create } from 'zustand';
import { craft } from '@sylphx/craft';

interface State {
  count: number;
  user: { name: string };
  increment: () => void;
  setName: (name: string) => void;
}

const useStore = create<State>((set) => ({
  count: 0,
  user: { name: 'Alice' },

  increment: () => set(state =>
    craft(state, draft => {
      draft.count++;
    })
  ),

  setName: (name) => set(state =>
    craft(state, draft => {
      draft.user.name = name;
    })
  ),
}));
```

## Next Steps

- [Basic Usage](/examples/basic) - Start with basics
- [API Reference](/api/) - Complete API docs
- [GitHub](https://github.com/SylphxAI/craft) - View source code

# Composition Examples

Examples for composing and reusing state updates.

## Reusable Updaters

### Using crafted()

```typescript
import { crafted } from "@sylphx/craft";

interface State {
  count: number;
  active: boolean;
  name: string;
}

// Create reusable updaters
const increment = crafted((draft: State) => {
  draft.count++;
});

const decrement = crafted((draft: State) => {
  draft.count--;
});

const reset = crafted((draft: State) => {
  draft.count = 0;
});

const activate = crafted((draft: State) => {
  draft.active = true;
});

const deactivate = crafted((draft: State) => {
  draft.active = false;
});

// Use them
let state: State = { count: 0, active: false, name: "App" };
state = increment(state); // { count: 1, ... }
state = increment(state); // { count: 2, ... }
state = activate(state); // { ..., active: true }
```

### Parameterized Updaters

```typescript
const setCount = (value: number) => crafted((draft: State) => {
  draft.count = value;
});

const setName = (name: string) => crafted((draft: State) => {
  draft.name = name;
});

const addToCount = (amount: number) => crafted((draft: State) => {
  draft.count += amount;
});

// Use with parameters
state = setCount(10)(state);
state = setName("MyApp")(state);
state = addToCount(5)(state);
```

## Using compose()

### Combining Updaters

```typescript
import { craft, compose } from "@sylphx/craft";

const increment = (draft: State) => {
  draft.count++;
};

const activate = (draft: State) => {
  draft.active = true;
};

const updateName = (name: string) => (draft: State) => {
  draft.name = name;
};

// Combine multiple updaters
const nextState = craft(
  state,
  compose(
    increment,
    activate,
    updateName("Updated")
  )
);
```

### Composable Actions

```typescript
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  count: number;
}

const addTodo = (text: string) => (draft: TodoState) => {
  draft.todos.push({
    id: Date.now(),
    text,
    done: false
  });
  draft.count++;
};

const setFilter = (filter: TodoState['filter']) => (draft: TodoState) => {
  draft.filter = filter;
};

const incrementCount = (draft: TodoState) => {
  draft.count++;
};

// Compose actions
const nextState = craft(
  state,
  compose(
    addTodo("New task"),
    setFilter('active'),
    incrementCount
  )
);
```

## Using pipe()

### Sequential Updates

```typescript
import { pipe } from "@sylphx/craft";

const result = pipe(
  initialState,
  (draft) => {
    draft.count = 0;
  },
  (draft) => {
    draft.count += 5;
  },
  (draft) => {
    draft.count *= 2;
  },
  (draft) => {
    draft.name = `Count: ${draft.count}`;
  }
);

console.log(result); // { count: 10, name: "Count: 10" }
```

### Data Processing Pipeline

```typescript
interface DataState {
  raw: any[];
  filtered: any[];
  transformed: any[];
  sorted: any[];
}

const loadData = (data: any[]) => (draft: DataState) => {
  draft.raw = data;
};

const filterData = (draft: DataState) => {
  draft.filtered = draft.raw.filter(item => item.active);
};

const transformData = (draft: DataState) => {
  draft.transformed = draft.filtered.map(item => ({
    ...item,
    timestamp: Date.now()
  }));
};

const sortData = (draft: DataState) => {
  draft.sorted = [...draft.transformed].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

// Process data through pipeline
const result = pipe(
  initialState,
  loadData(rawData),
  filterData,
  transformData,
  sortData
);
```

## Using composer()

### Fluent API

```typescript
import { composer } from "@sylphx/craft";

const updater = composer<State>((draft) => {
  draft.count = 0;
})
  .with((draft) => {
    draft.name = "App";
  })
  .with((draft) => {
    draft.active = true;
  });

const nextState = updater.produce(state);
```

### Conditional Composition

```typescript
let updater = composer<State>((draft) => {
  draft.count = 0;
});

if (shouldActivate) {
  updater = updater.with((draft) => {
    draft.active = true;
  });
}

if (shouldSetName) {
  updater = updater.with((draft) => {
    draft.name = "Default";
  });
}

const nextState = updater.produce(state);
```

### Builder Pattern

```typescript
class StateBuilder {
  private updater = composer<State>((draft) => {
    // Initialize
  });

  withCount(count: number) {
    this.updater = this.updater.with((draft) => {
      draft.count = count;
    });
    return this;
  }

  withName(name: string) {
    this.updater = this.updater.with((draft) => {
      draft.name = name;
    });
    return this;
  }

  activate() {
    this.updater = this.updater.with((draft) => {
      draft.active = true;
    });
    return this;
  }

  build(state: State): State {
    return this.updater.produce(state);
  }
}

// Usage
const nextState = new StateBuilder()
  .withCount(10)
  .withName("MyApp")
  .activate()
  .build(state);
```

## State Machine

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';

interface State {
  status: Status;
  data: any | null;
  error: string | null;
}

// Define transitions
const transitions = {
  startLoading: crafted((draft: State) => {
    draft.status = 'loading';
    draft.error = null;
  }),

  setSuccess: (data: any) => crafted((draft: State) => {
    draft.status = 'success';
    draft.data = data;
    draft.error = null;
  }),

  setError: (error: string) => crafted((draft: State) => {
    draft.status = 'error';
    draft.error = error;
  }),

  reset: crafted((draft: State) => {
    draft.status = 'idle';
    draft.data = null;
    draft.error = null;
  }),
};

// Use state machine
let state: State = { status: 'idle', data: null, error: null };

state = transitions.startLoading(state);
// Simulate async operation
state = transitions.setSuccess({ users: [] })(state);
```

## Redux-Style Actions

```typescript
interface AppState {
  counter: number;
  user: { name: string; email: string } | null;
  todos: Todo[];
}

const actions = {
  // Counter actions
  increment: crafted((draft: AppState) => {
    draft.counter++;
  }),

  decrement: crafted((draft: AppState) => {
    draft.counter--;
  }),

  setCounter: (value: number) => crafted((draft: AppState) => {
    draft.counter = value;
  }),

  // User actions
  setUser: (user: AppState['user']) => crafted((draft: AppState) => {
    draft.user = user;
  }),

  updateUserName: (name: string) => crafted((draft: AppState) => {
    if (draft.user) {
      draft.user.name = name;
    }
  }),

  clearUser: crafted((draft: AppState) => {
    draft.user = null;
  }),

  // Todo actions
  addTodo: (text: string) => crafted((draft: AppState) => {
    draft.todos.push({
      id: Date.now(),
      text,
      done: false
    });
  }),

  toggleTodo: (id: number) => crafted((draft: AppState) => {
    const todo = draft.todos.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
  }),

  removeTodo: (id: number) => crafted((draft: AppState) => {
    const index = draft.todos.findIndex(t => t.id === id);
    if (index !== -1) {
      draft.todos.splice(index, 1);
    }
  }),
};

// Usage
let state: AppState = {
  counter: 0,
  user: null,
  todos: []
};

state = actions.increment(state);
state = actions.setUser({ name: "Alice", email: "alice@example.com" })(state);
state = actions.addTodo("Learn Craft")(state);
```

## Middleware Pattern

```typescript
type Middleware<T> = (draft: Draft<T>) => void;

function withTimestamp<T>(): Middleware<T & { timestamp?: number }> {
  return (draft) => {
    draft.timestamp = Date.now();
  };
}

function withUserId<T>(userId: string): Middleware<T & { userId?: string }> {
  return (draft) => {
    draft.userId = userId;
  };
}

function withValidation<T extends { count: number }>(): Middleware<T> {
  return (draft) => {
    if (draft.count < 0) {
      draft.count = 0;
    }
  };
}

// Use middleware
const update = compose<State>(
  (draft) => {
    draft.count++;
  },
  withTimestamp(),
  withUserId("user-123"),
  withValidation()
);

const nextState = craft(state, update);
```

## Higher-Order Updaters

```typescript
function withLogging<T>(
  updater: (draft: Draft<T>) => void,
  label: string
): (draft: Draft<T>) => void {
  return (draft) => {
    console.log(`[${label}] Before:`, current(draft));
    updater(draft);
    console.log(`[${label}] After:`, current(draft));
  };
}

function withUndo<T>(
  updater: (draft: Draft<T>) => void,
  history: T[]
): (draft: Draft<T>) => void {
  return (draft) => {
    history.push(original(draft)!);
    updater(draft);
  };
}

// Usage
const history: State[] = [];

const increment = withLogging(
  withUndo(
    (draft: State) => {
      draft.count++;
    },
    history
  ),
  "increment"
);

const nextState = craft(state, increment);
```

## Factory Functions

```typescript
function createCounterActions<T extends { count: number }>() {
  return {
    increment: crafted((draft: T) => {
      draft.count++;
    }),

    decrement: crafted((draft: T) => {
      draft.count--;
    }),

    set: (value: number) => crafted((draft: T) => {
      draft.count = value;
    }),

    reset: crafted((draft: T) => {
      draft.count = 0;
    }),
  };
}

function createAsyncActions<T>(
  setLoading: (loading: boolean) => (draft: T) => void,
  setError: (error: string | null) => (draft: T) => void
) {
  return {
    startAsync: compose(
      setLoading(true),
      setError(null)
    ),

    finishSuccess: setLoading(false),

    finishError: (error: string) => compose(
      setLoading(false),
      setError(error)
    ),
  };
}

// Usage
const counterActions = createCounterActions<State>();
state = counterActions.increment(state);
```

## Next Steps

- [Basic Usage](/examples/basic) - Basic examples
- [API Reference](/api/composition) - Composition API
- [Guide](/guide/advanced) - Advanced features

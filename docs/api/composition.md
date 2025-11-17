# Composition

Utilities for composing and chaining state updates.

## crafted()

Create reusable curried updater functions.

### Signature

```typescript
function crafted<T>(
  producer: (draft: Draft<T>) => void | T
): (base: T) => T
```

### Parameters

- `producer` - The producer function to curry

### Returns

A curried function that takes a base state and returns the updated state.

### Usage

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

const decrement = crafted((draft: State) => {
  draft.count--;
});

const activate = crafted((draft: State) => {
  draft.active = true;
});

// Use them
const state1 = { count: 0, active: false };
const state2 = increment(state1); // { count: 1, active: false }
const state3 = increment(state2); // { count: 2, active: false }
const state4 = activate(state3); // { count: 2, active: true }
```

### With Parameters

```typescript
const setCount = (value: number) => crafted((draft: State) => {
  draft.count = value;
});

const setName = (name: string) => crafted((draft: State) => {
  draft.name = name;
});

const next = setCount(10)(state);
```

## compose()

Combine multiple producers into one.

### Signature

```typescript
function compose<T>(
  ...producers: ((draft: Draft<T>) => void | T)[]
): (draft: Draft<T>) => void
```

### Parameters

- `...producers` - Producer functions to combine

### Returns

A single combined producer function.

### Usage

```typescript
import { craft, compose } from "@sylphx/craft";

interface State {
  count: number;
  active: boolean;
  name: string;
}

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
  compose(
    increment,
    activate,
    setName("Alice")
  )
);
```

### Composing Reusable Updaters

```typescript
const incrementAndActivate = compose<State>(
  increment,
  activate
);

const next = craft(state, incrementAndActivate);
```

## pipe()

Apply multiple producers sequentially to a base state.

### Signature

```typescript
function pipe<T>(
  base: T,
  ...producers: ((draft: Draft<T>) => void | T)[]
): T
```

### Parameters

- `base` - The base state
- `...producers` - Producer functions to apply sequentially

### Returns

The final state after all producers are applied.

### Usage

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

### With Reusable Producers

```typescript
const increment = (draft: State) => {
  draft.count++;
};

const double = (draft: State) => {
  draft.count *= 2;
};

const activate = (draft: State) => {
  draft.active = true;
};

const result = pipe(
  { count: 5, active: false },
  increment, // count: 6
  double,    // count: 12
  activate   // active: true
);
// { count: 12, active: true }
```

## composer()

Fluent API for chaining producers.

### Signature

```typescript
function composer<T>(
  producer: (draft: Draft<T>) => void | T
): Composer<T>

interface Composer<T> {
  with(producer: (draft: Draft<T>) => void | T): Composer<T>;
  produce(base: T): T;
}
```

### Parameters

- `producer` - Initial producer function

### Returns

A `Composer` object with fluent API.

### Usage

```typescript
import { composer } from "@sylphx/craft";

interface State {
  count: number;
  name: string;
  active: boolean;
}

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

### Reusable Composers

```typescript
const userUpdater = composer<State>((draft) => {
  draft.user.lastModified = Date.now();
})
  .with((draft) => {
    draft.user.modifiedBy = "system";
  });

// Reuse the composer
const state1 = userUpdater.produce(baseState);
const state2 = userUpdater.produce(anotherState);
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

const next = updater.produce(state);
```

## Comparison

### compose() vs pipe()

```typescript
// compose() - combines producers, use with craft()
const combined = compose(producer1, producer2, producer3);
const next = craft(state, combined);

// pipe() - applies producers directly to state
const next = pipe(state, producer1, producer2, producer3);
```

### crafted() vs composer()

```typescript
// crafted() - simple curried producer
const increment = crafted((draft: State) => {
  draft.count++;
});
const next = increment(state);

// composer() - fluent API for chaining
const updater = composer<State>((draft) => {
  draft.count++;
}).with((draft) => {
  draft.active = true;
});
const next = updater.produce(state);
```

## Practical Examples

### Redux-style Actions

```typescript
interface State {
  count: number;
  user: { name: string; age: number };
}

const actions = {
  increment: crafted((draft: State) => {
    draft.count++;
  }),

  decrement: crafted((draft: State) => {
    draft.count--;
  }),

  setUser: (name: string, age: number) => crafted((draft: State) => {
    draft.user = { name, age };
  }),

  updateAge: (age: number) => crafted((draft: State) => {
    draft.user.age = age;
  }),
};

// Use actions
let state = { count: 0, user: { name: "Alice", age: 25 } };
state = actions.increment(state);
state = actions.setUser("Bob", 30)(state);
state = actions.updateAge(31)(state);
```

### Middleware-style Composition

```typescript
const withTimestamp = (draft: any) => {
  draft.timestamp = Date.now();
};

const withUserId = (userId: string) => (draft: any) => {
  draft.userId = userId;
};

const withValidation = (draft: State) => {
  if (draft.count < 0) {
    draft.count = 0;
  }
};

const update = compose(
  (draft) => { draft.count++; },
  withTimestamp,
  withUserId("user-123"),
  withValidation
);

const next = craft(state, update);
```

### State Machine

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';

interface State {
  status: Status;
  data: any;
  error: string | null;
}

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

// Use transitions
let state: State = { status: 'idle', data: null, error: null };
state = transitions.startLoading(state);
state = transitions.setSuccess({ users: [] })(state);
```

## Next Steps

- [Introspection API](/api/introspection) - Inspect draft state
- [Core Functions](/api/core) - Main API functions
- [Examples](/examples/composition) - Composition examples

# Async Operations Examples

Examples for handling async operations with Craft.

## Using createDraft / finishDraft

For async operations, use `createDraft` and `finishDraft` for manual control:

```typescript
import { createDraft, finishDraft } from "@sylphx/craft";

async function updateUser(state: State, userId: string) {
  const draft = createDraft(state);

  // Make changes over time
  const userData = await fetchUser(userId);
  draft.user = userData;

  // More async operations
  const settings = await fetchSettings(userId);
  draft.settings = settings;

  // Finalize when ready
  return finishDraft(draft);
}

const nextState = await updateUser(currentState, "123");
```

::: warning
Don't use the regular `craft` function with async producers. The draft is finalized immediately when the producer returns, even if it returns a Promise.
:::

## Loading States

### Simple Loading Pattern

```typescript
interface State {
  data: any | null;
  loading: boolean;
  error: string | null;
}

async function loadData(state: State) {
  // Set loading
  let draft = createDraft(state);
  draft.loading = true;
  draft.error = null;
  let current = finishDraft(draft);

  try {
    const data = await fetchData();

    // Set success
    draft = createDraft(current);
    draft.data = data;
    draft.loading = false;
    return finishDraft(draft);
  } catch (error) {
    // Set error
    draft = createDraft(current);
    draft.error = error.message;
    draft.loading = false;
    return finishDraft(draft);
  }
}
```

### With Status Union

```typescript
type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; data: any }
  | { type: 'error'; error: string };

interface State {
  status: Status;
}

async function loadData(state: State) {
  // Set loading
  let draft = createDraft(state);
  draft.status = { type: 'loading' };
  let current = finishDraft(draft);

  try {
    const data = await fetchData();

    // Set success
    draft = createDraft(current);
    draft.status = { type: 'success', data };
    return finishDraft(draft);
  } catch (error) {
    // Set error
    draft = createDraft(current);
    draft.status = { type: 'error', error: error.message };
    return finishDraft(draft);
  }
}
```

## Multiple Async Operations

### Sequential

```typescript
async function loadAllData(state: State) {
  const draft = createDraft(state);

  // Load sequentially
  draft.user = await fetchUser();
  draft.settings = await fetchSettings();
  draft.preferences = await fetchPreferences();

  return finishDraft(draft);
}
```

### Parallel

```typescript
async function loadAllDataParallel(state: State) {
  const draft = createDraft(state);

  // Load in parallel
  const [user, settings, preferences] = await Promise.all([
    fetchUser(),
    fetchSettings(),
    fetchPreferences()
  ]);

  draft.user = user;
  draft.settings = settings;
  draft.preferences = preferences;

  return finishDraft(draft);
}
```

## React Integration

### useState with Async

```typescript
import { useState } from 'react';
import { createDraft, finishDraft } from '@sylphx/craft';

function useAsyncState<T>(initialState: T) {
  const [state, setState] = useState(initialState);

  const updateAsync = async (
    updater: (draft: Draft<T>) => Promise<void>
  ) => {
    const draft = createDraft(state);
    await updater(draft);
    setState(finishDraft(draft));
  };

  return [state, updateAsync] as const;
}

// Usage
function UserProfile() {
  const [state, updateAsync] = useAsyncState({
    user: null,
    loading: false
  });

  const loadUser = async (id: string) => {
    await updateAsync(async (draft) => {
      draft.loading = true;
      try {
        draft.user = await fetchUser(id);
      } finally {
        draft.loading = false;
      }
    });
  };

  return (
    // ... JSX
  );
}
```

### useReducer with Async

```typescript
import { useReducer } from 'react';
import { craft, createDraft, finishDraft } from '@sylphx/craft';

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: any }
  | { type: 'LOAD_ERROR'; error: string };

function reducer(state: State, action: Action): State {
  return craft(state, draft => {
    switch (action.type) {
      case 'LOAD_START':
        draft.loading = true;
        draft.error = null;
        break;
      case 'LOAD_SUCCESS':
        draft.data = action.payload;
        draft.loading = false;
        break;
      case 'LOAD_ERROR':
        draft.error = action.error;
        draft.loading = false;
        break;
    }
  });
}

function DataLoader() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadData = async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const data = await fetchData();
      dispatch({ type: 'LOAD_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', error: error.message });
    }
  };

  return (
    // ... JSX
  );
}
```

## Debounced Updates

```typescript
import { createDraft, finishDraft } from '@sylphx/craft';

class DebouncedState<T> {
  private draft: Draft<T> | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private state: T,
    private delay: number,
    private onUpdate: (state: T) => void
  ) {}

  update(producer: (draft: Draft<T>) => void): void {
    // Create draft if needed
    if (!this.draft) {
      this.draft = createDraft(this.state);
    }

    // Apply updates
    producer(this.draft);

    // Clear existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Set new timer
    this.timer = setTimeout(() => {
      if (this.draft) {
        this.state = finishDraft(this.draft);
        this.draft = null;
        this.onUpdate(this.state);
      }
    }, this.delay);
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.draft) {
      this.state = finishDraft(this.draft);
      this.draft = null;
      this.onUpdate(this.state);
    }
  }
}

// Usage
const debounced = new DebouncedState(
  initialState,
  500,
  (state) => {
    console.log("Updated:", state);
  }
);

// Multiple rapid updates
debounced.update(draft => { draft.count++; });
debounced.update(draft => { draft.count++; });
debounced.update(draft => { draft.count++; });
// Only one finalization after 500ms

// Force immediate finalization
debounced.flush();
```

## Batched Updates

```typescript
class BatchedUpdates<T> {
  private draft: Draft<T> | null = null;
  private batchId = 0;

  constructor(
    private state: T,
    private onUpdate: (state: T) => void
  ) {}

  startBatch(): number {
    if (!this.draft) {
      this.draft = createDraft(this.state);
      this.batchId++;
    }
    return this.batchId;
  }

  update(producer: (draft: Draft<T>) => void): void {
    if (!this.draft) {
      this.startBatch();
    }
    producer(this.draft!);
  }

  commitBatch(batchId?: number): void {
    if (batchId && batchId !== this.batchId) {
      throw new Error("Batch ID mismatch");
    }

    if (this.draft) {
      this.state = finishDraft(this.draft);
      this.draft = null;
      this.onUpdate(this.state);
    }
  }

  cancelBatch(): void {
    this.draft = null;
  }
}

// Usage
const batched = new BatchedUpdates(
  initialState,
  (state) => setState(state)
);

const batchId = batched.startBatch();
batched.update(draft => { draft.count++; });
batched.update(draft => { draft.name = "Alice"; });
batched.update(draft => { draft.active = true; });
batched.commitBatch(batchId);
```

## Async Validation

```typescript
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  validating: Record<string, boolean>;
}

async function validateField(
  state: FormState,
  field: string,
  value: any,
  validator: (value: any) => Promise<string | null>
): Promise<FormState> {
  // Set validating
  let draft = createDraft(state);
  draft.validating[field] = true;
  delete draft.errors[field];
  let current = finishDraft(draft);

  try {
    const error = await validator(value);

    // Set result
    draft = createDraft(current);
    draft.validating[field] = false;
    if (error) {
      draft.errors[field] = error;
    }
    return finishDraft(draft);
  } catch (err) {
    // Set error
    draft = createDraft(current);
    draft.validating[field] = false;
    draft.errors[field] = "Validation failed";
    return finishDraft(draft);
  }
}

// Usage
const nextState = await validateField(
  state,
  "email",
  "test@example.com",
  async (email) => {
    const exists = await checkEmailExists(email);
    return exists ? "Email already taken" : null;
  }
);
```

## Streaming Updates

```typescript
async function streamData(
  state: State,
  stream: ReadableStream<Uint8Array>,
  onProgress: (state: State) => void
): Promise<State> {
  const draft = createDraft(state);
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      draft.data += chunk;
      draft.progress = calculateProgress();

      // Report progress
      onProgress(finishDraft(createDraft(draft)));
    }

    draft.complete = true;
    return finishDraft(draft);
  } catch (error) {
    draft.error = error.message;
    return finishDraft(draft);
  }
}
```

## Polling

```typescript
class PollingState<T> {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private state: T,
    private onUpdate: (state: T) => void
  ) {}

  startPolling(
    fetcher: () => Promise<Partial<T>>,
    interval: number
  ): void {
    this.intervalId = setInterval(async () => {
      try {
        const data = await fetcher();
        const draft = createDraft(this.state);
        Object.assign(draft, data);
        this.state = finishDraft(draft);
        this.onUpdate(this.state);
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, interval);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Usage
const polling = new PollingState(initialState, setState);
polling.startPolling(() => fetchLatestData(), 5000);

// Stop when done
polling.stopPolling();
```

## Next Steps

- [Composition](/examples/composition) - Reusable updaters
- [Patches](/examples/patches) - JSON Patches
- [API Reference](/api/core) - Core API

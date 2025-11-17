# JSON Patches Examples

Examples for working with JSON Patches (RFC 6902) in Craft.

::: tip Performance
Craft's patch application is **24x faster** than immer!
:::

## Generating Patches

### Basic Patches

```typescript
import { craftWithPatches } from "@sylphx/craft";

const state = {
  count: 0,
  user: { name: "Alice" }
};

const [nextState, patches, inversePatches] = craftWithPatches(state, draft => {
  draft.count = 5;
  draft.user.name = "Bob";
});

console.log(patches);
// [
//   { op: 'replace', path: ['count'], value: 5 },
//   { op: 'replace', path: ['user', 'name'], value: 'Bob' }
// ]

console.log(inversePatches);
// [
//   { op: 'replace', path: ['count'], value: 0 },
//   { op: 'replace', path: ['user', 'name'], value: 'Alice' }
// ]
```

### Array Patches

```typescript
const state = { items: [1, 2, 3] };

const [next, patches] = craftWithPatches(state, draft => {
  draft.items.push(4);
  draft.items[0] = 10;
});

console.log(patches);
// [
//   { op: 'replace', path: ['items', 0], value: 10 },
//   { op: 'add', path: ['items', 3], value: 4 }
// ]
```

### Nested Patches

```typescript
const state = {
  user: {
    profile: {
      name: "Alice",
      age: 25
    }
  }
};

const [next, patches] = craftWithPatches(state, draft => {
  draft.user.profile.age = 26;
});

console.log(patches);
// [
//   { op: 'replace', path: ['user', 'profile', 'age'], value: 26 }
// ]
```

## Applying Patches

### Basic Application

```typescript
import { applyPatches } from "@sylphx/craft";

const state = { count: 0, name: "Alice" };

const patches = [
  { op: 'replace', path: ['count'], value: 5 },
  { op: 'replace', path: ['name'], value: 'Bob' }
];

const next = applyPatches(state, patches);
console.log(next); // { count: 5, name: "Bob" }
```

### Roundtrip

```typescript
// Generate patches
const [next, patches, inversePatches] = craftWithPatches(state, draft => {
  draft.count = 10;
});

// Recreate using patches
const recreated = applyPatches(state, patches);
console.log(recreated.count === next.count); // true

// Undo using inverse patches
const reverted = applyPatches(next, inversePatches);
console.log(reverted.count === state.count); // true
```

## Undo/Redo System

### Basic Undo/Redo

```typescript
import { craftWithPatches, applyPatches, type Patch } from "@sylphx/craft";

class UndoRedo<T> {
  private past: Patch[][] = [];
  private future: Patch[][] = [];

  constructor(private state: T) {}

  getState(): T {
    return this.state;
  }

  update(producer: (draft: any) => void): T {
    const [next, _, inversePatches] = craftWithPatches(
      this.state,
      producer
    );

    this.past.push(inversePatches);
    this.future = []; // Clear redo stack
    this.state = next;

    return next;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undo(): T {
    const patches = this.past.pop();
    if (!patches) return this.state;

    const next = applyPatches(this.state, patches);

    // Generate patches for redo
    const [_, __, redoPatches] = craftWithPatches(
      this.state,
      () => next
    );

    this.future.push(redoPatches);
    this.state = next;

    return next;
  }

  redo(): T {
    const patches = this.future.pop();
    if (!patches) return this.state;

    const next = applyPatches(this.state, patches);

    // Generate patches for undo
    const [_, __, undoPatches] = craftWithPatches(
      this.state,
      () => next
    );

    this.past.push(undoPatches);
    this.state = next;

    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}

// Usage
interface State {
  count: number;
  text: string;
}

const history = new UndoRedo<State>({ count: 0, text: "" });

history.update(draft => { draft.count = 1; });
history.update(draft => { draft.count = 2; });
history.update(draft => { draft.text = "hello"; });

console.log(history.getState()); // { count: 2, text: "hello" }

history.undo();
console.log(history.getState()); // { count: 2, text: "" }

history.undo();
console.log(history.getState()); // { count: 1, text: "" }

history.redo();
console.log(history.getState()); // { count: 2, text: "" }
```

### Advanced Undo/Redo with History Limits

```typescript
class LimitedHistory<T> {
  private past: Patch[][] = [];
  private future: Patch[][] = [];
  private maxHistorySize: number;

  constructor(
    private state: T,
    maxHistorySize: number = 50
  ) {
    this.maxHistorySize = maxHistorySize;
  }

  update(producer: (draft: any) => void): T {
    const [next, _, inversePatches] = craftWithPatches(
      this.state,
      producer
    );

    this.past.push(inversePatches);

    // Limit history size
    if (this.past.length > this.maxHistorySize) {
      this.past.shift();
    }

    this.future = [];
    this.state = next;

    return next;
  }

  undo(): T {
    if (this.past.length === 0) return this.state;

    const patches = this.past.pop()!;
    const next = applyPatches(this.state, patches);

    const [_, __, redoPatches] = craftWithPatches(
      this.state,
      () => next
    );

    this.future.push(redoPatches);
    this.state = next;

    return next;
  }

  redo(): T {
    if (this.future.length === 0) return this.state;

    const patches = this.future.pop()!;
    const next = applyPatches(this.state, patches);

    const [_, __, undoPatches] = craftWithPatches(
      this.state,
      () => next
    );

    this.past.push(undoPatches);
    this.state = next;

    return next;
  }

  getHistoryInfo() {
    return {
      canUndo: this.past.length > 0,
      canRedo: this.future.length > 0,
      undoCount: this.past.length,
      redoCount: this.future.length
    };
  }
}
```

## State Synchronization

### Client-Server Sync

```typescript
interface Message {
  type: 'update';
  patches: Patch[];
}

class SyncedState<T> {
  constructor(
    private state: T,
    private sendToServer: (msg: Message) => void
  ) {}

  update(producer: (draft: any) => void): T {
    const [next, patches] = craftWithPatches(this.state, producer);

    // Send patches to server
    this.sendToServer({
      type: 'update',
      patches
    });

    this.state = next;
    return next;
  }

  applyServerUpdate(patches: Patch[]): T {
    this.state = applyPatches(this.state, patches);
    return this.state;
  }
}

// Usage
const syncedState = new SyncedState(initialState, (msg) => {
  websocket.send(JSON.stringify(msg));
});

// Client update
syncedState.update(draft => {
  draft.count++;
});

// Server update received
websocket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  syncedState.applyServerUpdate(msg.patches);
};
```

### Collaborative Editing

```typescript
class CollaborativeState<T> {
  private localVersion = 0;
  private serverVersion = 0;

  constructor(
    private state: T,
    private clientId: string,
    private sendPatch: (patch: any) => void
  ) {}

  localUpdate(producer: (draft: any) => void): T {
    const [next, patches] = craftWithPatches(this.state, producer);

    this.localVersion++;

    // Send to server with version info
    this.sendPatch({
      clientId: this.clientId,
      version: this.localVersion,
      patches
    });

    this.state = next;
    return next;
  }

  applyRemoteUpdate(patches: Patch[], fromVersion: number): T {
    if (fromVersion !== this.serverVersion) {
      console.warn("Version mismatch - need conflict resolution");
      return this.state;
    }

    this.state = applyPatches(this.state, patches);
    this.serverVersion++;

    return this.state;
  }
}
```

## Audit Logging

### Change Tracking

```typescript
interface ChangeLog {
  timestamp: number;
  userId: string;
  patches: Patch[];
}

class AuditableState<T> {
  private changelog: ChangeLog[] = [];

  constructor(private state: T) {}

  update(producer: (draft: any) => void, userId: string): T {
    const [next, patches] = craftWithPatches(this.state, producer);

    // Log the change
    this.changelog.push({
      timestamp: Date.now(),
      userId,
      patches
    });

    this.state = next;
    return next;
  }

  getChangelog(): ChangeLog[] {
    return [...this.changelog];
  }

  replayHistory(): T[] {
    const states: T[] = [this.state];
    let current = this.state;

    for (const log of this.changelog) {
      current = applyPatches(current, log.patches);
      states.push(current);
    }

    return states;
  }

  getChangesByUser(userId: string): ChangeLog[] {
    return this.changelog.filter(log => log.userId === userId);
  }
}
```

### Detailed Change Tracking

```typescript
class ChangeTracker<T> {
  private changes: Array<{
    timestamp: number;
    patches: Patch[];
    inversePatches: Patch[];
    metadata?: any;
  }> = [];

  constructor(private state: T) {}

  update(
    producer: (draft: any) => void,
    metadata?: any
  ): T {
    const [next, patches, inversePatches] = craftWithPatches(
      this.state,
      producer
    );

    this.changes.push({
      timestamp: Date.now(),
      patches,
      inversePatches,
      metadata
    });

    this.state = next;
    return next;
  }

  getChangeSummary() {
    return {
      totalChanges: this.changes.length,
      firstChange: this.changes[0]?.timestamp,
      lastChange: this.changes[this.changes.length - 1]?.timestamp,
      patches: this.changes.flatMap(c => c.patches)
    };
  }

  exportChanges() {
    return JSON.stringify(this.changes);
  }

  importChanges(json: string) {
    const changes = JSON.parse(json);
    for (const change of changes) {
      this.state = applyPatches(this.state, change.patches);
      this.changes.push(change);
    }
  }
}
```

## Optimistic Updates

### With Rollback

```typescript
class OptimisticState<T> {
  private pendingPatches: Map<string, Patch[]> = new Map();

  constructor(private state: T) {}

  async optimisticUpdate(
    producer: (draft: any) => void,
    apiCall: () => Promise<void>
  ): Promise<T> {
    const requestId = crypto.randomUUID();

    // Apply optimistically
    const [next, _, inversePatches] = craftWithPatches(
      this.state,
      producer
    );

    this.pendingPatches.set(requestId, inversePatches);
    this.state = next;

    try {
      await apiCall();
      this.pendingPatches.delete(requestId);
      return this.state;
    } catch (error) {
      // Rollback on error
      const patches = this.pendingPatches.get(requestId);
      if (patches) {
        this.state = applyPatches(this.state, patches);
        this.pendingPatches.delete(requestId);
      }
      throw error;
    }
  }
}

// Usage
const state = new OptimisticState({ count: 0 });

await state.optimisticUpdate(
  draft => { draft.count++; },
  () => api.incrementCounter()
);
```

## Next Steps

- [Async](/examples/async) - Async operations
- [Composition](/examples/composition) - Reusable updaters
- [API Reference](/api/core#craftwithpatches) - Patch API docs

# Map & Set Examples

Examples for working with ES6 Map and Set collections in Craft.

::: tip Performance
Craft's Map/Set implementation is **3-35x faster** than immer!
:::

## Map Operations

### Basic Map Usage

```typescript
import { craft } from "@sylphx/craft";

const state = {
  users: new Map([
    ["alice", { name: "Alice", age: 25 }],
    ["bob", { name: "Bob", age: 30 }]
  ])
};

const next = craft(state, draft => {
  // Add new entry
  draft.users.set("charlie", { name: "Charlie", age: 35 });

  // Update existing entry
  const alice = draft.users.get("alice");
  if (alice) alice.age = 26;

  // Delete entry
  draft.users.delete("bob");
});

console.log(next.users.has("alice")); // true
console.log(next.users.has("bob")); // false
console.log(next.users.has("charlie")); // true
```

### Map Methods

```typescript
const state = { map: new Map<string, number>() };

const next = craft(state, draft => {
  // set()
  draft.map.set("a", 1);
  draft.map.set("b", 2);
  draft.map.set("c", 3);

  // get()
  const value = draft.map.get("a");
  console.log(value); // 1

  // has()
  if (draft.map.has("b")) {
    draft.map.set("b", 20);
  }

  // delete()
  draft.map.delete("c");

  // size
  console.log(draft.map.size); // 2
});
```

### Iterating Maps

```typescript
const next = craft(state, draft => {
  // forEach()
  draft.users.forEach((user, key) => {
    user.lastUpdated = Date.now();
  });

  // entries()
  for (const [key, user] of draft.users.entries()) {
    if (user.age < 18) {
      draft.users.delete(key);
    }
  }

  // keys()
  for (const key of draft.users.keys()) {
    console.log(key);
  }

  // values()
  for (const user of draft.users.values()) {
    user.verified = true;
  }
});
```

### Clear Map

```typescript
const next = craft(state, draft => {
  draft.users.clear(); // Remove all entries
});
```

## Set Operations

### Basic Set Usage

```typescript
const state = {
  tags: new Set(["javascript", "typescript", "react"])
};

const next = craft(state, draft => {
  // Add elements
  draft.tags.add("vue");
  draft.tags.add("angular");

  // Delete elements
  draft.tags.delete("react");

  // Check existence
  if (draft.tags.has("typescript")) {
    console.log("TypeScript is included");
  }
});

console.log([...next.tags]);
// ["javascript", "typescript", "vue", "angular"]
```

### Set Methods

```typescript
const state = { set: new Set<number>() };

const next = craft(state, draft => {
  // add()
  draft.set.add(1);
  draft.set.add(2);
  draft.set.add(3);

  // has()
  if (draft.set.has(2)) {
    console.log("Has 2");
  }

  // delete()
  draft.set.delete(1);

  // size
  console.log(draft.set.size); // 2
});
```

### Iterating Sets

```typescript
const state = { numbers: new Set([1, 2, 3, 4, 5]) };

const next = craft(state, draft => {
  // forEach()
  draft.numbers.forEach(num => {
    if (num % 2 === 0) {
      draft.numbers.delete(num);
    }
  });

  // values() / keys() (same for Set)
  for (const num of draft.numbers.values()) {
    console.log(num);
  }

  // entries()
  for (const [value1, value2] of draft.numbers.entries()) {
    console.log(value1 === value2); // true for Set
  }
});
```

### Clear Set

```typescript
const next = craft(state, draft => {
  draft.tags.clear(); // Remove all elements
});
```

## Nested Collections

### Map of Maps

```typescript
const state = {
  userPermissions: new Map([
    ["user1", new Map([
      ["read", true],
      ["write", false]
    ])],
    ["user2", new Map([
      ["read", true],
      ["write", true]
    ])]
  ])
};

const next = craft(state, draft => {
  // Get nested map
  const user1Perms = draft.userPermissions.get("user1");
  if (user1Perms) {
    user1Perms.set("write", true);
    user1Perms.set("delete", false);
  }

  // Add new user
  draft.userPermissions.set("user3", new Map([
    ["read", true],
    ["write", false]
  ]));
});
```

### Set of Objects

```typescript
interface User {
  id: number;
  name: string;
}

const state = {
  activeUsers: new Set<User>([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ])
};

const next = craft(state, draft => {
  // Add new user
  draft.activeUsers.add({ id: 3, name: "Charlie" });

  // Update objects in set
  draft.activeUsers.forEach(user => {
    if (user.id === 1) {
      user.name = "Alice Smith";
    }
  });
});
```

### Map with Array Values

```typescript
const state = {
  taggedPosts: new Map([
    ["javascript", [1, 2, 3]],
    ["typescript", [2, 4, 5]]
  ])
};

const next = craft(state, draft => {
  // Update array in map
  const jsPosts = draft.taggedPosts.get("javascript");
  if (jsPosts) {
    jsPosts.push(6);
  }

  // Add new tag with posts
  draft.taggedPosts.set("react", [7, 8]);
});
```

## Practical Examples

### Cache Implementation

```typescript
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface State {
  cache: Map<string, CacheEntry<any>>;
}

// Add to cache
const setCache = <T>(key: string, value: T) =>
  craft(state, draft => {
    draft.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  });

// Get from cache (check expiry)
const getCache = (key: string, maxAge: number) => {
  const entry = state.cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > maxAge) {
    // Expired - remove it
    return craft(state, draft => {
      draft.cache.delete(key);
    });
  }

  return entry.value;
};

// Clear old entries
const clearOldCache = (maxAge: number) =>
  craft(state, draft => {
    const now = Date.now();
    for (const [key, entry] of draft.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        draft.cache.delete(key);
      }
    }
  });
```

### User Roles

```typescript
interface State {
  userRoles: Map<string, Set<string>>;
}

// Add role to user
const addRole = (userId: string, role: string) =>
  craft(state, draft => {
    let roles = draft.userRoles.get(userId);
    if (!roles) {
      roles = new Set();
      draft.userRoles.set(userId, roles);
    }
    roles.add(role);
  });

// Remove role from user
const removeRole = (userId: string, role: string) =>
  craft(state, draft => {
    const roles = draft.userRoles.get(userId);
    if (roles) {
      roles.delete(role);
      if (roles.size === 0) {
        draft.userRoles.delete(userId);
      }
    }
  });

// Check if user has role
const hasRole = (userId: string, role: string): boolean => {
  const roles = state.userRoles.get(userId);
  return roles?.has(role) ?? false;
};

// Get all roles for user
const getUserRoles = (userId: string): string[] => {
  const roles = state.userRoles.get(userId);
  return roles ? [...roles] : [];
};
```

### Graph Adjacency List

```typescript
interface State {
  graph: Map<string, Set<string>>;
}

// Add edge
const addEdge = (from: string, to: string) =>
  craft(state, draft => {
    let neighbors = draft.graph.get(from);
    if (!neighbors) {
      neighbors = new Set();
      draft.graph.set(from, neighbors);
    }
    neighbors.add(to);
  });

// Remove edge
const removeEdge = (from: string, to: string) =>
  craft(state, draft => {
    const neighbors = draft.graph.get(from);
    if (neighbors) {
      neighbors.delete(to);
    }
  });

// Get neighbors
const getNeighbors = (node: string): string[] => {
  const neighbors = state.graph.get(node);
  return neighbors ? [...neighbors] : [];
};
```

### Tag System

```typescript
interface State {
  itemTags: Map<string, Set<string>>;
  taggedItems: Map<string, Set<string>>;
}

// Add tag to item
const addTag = (itemId: string, tag: string) =>
  craft(state, draft => {
    // Add to itemTags
    let tags = draft.itemTags.get(itemId);
    if (!tags) {
      tags = new Set();
      draft.itemTags.set(itemId, tags);
    }
    tags.add(tag);

    // Add to taggedItems (reverse index)
    let items = draft.taggedItems.get(tag);
    if (!items) {
      items = new Set();
      draft.taggedItems.set(tag, items);
    }
    items.add(itemId);
  });

// Remove tag from item
const removeTag = (itemId: string, tag: string) =>
  craft(state, draft => {
    const tags = draft.itemTags.get(itemId);
    if (tags) tags.delete(tag);

    const items = draft.taggedItems.get(tag);
    if (items) items.delete(itemId);
  });

// Get items by tag
const getItemsByTag = (tag: string): string[] => {
  const items = state.taggedItems.get(tag);
  return items ? [...items] : [];
};

// Get tags for item
const getItemTags = (itemId: string): string[] => {
  const tags = state.itemTags.get(itemId);
  return tags ? [...tags] : [];
};
```

## Performance Tips

1. **Map is faster than object for frequent additions/deletions**
```typescript
// ✅ Good for dynamic keys
state.map.set(dynamicKey, value);
state.map.delete(dynamicKey);

// ❌ Less efficient with object
delete state.obj[dynamicKey];
state.obj[dynamicKey] = value;
```

2. **Set is faster for uniqueness checks**
```typescript
// ✅ Good - O(1) lookup
if (state.uniqueIds.has(id)) { ... }

// ❌ Less efficient - O(n) lookup
if (state.uniqueIds.includes(id)) { ... }
```

3. **Craft's Map/Set is 3-35x faster than immer**
```typescript
// Craft excels at Map/Set operations
const next = craft(state, draft => {
  draft.largeSet.add(item); // Up to 35x faster!
});
```

## Next Steps

- [JSON Patches](/examples/patches) - Patch examples
- [Async](/examples/async) - Async operations
- [Composition](/examples/composition) - Reusable updaters

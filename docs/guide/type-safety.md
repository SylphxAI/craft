# Type Safety

Craft has excellent TypeScript support with full type inference and strong type safety guarantees.

## Perfect Type Inference

Craft automatically infers types from your state:

```typescript
import { craft } from "@sylphx/craft";

const state = {
  count: 0,
  user: {
    name: "Alice",
    age: 25
  }
};

const next = craft(state, (draft) => {
  draft.count = "invalid"; // ❌ Type error: Type 'string' not assignable to 'number'
  draft.user.age = 26; // ✅ OK
  draft.nonexistent = true; // ❌ Type error: Property 'nonexistent' does not exist
});
```

## Explicit Type Annotations

You can provide explicit types for better IDE support:

```typescript
interface State {
  count: number;
  user: {
    name: string;
    age: number;
  };
}

const state: State = {
  count: 0,
  user: { name: "Alice", age: 25 }
};

craft(state, (draft) => {
  // draft is typed as Draft<State>
  draft.user.age = 26;
});
```

## Draft Types

The `Draft<T>` type represents a mutable version of your state:

```typescript
import { Draft } from "@sylphx/craft";

interface User {
  readonly name: string;
  readonly age: number;
}

interface State {
  readonly users: readonly User[];
  readonly count: number;
}

// Draft removes readonly modifiers
type DraftState = Draft<State>;
// {
//   users: User[];
//   count: number;
// }
```

## Type Utilities

### castDraft()

Cast immutable types to draft types (type-level only):

```typescript
import { castDraft } from "@sylphx/craft";

const immutableState: Readonly<State> = { count: 0 };
const draft = castDraft(immutableState);

// Now you can mutate (at type level)
draft.count = 1;
```

::: warning
This is a type-level cast only. It doesn't actually make the object mutable at runtime.
:::

### castImmutable()

Cast mutable types to immutable types (type-level only):

```typescript
import { castImmutable } from "@sylphx/craft";

const mutableState: State = { count: 0 };
const immutable = castImmutable(mutableState);

immutable.count = 1; // ❌ Type error
```

## Readonly State

Craft works seamlessly with readonly state:

```typescript
interface State {
  readonly count: number;
  readonly items: readonly string[];
}

const state: State = {
  count: 0,
  items: ["a", "b"]
};

const next = craft(state, (draft) => {
  draft.count++; // ✅ OK - readonly removed in draft
  draft.items.push("c"); // ✅ OK
});

// Result is readonly again
next.count = 5; // ❌ Type error
```

## Generic State Types

Create generic updater functions:

```typescript
import { crafted } from "@sylphx/craft";

function createIncrementer<T extends { count: number }>(by: number) {
  return crafted((draft: T) => {
    draft.count += by;
  });
}

const increment = createIncrementer<State>(1);
const state = { count: 0, name: "test" };
const next = increment(state); // { count: 1, name: "test" }
```

## Type-Safe Producers

Producer functions are fully type-checked:

```typescript
import { Producer } from "@sylphx/craft";

interface State {
  count: number;
  name: string;
}

const increment: Producer<State> = (draft) => {
  draft.count++;
  draft.name = "updated";
};

const next = craft(state, increment);
```

## Complex Nested Types

Craft handles complex nested types correctly:

```typescript
interface DeepState {
  level1: {
    level2: {
      level3: {
        value: number;
      }[];
    };
  };
}

const state: DeepState = {
  level1: {
    level2: {
      level3: [{ value: 1 }]
    }
  }
};

craft(state, (draft) => {
  // Full type safety at all levels
  draft.level1.level2.level3[0].value = 2; // ✅ OK
  draft.level1.level2.level3[0].wrong = 3; // ❌ Type error
});
```

## Union Types

Craft preserves union types correctly:

```typescript
interface Loading {
  status: "loading";
}

interface Success {
  status: "success";
  data: string;
}

interface Error {
  status: "error";
  error: string;
}

type State = Loading | Success | Error;

const state: State = { status: "loading" };

craft(state, (draft) => {
  if (draft.status === "loading") {
    // TypeScript knows this is Loading
    draft.status = "success";
  }
});
```

## Type Guards

Use type guards within producers:

```typescript
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'name' in value;
}

craft(state, (draft) => {
  if (isUser(draft.data)) {
    draft.data.name = "Alice"; // ✅ Type-safe
  }
});
```

## Common Type Patterns

### Optional Fields

```typescript
interface State {
  user?: {
    name: string;
  };
}

craft(state, (draft) => {
  if (draft.user) {
    draft.user.name = "Bob"; // ✅ OK - narrowed by type guard
  }
});
```

### Arrays of Unions

```typescript
type Item =
  | { type: "text"; content: string }
  | { type: "image"; url: string };

interface State {
  items: Item[];
}

craft(state, (draft) => {
  draft.items.forEach(item => {
    if (item.type === "text") {
      item.content = "updated"; // ✅ Type-safe
    } else {
      item.url = "https://..."; // ✅ Type-safe
    }
  });
});
```

### Mapped Types

```typescript
interface State {
  users: Record<string, { name: string; age: number }>;
}

craft(state, (draft) => {
  draft.users["alice"] = { name: "Alice", age: 25 }; // ✅ OK
  draft.users["bob"].age = 30; // ✅ OK
});
```

## TSConfig Recommendations

For the best experience with Craft:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "target": "ES2015",
    "lib": ["ES2015"]
  }
}
```

## Next Steps

- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - Real-world usage examples
- [Configuration](/guide/configuration) - Configure Craft's behavior

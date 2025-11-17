# Configuration

Functions for configuring Craft's behavior.

## setAutoFreeze()

Control automatic freezing of returned state.

### Signature

```typescript
function setAutoFreeze(enabled: boolean): void
```

### Parameters

- `enabled` - `true` to enable auto-freeze, `false` to disable

### Default

Auto-freeze is **enabled** by default.

### Usage

```typescript
import { setAutoFreeze, craft } from "@sylphx/craft";

// Disable auto-freeze
setAutoFreeze(false);

const next = craft(state, draft => {
  draft.count = 5;
});

// Result is NOT frozen
next.count = 10; // ✅ Works (but breaks immutability!)
```

### When to Disable

**Production Optimization:**
```typescript
if (process.env.NODE_ENV === 'production') {
  // Disable for performance
  setAutoFreeze(false);
}
```

**Benefits of disabling:**
- Slightly better performance (no freeze overhead)
- Smaller bundle size if tree-shaken

**Risks of disabling:**
- Can accidentally mutate state
- Breaks immutability guarantees
- Harder to debug

### When to Enable

**Development Safety:**
```typescript
if (process.env.NODE_ENV === 'development') {
  // Enable for safety
  setAutoFreeze(true);
}
```

**Benefits of enabling:**
- Prevents accidental mutations
- Enforces immutability
- Easier to debug

::: tip Recommendation
Enable in development, optionally disable in production for maximum performance.
:::

## setUseStrictShallowCopy()

Use strict shallow copy that includes non-enumerable properties.

### Signature

```typescript
function setUseStrictShallowCopy(enabled: boolean): void
```

### Parameters

- `enabled` - `true` to use strict copy, `false` for default

### Default

Strict shallow copy is **disabled** by default.

### Usage

```typescript
import { setUseStrictShallowCopy } from "@sylphx/craft";

// Enable strict shallow copy
setUseStrictShallowCopy(true);
```

### Difference

**Default shallow copy:**
- Only copies enumerable properties
- Uses `Object.assign()` or spread
- Faster

**Strict shallow copy:**
- Copies all properties (including non-enumerable)
- Uses `Object.getOwnPropertyDescriptors()`
- Preserves property attributes
- Slightly slower

### Example

```typescript
const obj = {};
Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false
});

// Default copy
setUseStrictShallowCopy(false);
const next1 = craft({ obj }, draft => {
  draft.obj.visible = true;
});
console.log(next1.obj.hidden); // undefined - non-enumerable not copied

// Strict copy
setUseStrictShallowCopy(true);
const next2 = craft({ obj }, draft => {
  draft.obj.visible = true;
});
console.log(next2.obj.hidden); // "secret" - non-enumerable copied
```

### When to Use

Enable strict shallow copy when:
- Working with objects that have non-enumerable properties
- Need to preserve property descriptors
- Integrating with libraries that use non-enumerable properties

## setCustomShallowCopy()

Provide custom cloning logic for special object types.

### Signature

```typescript
function setCustomShallowCopy(
  fn: (value: any, defaultCopy: (value: any) => any) => any
): void
```

### Parameters

- `fn` - Custom copy function that receives:
  - `value` - The value to copy
  - `defaultCopy` - The default copy function (fallback)

### Usage

```typescript
import { setCustomShallowCopy } from "@sylphx/craft";

class CustomClass {
  constructor(public id: number, public data: string) {}

  clone(): CustomClass {
    return new CustomClass(this.id, this.data);
  }
}

setCustomShallowCopy((value, defaultCopy) => {
  // Handle custom class
  if (value instanceof CustomClass) {
    return value.clone();
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value);
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value);
  }

  // Fall back to default
  return defaultCopy(value);
});

// Now custom types are properly cloned
const state = {
  custom: new CustomClass(1, "test"),
  date: new Date(),
  regex: /test/g
};

const next = craft(state, draft => {
  draft.custom.data = "updated";
});

// Custom class was cloned using .clone()
console.log(next.custom instanceof CustomClass); // true
```

### Advanced Examples

#### Class Instances

```typescript
class User {
  constructor(
    public id: string,
    public name: string,
    private password: string
  ) {}

  clone(): User {
    return new User(this.id, this.name, this.password);
  }
}

setCustomShallowCopy((value, defaultCopy) => {
  if (value instanceof User) {
    return value.clone();
  }
  return defaultCopy(value);
});
```

#### Immutable.js Integration

```typescript
import { Map as ImmutableMap, List as ImmutableList } from 'immutable';

setCustomShallowCopy((value, defaultCopy) => {
  // Immutable.js structures are already immutable
  if (ImmutableMap.isMap(value) || ImmutableList.isList(value)) {
    return value; // No need to copy
  }

  return defaultCopy(value);
});
```

#### Typed Arrays

```typescript
setCustomShallowCopy((value, defaultCopy) => {
  // Handle typed arrays
  if (ArrayBuffer.isView(value)) {
    return value.slice(); // Create copy
  }

  return defaultCopy(value);
});
```

#### Symbols as Keys

```typescript
setCustomShallowCopy((value, defaultCopy) => {
  if (typeof value === 'object' && value !== null) {
    const copied = defaultCopy(value);

    // Also copy symbol properties
    Object.getOwnPropertySymbols(value).forEach(sym => {
      copied[sym] = value[sym];
    });

    return copied;
  }

  return defaultCopy(value);
});
```

### Performance Considerations

**Custom shallow copy:**
- Zero overhead when not configured
- Only called when object is modified
- Keep implementation fast

**Best practices:**
```typescript
setCustomShallowCopy((value, defaultCopy) => {
  // Quick type checks first
  if (value instanceof MyClass) {
    return value.clone(); // Fast path
  }

  // Default copy for everything else
  return defaultCopy(value); // Don't do expensive checks
});
```

### Reset Configuration

To reset to default:

```typescript
// Reset to default copy
setCustomShallowCopy((value, defaultCopy) => defaultCopy(value));

// Or just pass defaultCopy directly
setCustomShallowCopy((_value, defaultCopy) => defaultCopy);
```

## Configuration Best Practices

### Development vs Production

```typescript
// config.ts
import {
  setAutoFreeze,
  setUseStrictShallowCopy,
  enableDebugMode
} from "@sylphx/craft";

export function configureCraft() {
  const isDev = process.env.NODE_ENV === 'development';

  // Auto-freeze only in development
  setAutoFreeze(isDev);

  // Debug mode only in development
  if (isDev) {
    enableDebugMode({
      enabled: true,
      logChanges: true,
    });
  }

  // Strict copy if needed (both environments)
  setUseStrictShallowCopy(false);
}
```

### Application Initialization

```typescript
// main.ts
import { configureCraft } from './craft-config';

// Configure once at startup
configureCraft();

// Rest of your application
import { craft } from "@sylphx/craft";
// ... use craft
```

### Testing Configuration

```typescript
// test-setup.ts
import { setAutoFreeze } from "@sylphx/craft";

// Enable auto-freeze in tests for safety
beforeAll(() => {
  setAutoFreeze(true);
});
```

## Configuration Order

1. Set custom shallow copy (if needed)
2. Set strict shallow copy (if needed)
3. Set auto-freeze
4. Enable debug mode (development only)

```typescript
import {
  setCustomShallowCopy,
  setUseStrictShallowCopy,
  setAutoFreeze,
  enableDebugMode
} from "@sylphx/craft";

// 1. Custom copy (affects all copies)
setCustomShallowCopy((value, defaultCopy) => {
  // Your custom logic
  return defaultCopy(value);
});

// 2. Strict copy (affects default copy behavior)
setUseStrictShallowCopy(false);

// 3. Auto-freeze (affects finalization)
setAutoFreeze(true);

// 4. Debug mode (development only)
if (process.env.NODE_ENV === 'development') {
  enableDebugMode({ enabled: true });
}
```

## Summary

| Function | Purpose | Default | When to Change |
|----------|---------|---------|----------------|
| `setAutoFreeze()` | Auto-freeze results | Enabled | Disable in production for performance |
| `setUseStrictShallowCopy()` | Include non-enumerable | Disabled | Enable for special property handling |
| `setCustomShallowCopy()` | Custom cloning | None | Set for custom classes/types |

## Next Steps

- [Guide: Configuration](/guide/configuration) - Configuration guide
- [Debugging API](/api/debugging) - Debug utilities
- [Core Functions](/api/core) - Main API

# Configuration

Craft provides several configuration options to customize its behavior.

## Auto-Freeze

By default, Craft automatically freezes the result to prevent accidental mutations:

```typescript
import { setAutoFreeze } from "@sylphx/craft";

// Disable auto-freeze for better performance (use in production)
setAutoFreeze(false);

// Enable auto-freeze (default, recommended for development)
setAutoFreeze(true);
```

::: tip Production Optimization
Disabling auto-freeze can improve performance in production builds where you have confidence in your code not mutating the result.
:::

::: warning
When auto-freeze is disabled, you must be careful not to mutate the returned state, as this would break immutability guarantees.
:::

## Strict Shallow Copy

Enable strict shallow copy to include non-enumerable properties:

```typescript
import { setUseStrictShallowCopy } from "@sylphx/craft";

// Use strict shallow copy (includes non-enumerable properties)
setUseStrictShallowCopy(true);

// Use default shallow copy (enumerable properties only)
setUseStrictShallowCopy(false); // default
```

::: info
This is useful when working with objects that have non-enumerable properties that need to be preserved.
:::

## Custom Shallow Copy

Provide custom cloning logic for special object types:

```typescript
import { setCustomShallowCopy } from "@sylphx/craft";

class CustomClass {
  constructor(public id: number, public data: string) {}

  clone(): CustomClass {
    return new CustomClass(this.id, this.data);
  }
}

setCustomShallowCopy((value, defaultCopy) => {
  // Handle special types with custom cloning
  if (value instanceof CustomClass) {
    return value.clone();
  }

  // Handle other special cases
  if (value instanceof Date) {
    return new Date(value);
  }

  // Fall back to default shallow copy
  return defaultCopy(value);
});
```

**Features:**
- Zero overhead when not configured
- Flexible callback interface
- Complete control over cloning behavior
- Useful for class instances, special objects, etc.

**Use cases:**
- Custom class instances with specific cloning requirements
- Objects with special serialization needs
- Integration with third-party libraries
- Optimizing copy performance for specific types

## Debug Mode

Enable debug mode for development:

```typescript
import { enableDebugMode, disableDebugMode } from "@sylphx/craft";

// Enable with options
enableDebugMode({
  enabled: true,
  logChanges: true,     // Log all changes
  trackChanges: true,   // Track change metadata
});

// Disable debug mode
disableDebugMode();
```

Check debug status:

```typescript
import { isDebugEnabled, getDebugConfig } from "@sylphx/craft";

console.log(isDebugEnabled()); // true/false

const config = getDebugConfig();
console.log(config);
// { enabled: true, logChanges: true, trackChanges: true }
```

::: warning Performance Impact
Debug mode adds overhead and should only be enabled during development. Always disable it in production.
:::

## Configuration Best Practices

### Development Configuration

```typescript
import { setAutoFreeze, enableDebugMode } from "@sylphx/craft";

if (process.env.NODE_ENV === 'development') {
  // Enable strict checks in development
  setAutoFreeze(true);

  enableDebugMode({
    enabled: true,
    logChanges: true,
    trackChanges: true,
  });
}
```

### Production Configuration

```typescript
import { setAutoFreeze } from "@sylphx/craft";

if (process.env.NODE_ENV === 'production') {
  // Optimize for performance
  setAutoFreeze(false);
}
```

### TypeScript Configuration

```typescript
import { setCustomShallowCopy } from "@sylphx/craft";

// Configure once at app initialization
function setupCraft() {
  setCustomShallowCopy((value, defaultCopy) => {
    // Your custom logic
    if (value instanceof MyClass) {
      return value.clone();
    }
    return defaultCopy(value);
  });
}

// Call during app startup
setupCraft();
```

## Environment-Specific Setup

Create a configuration module:

```typescript
// craft-config.ts
import {
  setAutoFreeze,
  enableDebugMode,
  setCustomShallowCopy
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
      trackChanges: true,
    });
  }

  // Custom shallow copy (all environments)
  setCustomShallowCopy((value, defaultCopy) => {
    // Your custom logic here
    return defaultCopy(value);
  });
}
```

Then import and call in your app entry point:

```typescript
// main.ts
import { configureCraft } from './craft-config';

configureCraft();

// Rest of your app...
```

## Next Steps

- [Type Safety](/guide/type-safety) - TypeScript tips and tricks
- [Debugging](/api/debugging) - Debug utilities reference
- [API Reference](/api/configuration) - Configuration API details

# Installation

## Package Manager

Install Craft using your preferred package manager:

::: code-group

```bash [bun]
bun add @sylphx/craft
```

```bash [npm]
npm install @sylphx/craft
```

```bash [pnpm]
pnpm add @sylphx/craft
```

```bash [yarn]
yarn add @sylphx/craft
```

:::

## Import

```typescript
// Import the main function
import { craft } from "@sylphx/craft";

// Or import specific utilities
import {
  craft,
  crafted,
  compose,
  pipe,
  createDraft,
  finishDraft,
  isDraft,
  current,
  original
} from "@sylphx/craft";
```

## TypeScript Configuration

Craft is written in TypeScript and includes full type definitions out of the box. No additional `@types` package is needed.

For the best experience, ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "node"
  }
}
```

## Browser Support

Craft uses ES6 Proxies, which are supported in:

- Chrome 49+
- Firefox 18+
- Safari 10+
- Edge 12+
- Node.js 6+

::: warning ES6 Proxy Required
Craft cannot be polyfilled for older browsers that don't support ES6 Proxies. If you need to support IE11 or older browsers, you'll need to use a different solution.
:::

## Bundle Size

Craft is designed to be lightweight:

- **4.6 KB** gzipped (65% smaller than immer)
- **Zero dependencies**
- Tree-shakeable (import only what you need)

## Verification

Verify your installation:

```typescript
import { craft } from "@sylphx/craft";

const state = { count: 0 };
const next = craft(state, draft => {
  draft.count = 1;
});

console.log(next.count); // 1
console.log(state.count); // 0
```

If this works, you're all set!

## Next Steps

- [Core Concepts](/guide/usage) - Learn how to use Craft
- [API Reference](/api/) - Explore the full API
- [Examples](/examples/) - See real-world examples

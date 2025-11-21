/**
 * Optimized proxy handler for draft objects
 * Performance improvements:
 * 1. Reduced Map lookups for child drafts
 * 2. Lazy proxy creation for array elements
 * 3. Fast path for primitive values
 * 4. Optimized property descriptor handling
 */

import { createMapProxy, createSetProxy, isMap, isSet } from "./map-set";
import { nothing } from "./nothing";
import {
  DRAFT_STATE,
  type DraftState,
  getState,
  isDraft,
  isDraftable,
  latest,
  markChanged,
  shallowCopy,
} from "./utils";

// Fast path checks
const ARRAY_METHODS = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse"]);

export function createProxy(base: any, parent: DraftState | null = null): any {
  // Fast path: return non-draftable values as-is
  if (!isDraftable(base)) {
    return base;
  }

  // Handle Map and Set with dedicated proxies
  if (isMap(base)) {
    return createMapProxy(base, parent);
  }
  if (isSet(base)) {
    return createSetProxy(base, parent);
  }

  const isArray = Array.isArray(base);

  const state: DraftState = {
    base,
    copy: null,
    modified: false,
    parent,
    revoked: false,
    finalized: false,
  };

  const target = isArray ? [] : ({} as any);

  const handler: ProxyHandler<any> = {
    get(_, prop) {
      // Fast path: DRAFT_STATE symbol
      if (prop === DRAFT_STATE) return state;

      // Handle array length with pending appends
      if (isArray && prop === "length" && state.arrayAppends && state.arrayAppends.length > 0) {
        const baseLength = state.base.length;
        return baseLength + state.arrayAppends.length;
      }

      // Inline latest() for better performance
      const source = state.copy ?? state.base;
      const value = source[prop];

      // Handle array index access with pending appends
      if (isArray && typeof prop === "string" && !isNaN(Number(prop)) && state.arrayAppends) {
        const index = Number(prop);
        const baseLength = state.base.length;
        if (index >= baseLength && index < baseLength + state.arrayAppends.length) {
          // Return from pending appends
          const value = state.arrayAppends[index - baseLength];

          // If it's a draftable object, create a proxy
          if (isDraftable(value)) {
            if (!state.drafts) {
              state.drafts = new Map();
            }
            const cached = state.drafts.get(prop);
            if (cached) return cached;

            const childDraft = createProxy(value, state);
            state.drafts.set(prop, childDraft);
            state.arrayAppends[index - baseLength] = childDraft;
            return childDraft;
          }

          return value;
        }
      }

      // Fast path: primitives and methods
      if (typeof value !== "object" || value === null) {
        // Wrap array mutating methods
        if (isArray && typeof value === "function" && ARRAY_METHODS.has(prop as string)) {
          // Optimization: Handle push separately to avoid O(n) copy
          // Only use this optimization if we haven't created a copy yet
          if (prop === "push" && !state.copy) {
            return function (this: any, ...items: any[]) {
              if (!state.modified) {
                state.modified = true;
                if (state.parent) {
                  markChanged(state.parent);
                }
              }
              // Track items to append instead of copying entire array
              if (!state.arrayAppends) {
                state.arrayAppends = [];
              }
              state.arrayAppends.push(...items);
              // Return new length
              const baseLength = state.base.length;
              const appendLength = state.arrayAppends.length;
              return baseLength + appendLength;
            };
          }

          // For other mutations, fall back to copy-on-write
          if (!state.modified) {
            markChanged(state);
          }
          // Return method from copy
          return state.copy![prop];
        }
        return value;
      }

      // If it's already a draft, return it
      if (isDraft(value)) {
        return value;
      }

      // If accessing a nested draftable object, wrap it in a proxy
      if (isDraftable(value)) {
        // OPTIMIZATION: only create draft if value is from base
        // This avoids creating copies for values that were already replaced
        if (value === state.base[prop]) {
          // If we have array appends, materialize the array first
          if (state.arrayAppends && state.arrayAppends.length > 0) {
            const materialized = [...state.base, ...state.arrayAppends];
            state.copy = materialized;
            state.arrayAppends = undefined;
          }

          // Use drafts map stored on state - faster than WeakMap lookup
          if (!state.drafts) {
            state.drafts = new Map();
          }

          const cached = state.drafts.get(prop);
          if (cached) return cached;

          // Create new child draft
          const childDraft = createProxy(value, state);
          state.drafts.set(prop, childDraft);

          // prepareCopy - ensure parent has a copy before storing child draft
          if (!state.copy) {
            state.copy = shallowCopy(state.base);
          }
          state.copy[prop] = childDraft;

          return childDraft;
        }
        // Value was already replaced, return it directly
        return value;
      }

      return value;
    },

    set(_, prop, value) {
      // If using array appends optimization, need to materialize copy for non-append operations
      if (state.arrayAppends && state.arrayAppends.length > 0) {
        // Materialize the array (combine base + appends)
        const materialized = [...state.base, ...state.arrayAppends];
        state.copy = materialized;
        state.arrayAppends = undefined;
      }

      // Inline latest() for better performance
      const source = state.copy ?? state.base;
      const current = source[prop];

      // Handle nothing symbol - delete the property/element
      if (value === nothing) {
        if (!(prop in source)) {
          return true;
        }

        markChanged(state);

        if (isArray) {
          state.copy![prop] = nothing;
        } else {
          delete state.copy![prop];
        }

        // Clear child draft
        state.drafts?.delete(prop);

        return true;
      }

      // Unwrap value if it's a draft
      const valueState = getState(value);
      const actualValue = valueState ? latest(valueState) : value;

      // Fast path: no change
      if (Object.is(current, actualValue)) {
        return true;
      }

      // Mark as modified and update copy
      markChanged(state);
      state.copy![prop] = actualValue;

      // Clear child draft for this property since it's being replaced
      state.drafts?.delete(prop);

      return true;
    },

    deleteProperty(_, prop) {
      markChanged(state);
      delete state.copy![prop];

      // Clear child draft
      state.drafts?.delete(prop);

      return true;
    },

    has(_, prop) {
      return prop in (state.copy ?? state.base);
    },

    ownKeys(_) {
      return Reflect.ownKeys(state.copy ?? state.base);
    },

    getOwnPropertyDescriptor(_, prop) {
      const source = state.copy ?? state.base;
      const desc = Reflect.getOwnPropertyDescriptor(source, prop);
      if (desc) {
        // Fast path: preserve array length descriptor
        if (isArray && prop === "length") {
          return desc;
        }
        return {
          ...desc,
          configurable: true,
          writable: true,
        };
      }
      return desc;
    },
  };

  const proxy = new Proxy(target, handler);

  return proxy;
}

export function revokeProxy(draft: any): void {
  const state = getState(draft);
  if (state) {
    state.revoked = true;
  }
}

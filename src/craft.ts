/**
 * Core craft function - the main API
 */

import { createProxy } from "./proxy";
import type { Draft, Producer } from "./types";
import { finalize, getState } from "./utils";

/**
 * Create a new state based on the current state and a producer function
 *
 * @param base - The base state to modify
 * @param producer - A function that receives a draft and modifies it
 * @returns The new state (or the original if no changes were made)
 *
 * @example
 * ```ts
 * const state = { count: 0, user: { name: "Alice" } };
 * const next = craft(state, (draft) => {
 *   draft.count++;
 *   draft.user.name = "Bob";
 * });
 * ```
 */
export function craft<T>(base: T, producer: Producer<T>): T {
  // Handle direct return from producer
  const draft = createProxy(base, null);
  const result = producer(draft as Draft<T>);

  // If producer returns a value, use it directly
  if (result !== undefined) {
    return result;
  }

  // Otherwise, finalize the draft
  const state = getState(draft);
  if (!state) {
    return base;
  }

  return finalize(state);
}

/**
 * Curried version of craft - useful for creating reusable updaters
 *
 * @param producer - A function that receives a draft and modifies it
 * @returns A function that takes a base state and returns the new state
 *
 * @example
 * ```ts
 * const increment = crafted((draft: { count: number }) => {
 *   draft.count++;
 * });
 *
 * const state = { count: 0 };
 * const next = increment(state); // { count: 1 }
 * ```
 */
export function crafted<T>(producer: Producer<T>): (base: T) => T {
  return (base: T) => craft(base, producer);
}

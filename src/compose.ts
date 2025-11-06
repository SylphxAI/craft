/**
 * Composition utilities for craft
 */

import { craft } from "./craft";
import type { Composer, Producer } from "./types";

/**
 * Compose multiple producers into a single producer
 *
 * @param producers - Producer functions to compose
 * @returns A single producer that applies all producers in sequence
 *
 * @example
 * ```ts
 * const increment = (draft: State) => { draft.count++; };
 * const setName = (draft: State) => { draft.name = "Bob"; };
 *
 * const state = { count: 0, name: "Alice" };
 * const next = craft(state, compose(increment, setName));
 * // { count: 1, name: "Bob" }
 * ```
 */
export function compose<T>(...producers: Producer<T>[]): Producer<T> {
  return (draft) => {
    for (const producer of producers) {
      const result = producer(draft);
      // If any producer returns a value, stop and return it
      if (result !== undefined) {
        return result;
      }
    }
  };
}

/**
 * Create a fluent composer for chaining producers
 *
 * @param producer - Initial producer function
 * @returns A composer object with chainable methods
 *
 * @example
 * ```ts
 * const updater = composer<State>((draft) => { draft.count++; })
 *   .with((draft) => { draft.name = "Bob"; })
 *   .with((draft) => { draft.active = true; });
 *
 * const state = { count: 0, name: "Alice", active: false };
 * const next = updater.produce(state);
 * ```
 */
export function composer<T>(producer: Producer<T>): Composer<T>;
export function composer<T>(producers: Producer<T>[]): Composer<T>;
export function composer<T>(arg: Producer<T> | Producer<T>[]): Composer<T> {
  const producers: Producer<T>[] = Array.isArray(arg) ? arg : [arg];

  return {
    with(nextProducer: Producer<T>): Composer<T> {
      // Create a new composer with the combined producers (immutable)
      return composer([...producers, nextProducer]);
    },
    produce(base: T): T {
      return craft(base, compose(...producers));
    },
  };
}

/**
 * Apply multiple producers to a base state sequentially
 *
 * @param base - The base state
 * @param producers - Producer functions to apply
 * @returns The final state after applying all producers
 *
 * @example
 * ```ts
 * const state = { count: 0 };
 * const next = pipe(
 *   state,
 *   (draft) => { draft.count++; },
 *   (draft) => { draft.count *= 2; }
 * );
 * // { count: 2 }
 * ```
 */
export function pipe<T>(base: T, ...producers: Producer<T>[]): T {
  return craft(base, compose(...producers));
}

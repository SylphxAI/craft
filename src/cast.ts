/**
 * TypeScript type casting utilities
 */

import type { Draft, Immutable } from "./types";

/**
 * Cast an immutable value to a draft type (for TypeScript only)
 * This is a type-only operation and has no runtime effect
 *
 * @param value - The immutable value to cast
 * @returns The same value with Draft type
 *
 * @example
 * ```ts
 * const immutable: Readonly<State> = getState();
 * const draft = castDraft(immutable);
 * // Now TypeScript treats draft as mutable
 * ```
 */
export function castDraft<T>(value: T): Draft<T> {
  return value as any;
}

/**
 * Cast a draft or mutable value to immutable type (for TypeScript only)
 * This is a type-only operation and has no runtime effect
 *
 * @param value - The mutable value to cast
 * @returns The same value with Immutable type
 *
 * @example
 * ```ts
 * const mutable: State = getMutableState();
 * const immutable = castImmutable(mutable);
 * // Now TypeScript treats immutable as readonly
 * ```
 */
export function castImmutable<T>(value: T): Immutable<T> {
  return value as any;
}

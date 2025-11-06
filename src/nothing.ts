/**
 * Special symbol to delete properties or array elements
 */

/**
 * Special symbol to indicate a value should be deleted
 * Use this to delete properties or remove array elements
 *
 * @example
 * ```ts
 * import { craft, nothing } from "@sylphx/craft";
 *
 * // Delete object property
 * craft(state, (draft) => {
 *   draft.obsoleteField = nothing;
 * });
 *
 * // Remove array element
 * craft(state, (draft) => {
 *   draft.items[2] = nothing;
 * });
 * ```
 */
export const nothing = Symbol.for("craft-nothing");

/**
 * Type helper for nothing
 */
export type Nothing = typeof nothing;

/**
 * Map and Set proxy handlers
 * Full Map/Set mutation tracking support
 */

import { createProxy } from "./proxy";
import { assertSafeProperty } from "./safe-path";
import {
  DRAFT_STATE,
  type DraftState,
  assertDraftActive,
  assertDraftDescriptor,
  finalize,
  getState,
  isDraftable,
  markChanged,
} from "./utils";

const DRAFT_MAP_STATE = Symbol("craft-draft-map-state");
const DRAFT_SET_STATE = Symbol("craft-draft-set-state");

interface MapState extends DraftState {
  base: Map<any, any>;
  copy: Map<any, any> | null;
  modified: boolean;
  parent: DraftState | null;
  revoked: boolean;
  finalized: boolean;
}

interface SetState extends DraftState {
  base: Set<any>;
  copy: Set<any> | null;
  modified: boolean;
  parent: DraftState | null;
  revoked: boolean;
  finalized: boolean;
}

export function createMapProxy(base: Map<any, any>, parent: DraftState | null): Map<any, any> {
  const state: MapState = {
    base,
    copy: null,
    modified: false,
    parent,
    revoked: false,
    finalized: false,
  };

  const proxy = new Proxy(new Map(), {
    get(_, prop) {
      if (prop === DRAFT_MAP_STATE) return state;
      if (prop === DRAFT_STATE) return state;
      assertDraftActive(state);
      assertSafeProperty(prop);

      const source = state.copy ?? state.base;
      const value = Reflect.get(source, prop, source);

      if (typeof value === "function") {
        // Intercept Map methods
        switch (prop) {
          case "set":
            return (key: any, val: any) => {
              assertDraftActive(state);
              assertSafeProperty(key);
              if (source.has(key) && Object.is(source.get(key), val)) return proxy;
              if (!state.modified) {
                prepareCopy(state);
              }
              state.copy!.set(key, val);
              return proxy;
            };
          case "delete":
            return (key: any) => {
              assertDraftActive(state);
              assertSafeProperty(key);
              if (!(state.copy ?? state.base).has(key)) return false;
              if (!state.modified) {
                prepareCopy(state);
              }
              return state.copy!.delete(key);
            };
          case "clear":
            return () => {
              assertDraftActive(state);
              if ((state.copy ?? state.base).size === 0) return;
              if (!state.modified) {
                prepareCopy(state);
              }
              return state.copy!.clear();
            };
          case "get":
            return (key: any) => {
              assertDraftActive(state);
              assertSafeProperty(key);
              const source = state.copy ?? state.base;
              return draftValue(state, source.get(key));
            };
          case "has":
            return (key: any) => {
              assertDraftActive(state);
              assertSafeProperty(key);
              const source = state.copy ?? state.base;
              return source.has(key);
            };
          case "forEach":
            return (callback: any, thisArg?: any) => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return source.forEach((value, key) => {
                callback.call(thisArg, draftValue(state, value), key, proxy);
              });
            };
          case "keys":
            return () => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return source.keys();
            };
          case "values":
            return () => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return draftValues(state, source.values());
            };
          case "entries":
            return () => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return draftEntries(state, source.entries());
            };
          case Symbol.iterator:
            return () => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return draftEntries(state, source.entries());
            };
          default:
            return value.bind(proxy);
        }
      }

      return draftPropertyValue(state, prop, value);
    },
    ...collectionPropertyTraps(state),
  });

  return proxy as Map<any, any>;
}

export function createSetProxy(base: Set<any>, parent: DraftState | null): Set<any> {
  const state: SetState = {
    base,
    copy: null,
    modified: false,
    parent,
    revoked: false,
    finalized: false,
  };

  const proxy = new Proxy(new Set(), {
    get(_, prop) {
      if (prop === DRAFT_SET_STATE) return state;
      if (prop === DRAFT_STATE) return state;
      assertDraftActive(state);
      assertSafeProperty(prop);

      const source = state.copy ?? state.base;
      const value = Reflect.get(source, prop, source);

      if (typeof value === "function") {
        // Intercept Set methods
        switch (prop) {
          case "add":
            return (val: any) => {
              assertDraftActive(state);
              const valueState = getState(val);
              const value = valueState?.base ?? val;
              const source = state.copy ?? state.base;
              // A member read from this same Set is already tracked. Readding
              // it must not break no-op identity or create a second member.
              if (source.has(value) && (!valueState || valueState.parent === state)) return proxy;
              prepareCopySet(state);
              state.copy!.add(value);
              // Membership uses base identity; the side table retains edits,
              // including values moved out of another property or collection.
              if (valueState) {
                if (!state.drafts) state.drafts = new Map();
                state.drafts.set(value, val);
              }
              return proxy;
            };
          case "delete":
            return (val: any) => {
              assertDraftActive(state);
              if (!(state.copy ?? state.base).has(getState(val)?.base ?? val)) return false;
              if (!state.modified) {
                prepareCopySet(state);
              }
              return state.copy!.delete(getState(val)?.base ?? val);
            };
          case "clear":
            return () => {
              assertDraftActive(state);
              if ((state.copy ?? state.base).size === 0) return;
              if (!state.modified) {
                prepareCopySet(state);
              }
              return state.copy!.clear();
            };
          case "has":
            return (val: any) => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return source.has(getState(val)?.base ?? val);
            };
          case "forEach":
            return (callback: any, thisArg?: any) => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return source.forEach((value) => {
                const draft = draftValue(state, value);
                callback.call(thisArg, draft, draft, proxy);
              });
            };
          case "keys":
            return () => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return draftValues(state, source.keys());
            };
          case "values":
            return () => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return draftValues(state, source.values());
            };
          case "entries":
            return () => draftSetEntries(state);
          case Symbol.iterator:
            return () => {
              assertDraftActive(state);
              const source = state.copy ?? state.base;
              return draftValues(state, source.values());
            };
          default:
            return value.bind(proxy);
        }
      }

      return draftPropertyValue(state, prop, value);
    },
    ...collectionPropertyTraps(state),
  });

  return proxy as Set<any>;
}

function prepareCopy(state: MapState) {
  markChanged(state);
}

function prepareCopySet(state: SetState) {
  markChanged(state);
}

export function finalizeMap(state: MapState): Map<any, any> {
  if (state.finalized) return state.copy ?? state.base;
  state.finalized = true;
  if (!state.modified) return state.base;
  const source = state.copy!;
  const result = new Map();
  state.copy = result;
  for (const [key, value] of source) result.set(key, finalizeValue(state, value));
  finalizeCollectionProperties(state, source, result);
  return result;
}

export function finalizeSet(state: SetState): Set<any> {
  if (state.finalized) return state.copy ?? state.base;
  state.finalized = true;
  if (!state.modified) return state.base;
  const source = state.copy!;
  const result = new Set();
  state.copy = result;
  for (const value of source) result.add(finalizeValue(state, value));
  finalizeCollectionProperties(state, source, result);
  return result;
}

function finalizeValue(state: DraftState, value: any): any {
  const draft = state.drafts?.get(value) ?? value;
  const child = getState(draft);
  return child ? finalize(child) : value;
}

function finalizeCollectionProperties(state: DraftState, source: any, result: any): void {
  for (const prop of Reflect.ownKeys(source)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(source, prop)!;
    if ("value" in descriptor) {
      const child = getState(state.propertyDrafts?.get(prop) ?? descriptor.value);
      if (child) descriptor.value = finalize(child);
    }
    // Construct values before installing the original flags. Never attempt to
    // overwrite a locked slot on a shallow copy or silently skip its edits.
    Object.defineProperty(result, prop, descriptor);
  }
}

function collectionPropertyTraps(state: DraftState): ProxyHandler<any> {
  return {
    set(target, prop, value) {
      assertDraftActive(state);
      assertSafeProperty(prop);
      const source = state.copy ?? state.base;
      if (Object.is(Reflect.get(source, prop), value)) return true;
      markChanged(state);
      const success = Reflect.set(state.copy!, prop, value);
      if (success) {
        state.propertyDrafts?.delete(prop);
        const fixed = Reflect.getOwnPropertyDescriptor(target, prop);
        if (fixed && !fixed.configurable) Reflect.set(target, prop, value);
      }
      return success;
    },
    deleteProperty(_, prop) {
      assertDraftActive(state);
      assertSafeProperty(prop);
      if (!Object.hasOwn(state.copy ?? state.base, prop)) return true;
      markChanged(state);
      const success = Reflect.deleteProperty(state.copy!, prop);
      if (success) state.propertyDrafts?.delete(prop);
      return success;
    },
    defineProperty(target, prop, descriptor) {
      assertDraftActive(state);
      assertSafeProperty(prop);
      assertDraftDescriptor(state, prop, descriptor);
      markChanged(state);
      // Explicit non-configurable descriptors must exist on the target too.
      // Configurable descriptors may stay virtual, like base descriptors.
      if (!Reflect.defineProperty(state.copy!, prop, descriptor)) return false;
      state.propertyDrafts?.delete(prop);
      const actual = Reflect.getOwnPropertyDescriptor(state.copy!, prop)!;
      if (!actual.configurable) return Reflect.defineProperty(target, prop, actual);
      return true;
    },
    getOwnPropertyDescriptor(target, prop) {
      assertDraftActive(state);
      assertSafeProperty(prop);
      const descriptor = Reflect.getOwnPropertyDescriptor(state.copy ?? state.base, prop);
      if (!descriptor) return undefined;
      if ("value" in descriptor)
        descriptor.value = draftPropertyValue(state, prop, descriptor.value);
      const fixed = Reflect.getOwnPropertyDescriptor(target, prop);
      if (fixed && !fixed.configurable) return descriptor;
      return { ...descriptor, configurable: true };
    },
    ownKeys() {
      assertDraftActive(state);
      return Reflect.ownKeys(state.copy ?? state.base);
    },
    setPrototypeOf() {
      throw new TypeError("Cannot change a draft prototype");
    },
    has(_, prop) {
      assertDraftActive(state);
      assertSafeProperty(prop);
      return prop in (state.copy ?? state.base);
    },
  };
}

export function isMap(value: any): value is Map<any, any> {
  return value instanceof Map;
}

export function isSet(value: any): value is Set<any> {
  return value instanceof Set;
}

export function getMapState(map: any): MapState | undefined {
  return map?.[DRAFT_MAP_STATE];
}

export function getSetState(set: any): SetState | undefined {
  return set?.[DRAFT_SET_STATE];
}

export { DRAFT_MAP_STATE, DRAFT_SET_STATE };
export type { MapState, SetState };

// Collection values use the same guarded drafts as object properties.
function draftValue(state: DraftState, value: any): any {
  assertDraftActive(state);
  if (!isDraftable(value)) return value;
  if (getState(value)) return value;
  if (!state.drafts) state.drafts = new Map();
  const drafts = state.drafts;
  if (!drafts.has(value)) drafts.set(value, createProxy(value, state));
  return drafts.get(value);
}

function draftPropertyValue(state: DraftState, prop: string | symbol, value: any): any {
  if (!isDraftable(value)) return value;
  if (getState(value)) return value;
  if (!state.propertyDrafts) state.propertyDrafts = new Map();
  const cached = state.propertyDrafts.get(prop);
  if (cached && getState(cached)?.base === value) return cached;
  const draft = createProxy(value, state);
  state.propertyDrafts.set(prop, draft);
  return draft;
}

function* draftValues(state: DraftState, values: Iterable<any>) {
  for (const value of values) yield draftValue(state, value);
}

function* draftEntries(state: DraftState, entries: Iterable<[any, any]>) {
  for (const [key, value] of entries) yield [key, draftValue(state, value)];
}

function* draftSetEntries(state: SetState) {
  for (const value of draftValues(state, (state.copy ?? state.base).values())) yield [value, value];
}

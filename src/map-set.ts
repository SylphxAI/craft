/**
 * Map and Set proxy handlers
 * Full Map/Set mutation tracking support
 */

import { createProxy } from "./proxy";
import { assertSafeProperty } from "./safe-path";
import {
  DRAFT_STATE,
  type DraftState,
  finalize,
  getState,
  isDraftable,
  markChanged,
  shallowCopy,
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
      assertSafeProperty(prop);

      const source = state.copy ?? state.base;
      const value = Reflect.get(source, prop, source);

      if (typeof value === "function") {
        // Intercept Map methods
        switch (prop) {
          case "set":
            return (key: any, val: any) => {
              assertSafeProperty(key);
              if (!state.modified) {
                prepareCopy(state);
              }
              state.copy!.set(key, val);
              return proxy;
            };
          case "delete":
            return (key: any) => {
              assertSafeProperty(key);
              if (!state.modified) {
                prepareCopy(state);
              }
              return state.copy!.delete(key);
            };
          case "clear":
            return () => {
              if (!state.modified) {
                prepareCopy(state);
              }
              return state.copy!.clear();
            };
          case "get":
            return (key: any) => {
              assertSafeProperty(key);
              const source = state.copy ?? state.base;
              return draftValue(state, source.get(key));
            };
          case "has":
            return (key: any) => {
              assertSafeProperty(key);
              const source = state.copy ?? state.base;
              return source.has(key);
            };
          case "forEach":
            return (callback: any, thisArg?: any) => {
              const source = state.copy ?? state.base;
              return source.forEach((value, key) => {
                callback.call(thisArg, draftValue(state, value), key, proxy);
              });
            };
          case "keys":
            return () => {
              const source = state.copy ?? state.base;
              return source.keys();
            };
          case "values":
            return () => {
              const source = state.copy ?? state.base;
              return draftValues(state, source.values());
            };
          case "entries":
            return () => {
              const source = state.copy ?? state.base;
              return draftEntries(state, source.entries());
            };
          case Symbol.iterator:
            return () => {
              const source = state.copy ?? state.base;
              return draftEntries(state, source.entries());
            };
          default:
            return value.bind(proxy);
        }
      }

      return draftValue(state, value);
    },
    set(_, prop, value) {
      assertSafeProperty(prop);
      markChanged(state);
      return Reflect.set(state.copy!, prop, value);
    },
    deleteProperty(_, prop) {
      assertSafeProperty(prop);
      markChanged(state);
      return Reflect.deleteProperty(state.copy!, prop);
    },
    defineProperty(target, prop, descriptor) {
      assertSafeProperty(prop);
      markChanged(state);
      return (
        Reflect.defineProperty(state.copy!, prop, descriptor) &&
        Reflect.defineProperty(target, prop, descriptor)
      );
    },
    getOwnPropertyDescriptor(target, prop) {
      assertSafeProperty(prop);
      const fixed = Reflect.getOwnPropertyDescriptor(target, prop);
      if (fixed && !fixed.configurable) return fixed;
      const desc = Reflect.getOwnPropertyDescriptor(state.copy ?? state.base, prop);
      return desc ? { ...desc, configurable: true } : undefined;
    },
    ownKeys() {
      return Reflect.ownKeys(state.copy ?? state.base);
    },
    setPrototypeOf() {
      throw new TypeError("Cannot change a draft prototype");
    },
    has(_, prop) {
      assertSafeProperty(prop);
      return prop in (state.copy ?? state.base);
    },
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
      assertSafeProperty(prop);

      const source = state.copy ?? state.base;
      const value = Reflect.get(source, prop, source);

      if (typeof value === "function") {
        // Intercept Set methods
        switch (prop) {
          case "add":
            return (val: any) => {
              if (!state.modified) {
                prepareCopySet(state);
              }
              state.copy!.add(getState(val)?.base ?? val);
              return proxy;
            };
          case "delete":
            return (val: any) => {
              if (!state.modified) {
                prepareCopySet(state);
              }
              return state.copy!.delete(getState(val)?.base ?? val);
            };
          case "clear":
            return () => {
              if (!state.modified) {
                prepareCopySet(state);
              }
              return state.copy!.clear();
            };
          case "has":
            return (val: any) => {
              const source = state.copy ?? state.base;
              return source.has(getState(val)?.base ?? val);
            };
          case "forEach":
            return (callback: any, thisArg?: any) => {
              const source = state.copy ?? state.base;
              return source.forEach((value) => {
                const draft = draftValue(state, value);
                callback.call(thisArg, draft, draft, proxy);
              });
            };
          case "keys":
            return () => {
              const source = state.copy ?? state.base;
              return draftValues(state, source.keys());
            };
          case "values":
            return () => {
              const source = state.copy ?? state.base;
              return draftValues(state, source.values());
            };
          case "entries":
            return () => draftSetEntries(state);
          case Symbol.iterator:
            return () => {
              const source = state.copy ?? state.base;
              return draftValues(state, source.values());
            };
          default:
            return value.bind(proxy);
        }
      }

      return draftValue(state, value);
    },
    set(_, prop, value) {
      assertSafeProperty(prop);
      markChanged(state);
      return Reflect.set(state.copy!, prop, value);
    },
    deleteProperty(_, prop) {
      assertSafeProperty(prop);
      markChanged(state);
      return Reflect.deleteProperty(state.copy!, prop);
    },
    defineProperty(target, prop, descriptor) {
      assertSafeProperty(prop);
      markChanged(state);
      return (
        Reflect.defineProperty(state.copy!, prop, descriptor) &&
        Reflect.defineProperty(target, prop, descriptor)
      );
    },
    getOwnPropertyDescriptor(target, prop) {
      assertSafeProperty(prop);
      const fixed = Reflect.getOwnPropertyDescriptor(target, prop);
      if (fixed && !fixed.configurable) return fixed;
      const desc = Reflect.getOwnPropertyDescriptor(state.copy ?? state.base, prop);
      return desc ? { ...desc, configurable: true } : undefined;
    },
    ownKeys() {
      return Reflect.ownKeys(state.copy ?? state.base);
    },
    setPrototypeOf() {
      throw new TypeError("Cannot change a draft prototype");
    },
    has(_, prop) {
      assertSafeProperty(prop);
      return prop in (state.copy ?? state.base);
    },
  });

  return proxy as Set<any>;
}

function prepareCopy(state: MapState) {
  if (!state.copy) {
    state.modified = true;
    state.copy = shallowCopy(state.base);
    if (state.parent) {
      markChanged(state.parent);
    }
  }
}

function prepareCopySet(state: SetState) {
  if (!state.copy) {
    state.modified = true;
    state.copy = shallowCopy(state.base);
    if (state.parent) {
      markChanged(state.parent);
    }
  }
}

export function finalizeMap(state: MapState): Map<any, any> {
  if (state.finalized) {
    return state.copy ?? state.base;
  }
  state.finalized = true;
  if (state.copy) {
    for (const [key, value] of state.copy) {
      const draft = state.drafts?.get(value) ?? value;
      const child = getState(draft);
      if (child) state.copy.set(key, finalize(child));
    }
  }
  return state.copy ?? state.base;
}

export function finalizeSet(state: SetState): Set<any> {
  if (state.finalized) return state.copy ?? state.base;
  state.finalized = true;
  if (state.copy) {
    const values = [...state.copy];
    state.copy.clear();
    for (const value of values) {
      const draft = state.drafts?.get(value) ?? value;
      const child = getState(draft);
      state.copy.add(child ? finalize(child) : value);
    }
  }
  return state.copy ?? state.base;
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
  if (!isDraftable(value)) return value;
  if (getState(value)) return value;
  if (!state.drafts) state.drafts = new Map();
  const drafts = state.drafts;
  if (!drafts.has(value)) drafts.set(value, createProxy(value, state));
  return drafts.get(value);
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

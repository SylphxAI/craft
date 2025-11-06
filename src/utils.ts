/**
 * Utility functions for Craft
 */

const DRAFT_STATE = Symbol("craft-draft-state");
const PROXY_TARGET = Symbol("craft-proxy-target");

export interface DraftState {
  base: any;
  copy: any | null;
  modified: boolean;
  parent: DraftState | null;
  revoked: boolean;
}

export function isDraft(value: any): boolean {
  return value?.[DRAFT_STATE] !== undefined;
}

export function isDraftable(value: any): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function getState(draft: any): DraftState | undefined {
  return draft[DRAFT_STATE];
}

export function latest(state: DraftState): any {
  return state.copy ?? state.base;
}

export function shallowCopy<T>(base: T): T {
  if (Array.isArray(base)) {
    return base.slice() as any;
  }
  if (base && typeof base === "object") {
    return Object.assign({}, base);
  }
  return base;
}

export function markChanged(state: DraftState): void {
  if (!state.modified) {
    state.modified = true;
    if (!state.copy) {
      state.copy = shallowCopy(state.base);
    }
    if (state.parent) {
      markChanged(state.parent);
    }
  }
}

export function freeze<T>(obj: T, deep = false): T {
  if (!obj || typeof obj !== "object") return obj;
  if (Object.isFrozen(obj)) return obj;

  Object.freeze(obj);

  if (deep) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        freeze(obj[key], true);
      }
    }
  }

  return obj;
}

export function finalize(state: DraftState, autoFreeze = true): any {
  if (!state.modified) {
    return state.base;
  }

  const result = state.copy!;

  // Finalize all properties recursively
  each(result, (key, value) => {
    if (isDraft(value)) {
      const childState = getState(value);
      if (childState) {
        result[key] = finalize(childState, autoFreeze);
      }
    } else if (isDraftable(value)) {
      // Even if it's not a draft, we need to check if there's a modified child
      // This shouldn't happen with our implementation, but let's be safe
      result[key] = value;
    }
  });

  if (autoFreeze) {
    freeze(result, false);
  }

  return result;
}

function each(obj: any, callback: (key: string | number, value: any) => void): void {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      callback(i, obj[i]);
    }
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        callback(key, obj[key]);
      }
    }
  }
}

export { DRAFT_STATE, PROXY_TARGET };

import { describe, expect, it } from "vitest";
import { craft } from "../src/index";
import { type Patch, applyPatches } from "../src/patches";
import { peek } from "../src/utils";

const reserved = ["__proto__", "prototype", "constructor"];

describe("patch path validation", () => {
  for (const key of reserved) {
    for (const op of ["add", "remove", "replace"] as const) {
      for (const path of [
        [key],
        [key, "polluted"],
        ["nested", key],
        ["constructor", "prototype", "polluted"],
      ]) {
        it(`rejects ${op} ${path.join("/")} before touching state`, () => {
          const base = { nested: {}, stable: 1 };
          const before = Object.getOwnPropertyDescriptors(Object.prototype);
          expect(() => applyPatches(base, [{ op, path, value: true }])).toThrow(/reserved/);
          expect(base).toEqual({ nested: {}, stable: 1 });
          expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(before);
        });
      }
    }
    it(`rejects reserved Map and array paths: ${key}`, () => {
      for (const base of [new Map(), []]) {
        expect(() => applyPatches(base, [{ op: "add", path: [key], value: true }])).toThrow(
          /reserved/,
        );
      }
    });
  }

  it("preflights every patch before reading or applying any patch", () => {
    let reads = 0;
    const base = {
      get nested() {
        reads++;
        return {};
      },
    };
    expect(() =>
      applyPatches(base, [
        { op: "add", path: ["nested", "valid"], value: true },
        { op: "add", path: ["__proto__", "polluted"], value: true },
      ]),
    ).toThrow(/reserved/);
    expect(reads).toBe(0);
  });

  it("rejects malformed paths without coercing segments", () => {
    const segment = {
      toString() {
        throw new Error("must not coerce");
      },
    };
    for (const path of [null, "__proto__", [segment], [Symbol("key")], [null], Array(1)]) {
      expect(() => applyPatches({}, [{ op: "add", path, value: true }] as Patch[])).toThrow(
        /Invalid patch path/,
      );
    }
  });

  it("preserves valid objects, arrays, Maps, Sets and root replacement", () => {
    const base = {
      nested: { value: 1 },
      list: [1, 2],
      map: new Map([["key", 1]]),
      set: new Set([1]),
    };
    const next = applyPatches(base, [
      { op: "replace", path: ["nested", "value"], value: 2 },
      { op: "add", path: ["list", 1], value: 3 },
      { op: "replace", path: ["map", "key"], value: 2 },
      { op: "add", path: ["set", 1], value: 2 },
    ]);
    expect(next).toEqual({
      nested: { value: 2 },
      list: [1, 3],
      map: new Map([["key", 2]]),
      set: new Set([1, 2]),
    });
    expect(base.list).toEqual([1, 2]);
    expect(base.map.get("key")).toBe(1);
    expect(applyPatches(base, [{ op: "replace", path: [], value: { fresh: true } }])).toEqual({
      fresh: true,
    });
  });
});

describe("draft property validation", () => {
  for (const key of reserved) {
    for (const base of [{ nested: {} }, [], new Map(), new Set()]) {
      it(`blocks reserved writes and deletes for ${key} on ${Object.prototype.toString.call(base)}`, () => {
        const before = Object.getOwnPropertyDescriptors(Object.prototype);
        const functions = Object.getOwnPropertyDescriptors(Function.prototype);
        for (const operation of [
          (draft: any) => {
            draft[key] = {};
          },
          (draft: any) => {
            delete draft[key];
          },
          (draft: any) => {
            Object.defineProperty(draft, key, { value: {} });
          },
        ]) {
          expect(() => craft(base, operation)).toThrow(/reserved/);
        }
        expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(before);
        expect(Object.getOwnPropertyDescriptors(Function.prototype)).toEqual(functions);
      });
      it(`does not expose reserved lookups for ${key} on ${Object.prototype.toString.call(base)}`, () => {
        if (Array.isArray(base) && key === "constructor") {
          craft(base, (draft: any) => {
            expect(draft[key]).toBeUndefined();
          });
        } else {
          expect(() =>
            craft(base, (draft: any) => {
              void draft[key];
            }),
          ).toThrow(/reserved/);
        }
      });
    }
    it(`blocks reserved nested and Map paths for ${key}`, () => {
      expect(() =>
        craft({ nested: {} }, (draft: any) => {
          draft.nested[key] = {};
        }),
      ).toThrow(/reserved/);
      for (const operation of ["get", "set", "delete", "has"] as const) {
        expect(() =>
          craft(new Map(), (draft: any) => {
            draft[operation](key, {});
          }),
        ).toThrow(/reserved/);
      }
    });
  }

  it("preserves array species operations, symbols and collection methods", () => {
    const symbol = Symbol("key");
    const base = { list: [1, 2, 3], [symbol]: 1, map: new Map([["key", 1]]), set: new Set([1]) };
    const next = craft(base, (draft) => {
      expect(draft.list.slice(1)).toEqual([2, 3]);
      expect(draft.list.map((value) => value * 2)).toEqual([2, 4, 6]);
      expect(draft.list.filter((value) => value > 1)).toEqual([2, 3]);
      expect(draft.list.splice(1, 1)).toEqual([2]);
      draft[symbol] = 2;
      draft.map.set("key", 2);
      draft.set.add(2);
    });
    expect(next.list).toEqual([1, 3]);
    expect(next[symbol]).toBe(2);
    expect(next.map.get("key")).toBe(2);
    expect([...next.set]).toEqual([1, 2]);
    expect(base.list).toEqual([1, 2, 3]);
    expect(base.map.get("key")).toBe(1);
    expect([...base.set]).toEqual([1]);
  });
});

describe("guarded property helpers and collection chains", () => {
  for (const key of reserved) {
    it(`rejects helper and chained access for ${key}`, () => {
      let reads = 0;
      const target = new Proxy(
        {},
        {
          get() {
            reads++;
            return undefined;
          },
        },
      );
      expect(() => peek(target, key)).toThrow(/reserved/);
      expect(reads).toBe(0);
      expect(() =>
        craft(new Map(), (draft: any) => {
          draft.set("safe", 1).set(key, {});
        }),
      ).toThrow(/reserved/);
      expect(() =>
        craft(new Set(), (draft: any) => {
          void draft.add(1)[key];
        }),
      ).toThrow(/reserved/);
    });
  }
  it("preserves fluent collection updates and safe helper reads", () => {
    expect(peek({ value: 1 }, "value")).toBe(1);
    expect([
      ...craft(new Map(), (draft) => {
        draft.set("a", 1).set("b", 2);
      }),
    ]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
    expect([
      ...craft(new Set(), (draft) => {
        draft.add(1).add(2);
      }),
    ]).toEqual([1, 2]);
  });
});

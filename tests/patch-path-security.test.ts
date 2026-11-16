import { describe, expect, it } from "vitest";
import { applyPatches, type Patch } from "../src/patches";

const reserved = ["__proto__", "prototype", "constructor"];

describe("patch path validation", () => {
  for (const key of reserved) {
    for (const op of ["add", "remove", "replace"] as const) {
      for (const path of [[key], [key, "polluted"], ["nested", key], ["constructor", "prototype", "polluted"]]) {
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
        expect(() => applyPatches(base, [{ op: "add", path: [key], value: true }])).toThrow(/reserved/);
      }
    });
  }

  it("preflights every patch before reading or applying any patch", () => {
    let reads = 0;
    const base = { get nested() { reads++; return {}; } };
    expect(() => applyPatches(base, [
      { op: "add", path: ["nested", "valid"], value: true },
      { op: "add", path: ["__proto__", "polluted"], value: true },
    ])).toThrow(/reserved/);
    expect(reads).toBe(0);
  });

  it("rejects malformed paths without coercing segments", () => {
    const segment = { toString() { throw new Error("must not coerce"); } };
    for (const path of [null, "__proto__", [segment], [Symbol("key")], [null], Array(1)]) {
      expect(() => applyPatches({}, [{ op: "add", path, value: true }] as Patch[])).toThrow(/Invalid patch path/);
    }
  });

  it("preserves valid objects, arrays, Maps, Sets and root replacement", () => {
    const base = { nested: { value: 1 }, list: [1, 2], map: new Map([["key", 1]]), set: new Set([1]) };
    const next = applyPatches(base, [
      { op: "replace", path: ["nested", "value"], value: 2 },
      { op: "add", path: ["list", 1], value: 3 },
      { op: "replace", path: ["map", "key"], value: 2 },
      { op: "add", path: ["set", 1], value: 2 },
    ]);
    expect(next).toEqual({ nested: { value: 2 }, list: [1, 3], map: new Map([["key", 2]]), set: new Set([1, 2]) });
    expect(base.list).toEqual([1, 2]);
    expect(base.map.get("key")).toBe(1);
    expect(applyPatches(base, [{ op: "replace", path: [], value: { fresh: true } }])).toEqual({ fresh: true });
  });
});

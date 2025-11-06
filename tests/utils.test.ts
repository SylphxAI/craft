import { describe, expect, it } from "vitest";
import { freeze } from "../src/utils";

describe("freeze", () => {
  it("should freeze an object", () => {
    const obj = { a: 1, b: 2 };
    const frozen = freeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(frozen).toBe(obj);
  });

  it("should deeply freeze an object", () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    };

    const frozen = freeze(obj, true);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.b)).toBe(true);
    expect(Object.isFrozen(frozen.b.d)).toBe(true);
  });

  it("should not freeze primitives", () => {
    expect(freeze(42)).toBe(42);
    expect(freeze("hello")).toBe("hello");
    expect(freeze(true)).toBe(true);
    expect(freeze(null)).toBe(null);
    expect(freeze(undefined)).toBe(undefined);
  });

  it("should return already frozen objects", () => {
    const obj = Object.freeze({ a: 1 });
    const frozen = freeze(obj);

    expect(frozen).toBe(obj);
  });
});

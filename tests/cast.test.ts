import { describe, expect, it } from "vitest";
import { castDraft, castImmutable } from "../src/cast";

describe("Type casting utilities", () => {
  it("castDraft should preserve value", () => {
    const immutable = { count: 0, name: "test" };
    const draft = castDraft(immutable);

    expect(draft).toBe(immutable);
    expect(draft.count).toBe(0);
    expect(draft.name).toBe("test");
  });

  it("castImmutable should preserve value", () => {
    const mutable = { count: 0, name: "test" };
    const immutable = castImmutable(mutable);

    expect(immutable).toBe(mutable);
    expect(immutable.count).toBe(0);
    expect(immutable.name).toBe("test");
  });

  it("castDraft should work with arrays", () => {
    const arr = [1, 2, 3];
    const draft = castDraft(arr);

    expect(draft).toBe(arr);
    expect(draft.length).toBe(3);
  });

  it("castImmutable should work with arrays", () => {
    const arr = [1, 2, 3];
    const immutable = castImmutable(arr);

    expect(immutable).toBe(arr);
    expect(immutable.length).toBe(3);
  });
});

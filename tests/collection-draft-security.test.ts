import { describe, expect, it } from "vitest";
import { craft, createDraft, current, finishDraft, isDraft, original } from "../src";

const reserved = ["__proto__", "prototype", "constructor"];

describe("collection draft lifecycle", () => {
  for (const make of [() => new Map([["a", { count: 1 }]]), () => new Set([{ count: 1 }])]) {
    it("finalizes root and manual drafts without mutating their bases", () => {
      const base = make();
      const draft = createDraft(base);
      expect(isDraft(draft)).toBe(true);
      expect(original(draft)).toBe(base);
      const value = [...draft.values()][0]!;
      value.count = 2;
      const snapshot = current(draft);
      expect([...snapshot.values()][0]!.count).toBe(2);
      value.count = 3;
      expect([...snapshot.values()][0]!.count).toBe(2);
      const result = finishDraft(draft);
      expect([...result.values()][0]!.count).toBe(3);
      expect([...base.values()][0]!.count).toBe(1);
      expect(craft(base, () => {})).toBe(base);
    });
  }

  it("finalizes nested collections and preserves fluent returns", () => {
    const base = { map: new Map([["items", new Set([{ count: 1 }])]]) };
    const result = craft(base, (draft) => {
      for (const value of draft.map.get("items")!) value.count = 2;
      draft.map.set("more", new Set()).get("more")!.add({ count: 3 });
    });
    expect([...result.map.get("items")!][0]!.count).toBe(2);
    expect([...result.map.get("more")!][0]!.count).toBe(3);
    expect([...base.map.get("items")!][0]!.count).toBe(1);
    expect(base.map.has("more")).toBe(false);
  });

  for (const key of reserved) {
    for (const read of [
      (draft: Map<string, object>) => draft.get("value"),
      (draft: Map<string, object>) => [...draft.values()][0],
      (draft: Map<string, object>) => [...draft.entries()][0]![1],
      (draft: Map<string, object>) => [...draft][0]![1],
    ]) {
      it(`guards nested Map values for ${key}`, () => {
        const base = new Map([["value", {}]]);
        expect(() =>
          craft(base, (draft) => {
            void (read(draft) as any)[key];
          }),
        ).toThrow(/reserved/);
        expect([...base.values()]).toEqual([{}]);
      });
    }
    it(`guards collection callbacks, reflection and Set values for ${key}`, () => {
      expect(() =>
        craft(new Map([["value", {}]]), (draft) => {
          draft.forEach((value, _key, receiver) => {
            expect(receiver).toBe(draft);
            void (value as any)[key];
          });
        }),
      ).toThrow(/reserved/);
      expect(() =>
        craft(new Set([{}]), (draft) => {
          for (const value of draft) void (value as any)[key];
        }),
      ).toThrow(/reserved/);
      for (const base of [{}, [], new Map(), new Set()]) {
        expect(() =>
          craft(base, (draft) => {
            void (key in draft);
          }),
        ).toThrow(/reserved/);
        expect(() =>
          craft(base, (draft) => {
            Object.getOwnPropertyDescriptor(draft, key);
          }),
        ).toThrow(/reserved/);
      }
    });
  }

  it("preserves Map key identity and Set membership for drafted values", () => {
    const key = {};
    const map = new Map([[key, { count: 1 }]]);
    craft(map, (draft) => {
      const [draftKey] = draft.keys();
      expect(draftKey).toBe(key);
      expect(draft.get(draftKey!)).toEqual({ count: 1 });
      draft.forEach((_value, callbackKey) => expect(callbackKey).toBe(key));
    });
    const set = new Set([{ count: 1 }]);
    const result = craft(set, (draft) => {
      const [value] = draft;
      expect(draft.has(value!)).toBe(true);
      draft.add(value!);
      expect(draft.size).toBe(1);
      expect(draft.delete(value!)).toBe(true);
    });
    expect(result.size).toBe(0);
    expect(set.size).toBe(1);
  });

  it("copies direct collection properties and defined properties", () => {
    for (const base of [{}, [], new Map(), new Set()]) {
      const result = craft(base, (draft: any) => {
        draft.note = 1;
        Object.defineProperty(draft, "extra", { value: 2, configurable: true, enumerable: true });
      });
      expect((result as any).note).toBe(1);
      expect((result as any).extra).toBe(2);
      expect(Object.hasOwn(base, "note")).toBe(false);
      expect(Object.hasOwn(base, "extra")).toBe(false);
      expect(() =>
        craft(base, (draft) => {
          Object.setPrototypeOf(draft, {});
        }),
      ).toThrow(/prototype/);
    }
  });
});

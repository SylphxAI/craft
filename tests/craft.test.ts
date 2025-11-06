import { describe, expect, it } from "vitest";
import { craft, crafted } from "../src/craft";

describe("craft", () => {
  it("should handle simple object updates", () => {
    const base = { count: 0, name: "Alice" };
    const next = craft(base, (draft) => {
      draft.count = 1;
      draft.name = "Bob";
    });

    expect(next).toEqual({ count: 1, name: "Bob" });
    expect(base).toEqual({ count: 0, name: "Alice" });
    expect(next).not.toBe(base);
  });

  it("should return the same object if no changes", () => {
    const base = { count: 0 };
    const next = craft(base, () => {});

    expect(next).toBe(base);
  });

  it("should handle nested object updates", () => {
    const base = {
      user: {
        name: "Alice",
        profile: {
          age: 25,
        },
      },
    };

    const next = craft(base, (draft) => {
      draft.user.profile.age = 26;
    });

    expect(next.user.profile.age).toBe(26);
    expect(base.user.profile.age).toBe(25);
    expect(next.user).not.toBe(base.user);
    expect(next.user.profile).not.toBe(base.user.profile);
  });

  it("should handle array updates", () => {
    const base = { items: [1, 2, 3] };
    const next = craft(base, (draft) => {
      draft.items.push(4);
    });

    expect(next.items).toEqual([1, 2, 3, 4]);
    expect(base.items).toEqual([1, 2, 3]);
    expect(next.items).not.toBe(base.items);
  });

  it("should handle array element updates", () => {
    const base = { items: [{ id: 1 }, { id: 2 }] };
    const next = craft(base, (draft) => {
      draft.items[0]!.id = 10;
    });

    expect(next.items[0]!.id).toBe(10);
    expect(base.items[0]!.id).toBe(1);
  });

  it("should handle property deletion", () => {
    const base = { a: 1, b: 2, c: 3 };
    const next = craft(base, (draft) => {
      // biome-ignore lint/performance/noDelete: Testing delete functionality
      delete (draft as { a: number; b?: number; c: number }).b;
    });

    expect(next).toEqual({ a: 1, c: 3 });
    expect(base).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("should handle direct return from producer", () => {
    const base = { count: 0 };
    const next = craft(base, () => ({ count: 10 }));

    expect(next).toEqual({ count: 10 });
    expect(base).toEqual({ count: 0 });
  });

  it("should freeze the result", () => {
    const base = { count: 0 };
    const next = craft(base, (draft) => {
      draft.count = 1;
    });

    expect(Object.isFrozen(next)).toBe(true);
  });

  it("should handle complex nested updates", () => {
    const base = {
      todos: [
        { id: 1, text: "Learn Craft", done: false },
        { id: 2, text: "Use Craft", done: false },
      ],
      filter: "all",
    };

    const next = craft(base, (draft) => {
      draft.todos[0]!.done = true;
      draft.filter = "active";
    });

    expect(next.todos[0]!.done).toBe(true);
    expect(next.filter).toBe("active");
    expect(base.todos[0]!.done).toBe(false);
    expect(base.filter).toBe("all");
  });

  it("should preserve structural sharing for unchanged parts", () => {
    const base = {
      a: { value: 1 },
      b: { value: 2 },
      c: { value: 3 },
    };

    const next = craft(base, (draft) => {
      draft.a.value = 10;
    });

    // Changed part should be different
    expect(next.a).not.toBe(base.a);

    // Unchanged parts should be the same (structural sharing)
    expect(next.b).toBe(base.b);
    expect(next.c).toBe(base.c);
  });
});

describe("crafted", () => {
  it("should create a curried updater function", () => {
    type CountState = { count: number };
    const increment = crafted<CountState>((draft) => {
      draft.count++;
    });

    const state1: CountState = { count: 0 };
    const state2 = increment(state1);
    const state3 = increment(state2);

    expect(state1.count).toBe(0);
    expect(state2.count).toBe(1);
    expect(state3.count).toBe(2);
  });

  it("should be reusable across different base states", () => {
    type NameState = { name: string };
    const setName = crafted<NameState>((draft) => {
      draft.name = "Bob";
    });

    const state1: NameState = { name: "Alice" };
    const state2: NameState = { name: "Charlie" };

    expect(setName(state1)).toEqual({ name: "Bob" });
    expect(setName(state2)).toEqual({ name: "Bob" });
  });
});

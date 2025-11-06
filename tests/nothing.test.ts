import { describe, expect, it } from "vitest";
import { craft } from "../src/craft";
import { nothing } from "../src/nothing";

describe("nothing", () => {
  it("should delete object properties", () => {
    const base = { a: 1, b: 2, c: 3 };

    const next = craft(base, (draft) => {
      draft.b = nothing as any;
    });

    expect(next).toEqual({ a: 1, c: 3 });
    expect(base).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("should remove array elements", () => {
    const base = { items: [1, 2, 3, 4, 5] };

    const next = craft(base, (draft) => {
      draft.items[1] = nothing as any;
      draft.items[3] = nothing as any;
    });

    expect(next.items).toEqual([1, 3, 5]);
    expect(base.items).toEqual([1, 2, 3, 4, 5]);
  });

  it("should work with nested objects", () => {
    const base = {
      user: {
        name: "Alice",
        age: 25,
        email: "alice@example.com",
      },
    };

    const next = craft(base, (draft) => {
      draft.user.email = nothing as any;
    });

    expect(next.user).toEqual({ name: "Alice", age: 25 });
    expect(base.user).toEqual({ name: "Alice", age: 25, email: "alice@example.com" });
  });

  it("should handle multiple deletions in arrays", () => {
    const base = { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };

    const next = craft(base, (draft) => {
      // Remove even numbers
      for (let i = 0; i < draft.items.length; i++) {
        if (draft.items[i]! % 2 === 0) {
          draft.items[i] = nothing as any;
        }
      }
    });

    expect(next.items).toEqual([1, 3, 5, 7, 9]);
  });

  it("should handle nothing with array push", () => {
    const base = { items: [1, 2, 3] };

    const next = craft(base, (draft) => {
      draft.items[1] = nothing as any;
      draft.items.push(4);
    });

    expect(next.items).toEqual([1, 3, 4]);
  });

  it("should not affect original when deleting non-existent property", () => {
    const base = { a: 1 };

    const next = craft(base, (draft) => {
      (draft as any).nonExistent = nothing;
    });

    expect(next).toBe(base); // No change
  });

  it("should work in combination with other mutations", () => {
    const base = {
      todos: [
        { id: 1, text: "Task 1", done: false },
        { id: 2, text: "Task 2", done: true },
        { id: 3, text: "Task 3", done: false },
      ],
    };

    const next = craft(base, (draft) => {
      // Remove completed todos
      for (let i = 0; i < draft.todos.length; i++) {
        if (draft.todos[i]!.done) {
          draft.todos[i] = nothing as any;
        }
      }

      // Add new todo
      draft.todos.push({ id: 4, text: "Task 4", done: false });
    });

    expect(next.todos).toHaveLength(3);
    expect(next.todos.find((t) => t.id === 2)).toBeUndefined();
    expect(next.todos.find((t) => t.id === 4)).toBeDefined();
  });

  it("should preserve array indices after deletion", () => {
    const base = { items: ["a", "b", "c", "d", "e"] };

    const next = craft(base, (draft) => {
      draft.items[0] = nothing as any;
      draft.items[2] = nothing as any;
      draft.items[4] = nothing as any;
    });

    expect(next.items).toEqual(["b", "d"]);
  });
});

describe("nothing with nested structures", () => {
  it("should delete in deeply nested structures", () => {
    const base = {
      level1: {
        level2: {
          level3: {
            keep: "this",
            remove: "this",
          },
        },
      },
    };

    const next = craft(base, (draft) => {
      draft.level1.level2.level3.remove = nothing as any;
    });

    expect(next.level1.level2.level3).toEqual({ keep: "this" });
  });

  it("should remove array elements in nested structures", () => {
    const base = {
      data: {
        items: [
          { id: 1, value: "a" },
          { id: 2, value: "b" },
          { id: 3, value: "c" },
        ],
      },
    };

    const next = craft(base, (draft) => {
      draft.data.items[1] = nothing as any;
    });

    expect(next.data.items).toEqual([
      { id: 1, value: "a" },
      { id: 3, value: "c" },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { compose, composer, pipe } from "../src/compose";
import { craft } from "../src/craft";
import type { Producer } from "../src/types";

interface State {
  count: number;
  name: string;
  active: boolean;
}

describe("compose", () => {
  it("should compose multiple producers", () => {
    const increment: Producer<State> = (draft) => {
      draft.count++;
    };
    const setName: Producer<State> = (draft) => {
      draft.name = "Bob";
    };
    const activate: Producer<State> = (draft) => {
      draft.active = true;
    };

    const base: State = { count: 0, name: "Alice", active: false };
    const next = craft(base, compose(increment, setName, activate));

    expect(next).toEqual({ count: 1, name: "Bob", active: true });
  });

  it("should stop on direct return", () => {
    const producer1: Producer<State> = (draft) => {
      draft.count++;
    };
    const producer2: Producer<State> = () => ({ count: 100, name: "Override", active: true });
    const producer3: Producer<State> = (draft) => {
      draft.active = false;
    };

    const base: State = { count: 0, name: "Alice", active: false };
    const next = craft(base, compose(producer1, producer2, producer3));

    // Should stop at producer2's return value
    expect(next).toEqual({ count: 100, name: "Override", active: true });
  });

  it("should work with empty composition", () => {
    const base: State = { count: 0, name: "Alice", active: false };
    const next = craft(base, compose());

    expect(next).toBe(base);
  });
});

describe("composer", () => {
  it("should create a fluent composer", () => {
    const updater = composer<State>((draft) => {
      draft.count++;
    })
      .with((draft) => {
        draft.name = "Bob";
      })
      .with((draft) => {
        draft.active = true;
      });

    const base: State = { count: 0, name: "Alice", active: false };
    const next = updater.produce(base);

    expect(next).toEqual({ count: 1, name: "Bob", active: true });
  });

  it("should be reusable", () => {
    const updater = composer<State>((draft) => {
      draft.count++;
    }).with((draft) => {
      draft.active = true;
    });

    const state1: State = { count: 0, name: "Alice", active: false };
    const state2: State = { count: 5, name: "Charlie", active: false };

    expect(updater.produce(state1)).toEqual({ count: 1, name: "Alice", active: true });
    expect(updater.produce(state2)).toEqual({ count: 6, name: "Charlie", active: true });
  });

  it("should chain multiple composers", () => {
    const incrementer = composer<State>((draft) => {
      draft.count++;
    });

    const activator = incrementer.with((draft) => {
      draft.active = true;
    });

    const base: State = { count: 0, name: "Alice", active: false };

    expect(incrementer.produce(base)).toEqual({ count: 1, name: "Alice", active: false });
    expect(activator.produce(base)).toEqual({ count: 1, name: "Alice", active: true });
  });
});

describe("pipe", () => {
  it("should apply producers sequentially", () => {
    const base: State = { count: 0, name: "Alice", active: false };

    const next = pipe(
      base,
      (draft) => {
        draft.count++;
      },
      (draft) => {
        draft.count *= 2;
      },
      (draft) => {
        draft.name = "Bob";
      },
    );

    expect(next).toEqual({ count: 2, name: "Bob", active: false });
  });

  it("should work with no producers", () => {
    const base: State = { count: 0, name: "Alice", active: false };
    const next = pipe(base);

    expect(next).toBe(base);
  });

  it("should handle complex transformations", () => {
    const base = {
      todos: [
        { id: 1, text: "Task 1", done: false },
        { id: 2, text: "Task 2", done: false },
      ],
      filter: "all" as string,
    };

    const next = pipe(
      base,
      (draft) => {
        draft.todos.push({ id: 3, text: "Task 3", done: false });
      },
      (draft) => {
        draft.todos[0]!.done = true;
      },
      (draft) => {
        draft.filter = "active";
      },
    );

    expect(next.todos).toHaveLength(3);
    expect(next.todos[0]!.done).toBe(true);
    expect(next.filter).toBe("active");
    expect(base.todos).toHaveLength(2);
  });
});

import { produce } from "immer";
import { bench, describe } from "vitest";
import { craft } from "../src/craft";

describe("Array operations", () => {
  const smallArray = Array.from({ length: 10 }, (_, i) => i);
  const mediumArray = Array.from({ length: 100 }, (_, i) => i);
  const largeArray = Array.from({ length: 1000 }, (_, i) => i);

  describe("Small array (10 items)", () => {
    bench("craft - push", () => {
      craft({ items: smallArray }, (draft) => {
        draft.items.push(999);
      });
    });

    bench("immer - push", () => {
      produce({ items: smallArray }, (draft) => {
        draft.items.push(999);
      });
    });

    bench("craft - update element", () => {
      craft({ items: smallArray }, (draft) => {
        draft.items[5] = 999;
      });
    });

    bench("immer - update element", () => {
      produce({ items: smallArray }, (draft) => {
        draft.items[5] = 999;
      });
    });
  });

  describe("Medium array (100 items)", () => {
    bench("craft - push", () => {
      craft({ items: mediumArray }, (draft) => {
        draft.items.push(999);
      });
    });

    bench("immer - push", () => {
      produce({ items: mediumArray }, (draft) => {
        draft.items.push(999);
      });
    });
  });

  describe("Large array (1000 items)", () => {
    bench("craft - push", () => {
      craft({ items: largeArray }, (draft) => {
        draft.items.push(999);
      });
    });

    bench("immer - push", () => {
      produce({ items: largeArray }, (draft) => {
        draft.items.push(999);
      });
    });
  });
});

describe("Array of objects", () => {
  const todos = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    text: `Task ${i}`,
    done: false,
  }));

  bench("craft - update nested object in array", () => {
    craft({ todos }, (draft) => {
      draft.todos[50]!.done = true;
    });
  });

  bench("immer - update nested object in array", () => {
    produce({ todos }, (draft) => {
      draft.todos[50]!.done = true;
    });
  });

  bench("craft - add to array of objects", () => {
    craft({ todos }, (draft) => {
      draft.todos.push({ id: 100, text: "New task", done: false });
    });
  });

  bench("immer - add to array of objects", () => {
    produce({ todos }, (draft) => {
      draft.todos.push({ id: 100, text: "New task", done: false });
    });
  });
});

import { produce } from "immer";
import { bench, describe } from "vitest";
import { craft } from "../src/craft";

describe("Simple object updates", () => {
  const baseState = {
    count: 0,
    name: "Alice",
    active: true,
  };

  bench("craft - simple update", () => {
    craft(baseState, (draft) => {
      draft.count = 1;
      draft.name = "Bob";
    });
  });

  bench("immer - simple update", () => {
    produce(baseState, (draft) => {
      draft.count = 1;
      draft.name = "Bob";
    });
  });
});

describe("Nested object updates", () => {
  const baseState = {
    user: {
      name: "Alice",
      profile: {
        age: 25,
        address: {
          city: "NYC",
          country: "USA",
        },
      },
    },
  };

  bench("craft - nested update", () => {
    craft(baseState, (draft) => {
      draft.user.profile.age = 26;
      draft.user.profile.address.city = "LA";
    });
  });

  bench("immer - nested update", () => {
    produce(baseState, (draft) => {
      draft.user.profile.age = 26;
      draft.user.profile.address.city = "LA";
    });
  });
});

describe("No changes", () => {
  const baseState = {
    count: 0,
    name: "Alice",
  };

  bench("craft - no changes", () => {
    craft(baseState, () => {});
  });

  bench("immer - no changes", () => {
    produce(baseState, () => {});
  });
});

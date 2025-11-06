import { produce } from "immer";
import { bench, describe } from "vitest";
import { craft } from "../src/craft";

describe("Complex state updates", () => {
  const complexState = {
    user: {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      profile: {
        age: 25,
        bio: "Software developer",
        address: {
          street: "123 Main St",
          city: "NYC",
          country: "USA",
          zip: "10001",
        },
        preferences: {
          theme: "dark",
          notifications: true,
          language: "en",
        },
      },
    },
    posts: Array.from({ length: 50 }, (_, i) => ({
      id: i,
      title: `Post ${i}`,
      content: `Content for post ${i}`,
      tags: [`tag${i}`, `tag${i + 1}`],
      meta: {
        views: i * 10,
        likes: i * 2,
      },
    })),
    metadata: {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      stats: {
        totalUsers: 1000,
        activeUsers: 500,
        totalPosts: 50,
      },
    },
  };

  bench("craft - multiple deep updates", () => {
    craft(complexState, (draft) => {
      draft.user.profile.age = 26;
      draft.user.profile.address.city = "LA";
      draft.posts[0]!.meta.views++;
      draft.posts[0]!.meta.likes++;
      draft.metadata.stats.activeUsers++;
    });
  });

  bench("immer - multiple deep updates", () => {
    produce(complexState, (draft) => {
      draft.user.profile.age = 26;
      draft.user.profile.address.city = "LA";
      draft.posts[0]!.meta.views++;
      draft.posts[0]!.meta.likes++;
      draft.metadata.stats.activeUsers++;
    });
  });

  bench("craft - add and update in array", () => {
    craft(complexState, (draft) => {
      draft.posts.push({
        id: 50,
        title: "New post",
        content: "New content",
        tags: ["new"],
        meta: { views: 0, likes: 0 },
      });
      draft.posts[25]!.meta.views += 10;
    });
  });

  bench("immer - add and update in array", () => {
    produce(complexState, (draft) => {
      draft.posts.push({
        id: 50,
        title: "New post",
        content: "New content",
        tags: ["new"],
        meta: { views: 0, likes: 0 },
      });
      draft.posts[25]!.meta.views += 10;
    });
  });
});

describe("Structural sharing verification", () => {
  const state = {
    a: { value: 1 },
    b: { value: 2 },
    c: { value: 3 },
    d: { value: 4 },
  };

  bench("craft - single property update (structural sharing)", () => {
    const next = craft(state, (draft) => {
      draft.a.value = 10;
    });
    // Verify structural sharing
    if (next.b !== state.b || next.c !== state.c || next.d !== state.d) {
      throw new Error("Structural sharing failed");
    }
  });

  bench("immer - single property update (structural sharing)", () => {
    const next = produce(state, (draft) => {
      draft.a.value = 10;
    });
    // Verify structural sharing
    if (next.b !== state.b || next.c !== state.c || next.d !== state.d) {
      throw new Error("Structural sharing failed");
    }
  });
});

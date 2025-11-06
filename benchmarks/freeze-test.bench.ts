import { bench, describe } from "vitest";

describe("Freeze overhead", () => {
  const largeArray = Array.from({ length: 1000 }, (_, i) => i);

  bench("freeze array", () => {
    const copy = largeArray.slice();
    copy.push(999);
    Object.freeze(copy);
  });

  bench("no freeze", () => {
    const copy = largeArray.slice();
    copy.push(999);
  });

  bench("slice only", () => {
    const copy = largeArray.slice();
    copy.push(999);
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import {
  getConfig,
  setAutoFreeze,
  setUseStrictShallowCopy,
  resetConfig,
} from "../src/config";
import { craft } from "../src/craft";

describe("Configuration", () => {
  beforeEach(() => {
    // Reset config before each test
    resetConfig();
  });

  it("should have default config", () => {
    const config = getConfig();
    expect(config.autoFreeze).toBe(true);
    expect(config.useStrictShallowCopy).toBe(false);
  });

  it("setAutoFreeze should update config", () => {
    setAutoFreeze(false);
    expect(getConfig().autoFreeze).toBe(false);

    setAutoFreeze(true);
    expect(getConfig().autoFreeze).toBe(true);
  });

  it("setUseStrictShallowCopy should update config", () => {
    setUseStrictShallowCopy(true);
    expect(getConfig().useStrictShallowCopy).toBe(true);

    setUseStrictShallowCopy(false);
    expect(getConfig().useStrictShallowCopy).toBe(false);
  });

  it("resetConfig should restore defaults", () => {
    setAutoFreeze(false);
    setUseStrictShallowCopy(true);

    resetConfig();

    const config = getConfig();
    expect(config.autoFreeze).toBe(true);
    expect(config.useStrictShallowCopy).toBe(false);
  });

  it("autoFreeze=false should not freeze result when modified", () => {
    setAutoFreeze(false);

    const base = { count: 0 };
    const next = craft(base, (draft) => {
      draft.count = 1;
    });

    // Next should be a different object (copy was made)
    expect(next).not.toBe(base);
    expect(next.count).toBe(1);
    expect(Object.isFrozen(next)).toBe(false);
  });

  it("autoFreeze=true should freeze result", () => {
    setAutoFreeze(true);

    const base = { count: 0 };
    const next = craft(base, (draft) => {
      draft.count = 1;
    });

    expect(Object.isFrozen(next)).toBe(true);
  });

  it("useStrictShallowCopy should copy non-enumerable properties", () => {
    setUseStrictShallowCopy(true);

    const base: any = { count: 0 };
    Object.defineProperty(base, "hidden", {
      value: 42,
      enumerable: false,
    });

    const next = craft(base, (draft) => {
      draft.count = 1;
    });

    expect(next.count).toBe(1);
    expect(next.hidden).toBe(42);
  });
});

/** Reject property names that can reach or replace JavaScript prototypes. */
export function assertSafeProperty(key: PropertyKey): void {
  if (key === "__proto__" || key === "prototype" || key === "constructor") {
    throw new Error("Invalid property: reserved key");
  }
}

export function assertSafePath(path: (string | number)[]): void {
  if (!Array.isArray(path)) throw new Error("Invalid patch path: expected an array");
  for (const key of path) {
    if (typeof key !== "string" && typeof key !== "number") {
      throw new Error("Invalid patch path: expected a string or number");
    }
    assertSafeProperty(key);
  }
}

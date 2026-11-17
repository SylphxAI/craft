import { describe, expect, it } from "vitest";
import { craft, createDraft, current, finishDraft, isDraft } from "../src";

describe("collection value retention", () => {
  for (const mutateBeforeInsert of [true, false]) {
    it(`retains sibling draft mutations (${mutateBeforeInsert ? "before" : "after"} insertion)`, () => {
      const base = { item: { n: 1 }, values: new Set<{ n: number }>() };
      const draft = createDraft(base);
      if (mutateBeforeInsert) draft.item.n = 2;
      draft.values.add(draft.item);
      if (!mutateBeforeInsert) draft.item.n = 2;
      expect(draft.values.has(draft.item)).toBe(true);
      expect(draft.values.has(base.item)).toBe(true);
      expect([...current(draft.values)][0]!.n).toBe(2);
      const next = finishDraft(draft);
      expect([...next.values][0]).toBe(next.item);
      expect(next.item.n).toBe(2);
      expect(base.item.n).toBe(1);
      expect(base.values.size).toBe(0);
    });
  }

  it("preserves membership when deleting and reinserting an external draft", () => {
    const base = { item: { n: 1 }, values: new Set<{ n: number }>() };
    const next = craft(base, (draft) => {
      draft.item.n = 2;
      draft.values.add(draft.item).add(draft.item);
      expect(draft.values.size).toBe(1);
      expect(draft.values.delete(draft.item)).toBe(true);
      expect(draft.values.has(draft.item)).toBe(false);
      draft.values.add(draft.item);
    });
    expect([...next.values][0]).toBe(next.item);
    expect(base.values.size).toBe(0);
  });

  for (const make of [() => new Map(), () => new Set()]) {
    for (const key of ["meta", Symbol("meta")]) {
      it(`retains nested direct ${typeof key} properties of ${make().constructor.name}`, () => {
        const base = Object.defineProperty(make(), key, {
          value: { n: 1 },
          enumerable: false,
          configurable: true,
          writable: true,
        });
        const draft: any = createDraft(base);
        draft[key].n = 2;
        const snapshot: any = current(draft);
        expect(snapshot[key].n).toBe(2);
        expect(Object.getOwnPropertyDescriptor(snapshot, key)?.enumerable).toBe(false);
        draft[key].n = 3;
        expect(snapshot[key].n).toBe(2);
        const next: any = finishDraft(draft);
        expect(next[key].n).toBe(3);
        expect((base as any)[key].n).toBe(1);
      });
    }
  }
});

describe("draft transfers into Sets", () => {
  for (const fromMap of [false, true]) {
    for (const takeSnapshot of [false, true]) {
      it(`retains edited ${fromMap ? "Map" : "object"} values after source deletion (snapshot ${takeSnapshot})`, () => {
        const item = { n: 1 };
        const base = {
          item: item as { n: number } | undefined,
          map: new Map([["item", item]]),
          values: new Set<{ n: number }>(),
        };
        // Only the selected source is populated; final output has no alias to
        // accidentally finalize the transferred value before the Set does.
        if (fromMap) Reflect.deleteProperty(base, "item");
        else base.map.clear();
        const draft = createDraft(base);
        const value = fromMap ? draft.map.get("item")! : draft.item!;
        value.n = 2;
        if (fromMap) expect(draft.map.delete("item")).toBe(true);
        else expect(Reflect.deleteProperty(draft, "item")).toBe(true);
        expect(draft.values.add(value)).toBe(draft.values);
        expect(draft.values.has(item)).toBe(true);
        expect(draft.values.has(value)).toBe(true);
        if (takeSnapshot) expect([...current(draft.values)][0]).toEqual({ n: 2 });
        const next = finishDraft(draft);
        expect([...next.values]).toEqual([{ n: 2 }]);
        expect(isDraft([...next.values][0])).toBe(false);
        expect(next.item).toBeUndefined();
        expect(next.map.size).toBe(0);
        expect(item.n).toBe(1);
        expect(base.values.size).toBe(0);
        expect(fromMap ? base.map.get("item") : base.item).toBe(item);
      });
    }
  }

  for (const destinationFirst of [true, false]) {
    it(`retains an independent draft when ${destinationFirst ? "destination" : "source"} finishes first`, () => {
      const base = { n: 1 };
      const source = createDraft(base);
      const destinationBase = new Set<{ n: number }>();
      const destination = createDraft(destinationBase);
      source.n = 2;
      destination.add(source).add(source);
      source.n = 3;
      expect(destination.size).toBe(1);
      expect([...current(destination)][0]).toEqual({ n: 3 });
      const first = destinationFirst ? finishDraft(destination) : finishDraft(source);
      const second = destinationFirst ? finishDraft(source) : finishDraft(destination);
      const member = [
        ...(destinationFirst ? (first as Set<{ n: number }>) : (second as Set<{ n: number }>)),
      ][0];
      const object = destinationFirst ? second : first;
      expect(member).toBe(object);
      expect(member).toEqual({ n: 3 });
      expect(finishDraft(source)).toBe(object);
      // Finalizing either owner consumes a shared draft. Further edits must
      // fail, not succeed against a stale snapshot or a frozen shared copy.
      expect(() => {
        source.n = 4;
      }).toThrow(/finalized/);
      expect(() => destination.add({ n: 4 })).toThrow(/finalized/);
      expect(base.n).toBe(1);
      expect(destinationBase.size).toBe(0);
    });
  }

  it("preserves same-Set identity, no-op updates, deletion and reinsertion", () => {
    const item = { n: 1 };
    const base = new Set([item]);
    const noOp = createDraft(base);
    const member = [...noOp][0]!;
    expect(noOp.has(member)).toBe(true);
    expect(noOp.add(member)).toBe(noOp);
    expect(noOp.add(item)).toBe(noOp);
    expect(noOp.delete({ n: 1 })).toBe(false);
    expect([...current(noOp)]).toEqual([{ n: 1 }]);
    expect(finishDraft(noOp)).toBe(base);
    const draft = createDraft(base);
    const value = [...draft][0]!;
    value.n = 2;
    expect(draft.delete(value)).toBe(true);
    expect(draft.has(value)).toBe(false);
    expect(draft.add(value).add(value)).toBe(draft);
    const snapshot = current(draft);
    value.n = 3;
    expect([...snapshot]).toEqual([{ n: 2 }]);
    expect([...finishDraft(draft)]).toEqual([{ n: 3 }]);
    expect([...base]).toEqual([{ n: 1 }]);
  });
});

const collections = [
  { name: "Map", make: () => new Map([["entry", { n: 1 }]]) },
  { name: "Set", make: () => new Set([{ n: 1 }]) },
];

function editEntries(draft: any): void {
  for (const value of draft.values()) value.n = 5;
  draft.forEach((value: any, key: any, receiver: any) => {
    expect(receiver).toBe(draft);
    expect(value.n).toBe(5);
    if (draft instanceof Set) expect(key).toBe(value);
    else expect(key).toBe("entry");
  });
}

describe("collection own-property channels", () => {
  for (const { name, make } of collections) {
    for (const key of ["meta", Symbol("meta")]) {
      for (const mode of ["root recipe", "manual root", "manual nested"]) {
        it(`retains ${typeof key} properties on ${name} (${mode}) independently of entries`, () => {
          const base: any = Object.defineProperty(make(), key, {
            value: { n: 1 },
            enumerable: false,
            configurable: true,
            writable: true,
          });
          const assignedKey = typeof key === "symbol" ? Symbol("assigned") : "assigned";
          const prototype = Object.getPrototypeOf(base);
          const update = (draft: any) => {
            draft[key].n = 2;
            const assigned = { n: 10 };
            draft[assignedKey] = assigned;
            draft[assignedKey].n = 11;
            editEntries(draft);
            const snapshot: any = current(draft);
            expect(snapshot[key].n).toBe(2);
            expect(snapshot[assignedKey].n).toBe(11);
            expect([...snapshot.values()][0]).toEqual({ n: 5 });
            expect(isDraft(draft)).toBe(true);
            draft[key].n = 3;
            draft[assignedKey].n = 12;
            expect(snapshot[key].n).toBe(2);
            expect(snapshot[assignedKey].n).toBe(11);
            expect(assigned.n).toBe(10);
            expect(Object.getOwnPropertyDescriptor(snapshot, key)?.enumerable).toBe(false);
          };
          let next: any;
          if (mode === "root recipe") next = craft(base, update);
          else if (mode === "manual root") {
            const draft = createDraft(base);
            update(draft);
            next = finishDraft(draft);
          } else {
            const draft = createDraft({ collection: base });
            update(draft.collection);
            next = finishDraft(draft).collection;
          }
          expect(next[key].n).toBe(3);
          expect(next[assignedKey].n).toBe(12);
          expect([...next.values()][0]).toEqual({ n: 5 });
          expect(base[key].n).toBe(1);
          expect(Object.hasOwn(base, assignedKey)).toBe(false);
          expect([...base.values()][0]).toEqual({ n: 1 });
          expect(Object.getPrototypeOf(base)).toBe(prototype);
          expect(Object.getPrototypeOf(next)).toBe(prototype);
        });
      }

      it(`invalidates ${typeof key} property caches after replacement/deletion/redefinition on ${name}`, () => {
        const base: any = Object.assign(make(), { [key]: { n: 1 } });
        const draft: any = createDraft(base);
        draft[key].n = 2;
        draft[key] = { n: 3 };
        expect(draft[key].n).toBe(3);
        draft[key].n = 4;
        delete draft[key];
        expect(Object.hasOwn(current(draft), key)).toBe(false);
        draft[key] = { n: 5 };
        expect(draft[key].n).toBe(5);
        Object.defineProperty(draft, key, { value: { n: 6 }, configurable: true, writable: true });
        draft[key].n = 7;
        editEntries(draft);
        expect((current(draft) as any)[key].n).toBe(7);
        const next: any = finishDraft(draft);
        expect(next[key].n).toBe(7);
        expect([...next.values()][0]).toEqual({ n: 5 });
        expect(base[key].n).toBe(1);
        expect([...base.values()][0]).toEqual({ n: 1 });
      });
    }
  }
});

describe("collection descriptors and guarded reflection", () => {
  for (const { name, make } of collections) {
    it(`rejects a new fixed object descriptor before changing ${name}`, () => {
      const base = make();
      const draft: any = createDraft(base);
      const value = { n: 1 };
      // Exact raw identity is required for this descriptor by JavaScript.
      // Reject it explicitly; returning a nested proxy would violate invariants.
      expect(() => Object.defineProperty(draft, "meta", { value })).toThrow(
        /configurable or writable/,
      );
      expect(draft.meta).toBeUndefined();
      expect(Object.getOwnPropertyDescriptor(draft, "meta")).toBeUndefined();
      expect(value).toEqual({ n: 1 });
      expect(Object.isFrozen(value)).toBe(false);
      expect(finishDraft(draft)).toBe(base);
    });

    it(`preserves fixed primitive descriptor identity and flags on ${name}`, () => {
      const draft: any = createDraft(make());
      Object.defineProperty(draft, "meta", { value: 1 });
      expect(draft.meta).toBe(1);
      expect(Object.getOwnPropertyDescriptor(draft, "meta")).toEqual({
        value: 1,
        writable: false,
        configurable: false,
        enumerable: false,
      });
      expect(Reflect.set(draft, "meta", 2)).toBe(false);
      expect(Reflect.deleteProperty(draft, "meta")).toBe(false);
      expect((current(draft) as any).meta).toBe(1);
      expect((finishDraft(draft) as any).meta).toBe(1);
    });

    for (const flags of [
      { configurable: true, writable: false },
      { configurable: false, writable: true },
    ]) {
      it(`drafts object descriptors on ${name} (${JSON.stringify(flags)})`, () => {
        const base = make();
        const draft: any = createDraft(base);
        const value = { n: 1 };
        Object.defineProperty(draft, "meta", { value, ...flags });
        const descriptor = Object.getOwnPropertyDescriptor(draft, "meta")!;
        expect(descriptor.configurable).toBe(flags.configurable);
        expect(descriptor.writable).toBe(flags.writable);
        expect(descriptor.value).toBe(draft.meta);
        expect(isDraft(descriptor.value)).toBe(true);
        draft.meta.n = 2;
        editEntries(draft);
        const snapshot: any = current(draft);
        draft.meta.n = 3;
        expect(snapshot.meta.n).toBe(2);
        const next: any = finishDraft(draft);
        expect(next.meta.n).toBe(3);
        expect(Object.getOwnPropertyDescriptor(next, "meta")?.configurable).toBe(
          flags.configurable,
        );
        expect(Object.getOwnPropertyDescriptor(next, "meta")?.writable).toBe(flags.writable);
        expect(value.n).toBe(1);
        expect(Object.hasOwn(base, "meta")).toBe(false);
        expect([...next.values()][0]).toEqual({ n: 5 });
      });
    }

    it(`copies edits under existing locked base descriptors on ${name}`, () => {
      const value = { n: 1 };
      const base: any = Object.defineProperty(make(), "meta", { value });
      const draft: any = createDraft(base);
      expect(isDraft(draft.meta)).toBe(true);
      expect(Object.getOwnPropertyDescriptor(draft, "meta")?.value).toBe(draft.meta);
      draft.meta.n = 2;
      editEntries(draft);
      const snapshot: any = current(draft);
      draft.meta.n = 3;
      expect(snapshot.meta.n).toBe(2);
      const next: any = finishDraft(draft);
      expect(next.meta.n).toBe(3);
      expect(Object.getOwnPropertyDescriptor(next, "meta")).toEqual({
        value: next.meta,
        writable: false,
        configurable: false,
        enumerable: false,
      });
      expect(Object.getOwnPropertyDescriptor(base, "meta")).toEqual({
        value,
        writable: false,
        configurable: false,
        enumerable: false,
      });
      expect(value.n).toBe(1);
      expect([...base.values()][0]).toEqual({ n: 1 });
    });

    for (const key of ["__proto__", "prototype", "constructor"]) {
      it(`rejects ${key} access/reflection on both property and member channels of ${name}`, () => {
        const base: any = Object.assign(make(), { meta: { n: 1 } });
        const prototype = Object.getPrototypeOf(base);
        const draft: any = createDraft(base);
        expect(() => draft[key]).toThrow(/reserved/);
        expect(() => Object.getOwnPropertyDescriptor(draft, key)).toThrow(/reserved/);
        expect(() => Object.defineProperty(draft, key, { value: {} })).toThrow(/reserved/);
        expect(() => draft.meta[key]).toThrow(/reserved/);
        const property = Object.getOwnPropertyDescriptor(draft, "meta")!.value;
        expect(() => property[key]).toThrow(/reserved/);
        expect(() => [...draft.values()][0][key]).toThrow(/reserved/);
        expect(() =>
          draft.forEach((value: any) => {
            void value[key];
          }),
        ).toThrow(/reserved/);
        expect(finishDraft(draft)).toBe(base);
        expect(base.meta.n).toBe(1);
        expect(Object.getPrototypeOf(base)).toBe(prototype);
        expect(Object.getPrototypeOf(base.meta)).toBe(Object.prototype);
      });
    }
  }
});

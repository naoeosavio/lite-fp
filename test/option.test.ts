import { describe, it, assert } from "./utils";
import type { Some } from "../src/Option";
import {
  none,
  some,
  isSome,
  isNone,
  fromNullable,
  fromPredicate,
  fromThrowable,
  fromPromise,
  map,
  flatMap,
  filter,
  fold,
  match,
  unwrap,
  getOrElse,
  getOrUndefined,
  getOrNull,
  getOrThrow,
  zip,
  apply,
  orElse,
  tap,
  Option,
} from "../src/Option";

describe("Option", () => {
  describe("Constructors", () => {
    describe("none", () => {
      it("should create a None", () => {
        const result = none();
        assert.equal(isNone(result), true);
        assert.equal(result.$, "None");
      });
    });

    describe("some", () => {
      it("should create a Some with the given value", () => {
        const result = some(42);
        assert.equal(isSome(result), true);
        assert.equal(result.$, "Some");
        assert.equal(getOrThrow(result), 42);
      });

      it("should work with strings", () => {
        const result = some("hello");
        assert.equal(getOrThrow(result), "hello");
      });

      it("should work with objects", () => {
        const obj = { a: 1, b: 2 };
        const result = some(obj);
        assert.deepEqual(getOrThrow(result), obj);
      });
    });
  });

  describe("Guards", () => {
    describe("isSome", () => {
      it("should return true for Some", () => {
        assert.equal(isSome(some(42)), true);
      });

      it("should return false for None", () => {
        assert.equal(isSome(none()), false);
      });
    });

    describe("isNone", () => {
      it("should return true for None", () => {
        assert.equal(isNone(none()), true);
      });

      it("should return false for Some", () => {
        assert.equal(isNone(some(42)), false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      it("should return Some for non-null value", () => {
        const result = fromNullable(42);
        assert.equal(isSome(result), true);
        assert.equal(getOrThrow(result), 42);
      });

      it("should return None for null", () => {
        assert.equal(isNone(fromNullable(null)), true);
      });

      it("should return None for undefined", () => {
        assert.equal(isNone(fromNullable(undefined)), true);
      });
    });

    describe("fromPredicate", () => {
      it("should return Some when predicate passes", () => {
        const result = fromPredicate(10, (x) => x > 5);
        assert.equal(isSome(result), true);
        assert.equal(getOrThrow(result), 10);
      });

      it("should return None when predicate fails", () => {
        const result = fromPredicate(3, (x) => x > 5);
        assert.equal(isNone(result), true);
      });
    });

    describe("fromThrowable", () => {
      it("should return Some when function succeeds", () => {
        const result = fromThrowable(() => JSON.parse('{"ok":true}'));
        assert.equal(isSome(result), true);
        assert.deepEqual(getOrThrow(result), { ok: true });
      });

      it("should return None when function throws", () => {
        const result = fromThrowable(() => JSON.parse("invalid"));
        assert.equal(isNone(result), true);
      });
    });

    describe("fromPromise", () => {
      it("should return Some when promise resolves", async () => {
        const result = await fromPromise(Promise.resolve("data"));
        assert.equal(isSome(result), true);
        assert.equal(getOrThrow(result), "data");
      });

      it("should return None when promise rejects", async () => {
        const result = await fromPromise(Promise.reject("fail"));
        assert.equal(isNone(result), true);
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      it("should transform Some value", () => {
        const result = map(some(5), (x) => x * 2);
        assert.equal(isSome(result), true);
        assert.equal(getOrThrow(result), 10);
      });

      it("should not transform None", () => {
        const result = map(none<number>(), (x) => x * 2);
        assert.equal(isNone(result), true);
      });

      it("should change the type", () => {
        const result = map(some(42), (x) => `num: ${x}`);
        assert.equal(getOrThrow(result), "num: 42");
      });
    });

    describe("flatMap", () => {
      it("should chain on Some value", () => {
        const result = flatMap(some(5), (x) => some(x * 2));
        assert.equal(getOrThrow(result), 10);
      });

      it("should not chain on None", () => {
        const result = flatMap(none<number>(), (x: number) => some(x * 2));
        assert.equal(isNone(result), true);
      });

      it("should allow switching to None", () => {
        const result = flatMap(some(0), (x) =>
          x > 0 ? some(x) : none(),
        );
        assert.equal(isNone(result), true);
      });
    });

    describe("filter", () => {
      it("should keep Some when predicate passes", () => {
        const result = filter(some(10), (x) => x > 5);
        assert.equal(isSome(result), true);
        assert.equal(getOrThrow(result), 10);
      });

      it("should become None when predicate fails", () => {
        const result = filter(some(3), (x) => x > 5);
        assert.equal(isNone(result), true);
      });

      it("should keep None unchanged", () => {
        const result = filter(none<number>(), (_x: number) => true);
        assert.equal(isNone(result), true);
      });
    });

    describe("fold", () => {
      it("should call onSome for Some value", () => {
        const result = fold(
          some(5),
          () => 0,
          (x) => x * 2,
        );
        assert.equal(result, 10);
      });

      it("should call onNone for None", () => {
        const result = fold(
          none<number>(),
          () => 0,
          (x) => x * 2,
        );
        assert.equal(result, 0);
      });
    });

    describe("match", () => {
      it("should call some branch on Some", () => {
        const result = match(some(42), {
          some: (v) => `ok: ${v}`,
          none: () => "empty",
        });
        assert.equal(result, "ok: 42");
      });

      it("should call none branch on None", () => {
        const result = match(none<number>(), {
          some: (v) => `ok: ${v}`,
          none: () => "empty",
        });
        assert.equal(result, "empty");
      });
    });
  });

  describe("Extract", () => {
    describe("getOrThrow", () => {
      it("should extract value from Some", () => {
        assert.equal(getOrThrow(some(42)), 42);
      });
    });

    describe("getOrElse", () => {
      it("should return Some value", () => {
        assert.equal(getOrElse(some(42), 0), 42);
      });

      it("should return default for None", () => {
        assert.equal(getOrElse(none<number>(), 42), 42);
      });
    });

    describe("getOrUndefined", () => {
      it("should return Some value", () => {
        assert.equal(getOrUndefined(some(42)), 42);
      });

      it("should return undefined for None", () => {
        assert.equal(getOrUndefined(none<number>()), undefined);
      });
    });

    describe("getOrNull", () => {
      it("should return Some value", () => {
        assert.equal(getOrNull(some(42)), 42);
      });

      it("should return null for None", () => {
        assert.equal(getOrNull(none<number>()), null);
      });
    });

    describe("getOrThrow", () => {
      it("should return Some value", () => {
        assert.equal(getOrThrow(some(42)), 42);
      });

      it("should throw for None", () => {
        assert.throws(() => getOrThrow(none()), "Option is none");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      it("should combine two Somes", () => {
        const result = zip(some(1), some("a"));
        assert.equal(isSome(result), true);
        assert.deepEqual(getOrThrow(result), [1, "a"]);
      });

      it("should return None if first is None", () => {
        assert.equal(isNone(zip(none(), some(1))), true);
      });

      it("should return None if second is None", () => {
        assert.equal(isNone(zip(some(1), none())), true);
      });
    });

    describe("apply", () => {
      it("should apply function to Some value", () => {
        const fn: Option<(x: number) => number> = some((x: number) => x * 2);
        const result = apply(fn, some(10));
        assert.equal(getOrThrow(result), 20);
      });

      it("should return None if fn is None", () => {
        const result = apply(none<(x: number) => number>(), some(10));
        assert.equal(isNone(result), true);
      });

      it("should return None if arg is None", () => {
        const fn: Option<(x: number) => number> = some((x: number) => x * 2);
        const result = apply(fn, none());
        assert.equal(isNone(result), true);
      });
    });

    describe("orElse", () => {
      it("should return first if Some", () => {
        const result = orElse(some(42), none());
        assert.equal(getOrThrow(result), 42);
      });

      it("should return second if first is None", () => {
        const result = orElse(none(), some(42));
        assert.equal(getOrThrow(result), 42);
      });

      it("should return None if both are None", () => {
        assert.equal(isNone(orElse(none(), none())), true);
      });
    });

    describe("tap", () => {
      it("should call side effect on Some", () => {
        let sideEffect = 0;
        const result = tap(some(42), (x) => {
          sideEffect = x;
        });
        assert.equal(sideEffect, 42);
        assert.equal(getOrThrow(result), 42);
      });

      it("should not call side effect on None", () => {
        let sideEffect = 0;
        tap(none<number>(), (_x: number) => {
          sideEffect = 99;
        });
        assert.equal(sideEffect, 0);
      });
    });
  });

  describe("Namespace (Option.*)", () => {
    it("Option.some should work like some", () => {
      assert.equal(getOrThrow(Option.some(42)), 42);
    });

    it("Option.none should work like none", () => {
      assert.equal(isNone(Option.none()), true);
    });

    it("Option.fromNullable should work", () => {
      assert.equal(getOrThrow(Option.fromNullable("hello")), "hello");
      assert.equal(isNone(Option.fromNullable(null)), true);
    });

    it("Option.fromPredicate should work", () => {
      const r = Option.fromPredicate(10, (x: number) => x > 5);
      assert.equal(getOrThrow(r), 10);
    });

    it("Option.map should work", () => {
      const r = Option.map(some(5), (x: number) => x * 2);
      assert.equal(getOrThrow(r), 10);
    });

    it("Option.fold should work", () => {
      const r = Option.fold(some(5), () => 0, (x: number) => x * 2);
      assert.equal(r, 10);
    });

    it("Option.new should work like fromNullable", () => {
      assert.equal(getOrThrow(Option.new("hello")), "hello");
      assert.equal(isNone(Option.new(null)), true);
    });
  });
});

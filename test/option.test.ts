import { describe, test, expect } from "./utils";
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
      test("should create a None", () => {
        const result = none();
        expect(isNone(result)).toBe(true);
        expect(result.$).toBe("None");
      });
    });

    describe("some", () => {
      test("should create a Some with the given value", () => {
        const result = some(42);
        expect(isSome(result)).toBe(true);
        expect(result.$).toBe("Some");
        expect(unwrap(result)).toBe(42);
      });

      test("should work with strings", () => {
        const result = some("hello");
        expect(unwrap(result)).toBe("hello");
      });

      test("should work with objects", () => {
        const obj = { a: 1, b: 2 };
        const result = some(obj);
        expect(unwrap(result)).toEqual(obj);
      });
    });
  });

  describe("Guards", () => {
    describe("isSome", () => {
      test("should return true for Some", () => {
        expect(isSome(some(42))).toBe(true);
      });

      test("should return false for None", () => {
        expect(isSome(none())).toBe(false);
      });
    });

    describe("isNone", () => {
      test("should return true for None", () => {
        expect(isNone(none())).toBe(true);
      });

      test("should return false for Some", () => {
        expect(isNone(some(42))).toBe(false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      test("should return Some for non-null value", () => {
        const result = fromNullable(42);
        expect(isSome(result)).toBe(true);
        expect(unwrap(result)).toBe(42);
      });

      test("should return None for null", () => {
        expect(isNone(fromNullable(null))).toBe(true);
      });

      test("should return None for undefined", () => {
        expect(isNone(fromNullable(undefined))).toBe(true);
      });
    });

    describe("fromPredicate", () => {
      test("should return Some when predicate passes", () => {
        const result = fromPredicate(10, (x) => x > 5);
        expect(isSome(result)).toBe(true);
        expect(unwrap(result)).toBe(10);
      });

      test("should return None when predicate fails", () => {
        const result = fromPredicate(3, (x) => x > 5);
        expect(isNone(result)).toBe(true);
      });
    });

    describe("fromThrowable", () => {
      test("should return Some when function succeeds", () => {
        const result = fromThrowable(() => JSON.parse('{"ok":true}'));
        expect(isSome(result)).toBe(true);
        expect(unwrap(result)).toEqual({ ok: true });
      });

      test("should return None when function throws", () => {
        const result = fromThrowable(() => JSON.parse("invalid"));
        expect(isNone(result)).toBe(true);
      });
    });

    describe("fromPromise", () => {
      test("should return Some when promise resolves", async () => {
        const result = await fromPromise(Promise.resolve("data"));
        expect(isSome(result)).toBe(true);
        expect(unwrap(result)).toBe("data");
      });

      test("should return None when promise rejects", async () => {
        const result = await fromPromise(Promise.reject("fail"));
        expect(isNone(result)).toBe(true);
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      test("should transform Some value", () => {
        const result = map(some(5), (x) => x * 2);
        expect(isSome(result)).toBe(true);
        expect(unwrap(result)).toBe(10);
      });

      test("should not transform None", () => {
        const result = map(none<number>(), (x) => x * 2);
        expect(isNone(result)).toBe(true);
      });

      test("should change the type", () => {
        const result = map(some(42), (x) => `num: ${x}`);
        expect(unwrap(result)).toBe("num: 42");
      });
    });

    describe("flatMap", () => {
      test("should chain on Some value", () => {
        const result = flatMap(some(5), (x) => some(x * 2));
        expect(unwrap(result)).toBe(10);
      });

      test("should not chain on None", () => {
        const result = flatMap(none<number>(), (x) => some(x * 2));
        expect(isNone(result)).toBe(true);
      });

      test("should allow switching to None", () => {
        const result = flatMap(some(0), (x) =>
          x > 0 ? some(x) : none(),
        );
        expect(isNone(result)).toBe(true);
      });
    });

    describe("filter", () => {
      test("should keep Some when predicate passes", () => {
        const result = filter(some(10), (x) => x > 5);
        expect(isSome(result)).toBe(true);
        expect(unwrap(result)).toBe(10);
      });

      test("should become None when predicate fails", () => {
        const result = filter(some(3), (x) => x > 5);
        expect(isNone(result)).toBe(true);
      });

      test("should keep None unchanged", () => {
        const result = filter(none<number>(), (_x) => true);
        expect(isNone(result)).toBe(true);
      });
    });

    describe("fold", () => {
      test("should call onSome for Some value", () => {
        const result = fold(
          some(5),
          () => 0,
          (x) => x * 2,
        );
        expect(result).toBe(10);
      });

      test("should call onNone for None", () => {
        const result = fold(
          none<number>(),
          () => 0,
          (x) => x * 2,
        );
        expect(result).toBe(0);
      });
    });

    describe("match", () => {
      test("should call some branch on Some", () => {
        const result = match(some(42), {
          some: (v) => `ok: ${v}`,
          none: () => "empty",
        });
        expect(result).toBe("ok: 42");
      });

      test("should call none branch on None", () => {
        const result = match(none<number>(), {
          some: (v) => `ok: ${v}`,
          none: () => "empty",
        });
        expect(result).toBe("empty");
      });
    });
  });

  describe("Extract", () => {
    describe("unwrap", () => {
      test("should extract value from Some", () => {
        expect(unwrap(some(42))).toBe(42);
      });
    });

    describe("getOrElse", () => {
      test("should return Some value", () => {
        expect(getOrElse(some(42), 0)).toBe(42);
      });

      test("should return default for None", () => {
        expect(getOrElse(none<number>(), 42)).toBe(42);
      });
    });

    describe("getOrUndefined", () => {
      test("should return Some value", () => {
        expect(getOrUndefined(some(42))).toBe(42);
      });

      test("should return undefined for None", () => {
        expect(getOrUndefined(none<number>())).toBeUndefined();
      });
    });

    describe("getOrNull", () => {
      test("should return Some value", () => {
        expect(getOrNull(some(42))).toBe(42);
      });

      test("should return null for None", () => {
        expect(getOrNull(none<number>())).toBeNull();
      });
    });

    describe("getOrThrow", () => {
      test("should return Some value", () => {
        expect(getOrThrow(some(42))).toBe(42);
      });

      test("should throw for None", () => {
        expect(() => getOrThrow(none())).toThrow("Option is none");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      test("should combine two Somes", () => {
        const result = zip(some(1), some("a"));
        expect(isSome(result)).toBe(true);
        expect(unwrap(result)).toEqual([1, "a"]);
      });

      test("should return None if first is None", () => {
        expect(isNone(zip(none(), some(1)))).toBe(true);
      });

      test("should return None if second is None", () => {
        expect(isNone(zip(some(1), none()))).toBe(true);
      });
    });

    describe("apply", () => {
      test("should apply function to Some value", () => {
        const fn = some((x: number) => x * 2);
        const result = apply(fn, some(10));
        expect(unwrap(result)).toBe(20);
      });

      test("should return None if fn is None", () => {
        const result = apply(none<(x: number) => number>(), some(10));
        expect(isNone(result)).toBe(true);
      });

      test("should return None if arg is None", () => {
        const fn = some((x: number) => x * 2);
        const result = apply(fn, none());
        expect(isNone(result)).toBe(true);
      });
    });

    describe("orElse", () => {
      test("should return first if Some", () => {
        const result = orElse(some(42), none());
        expect(unwrap(result)).toBe(42);
      });

      test("should return second if first is None", () => {
        const result = orElse(none(), some(42));
        expect(unwrap(result)).toBe(42);
      });

      test("should return None if both are None", () => {
        expect(isNone(orElse(none(), none()))).toBe(true);
      });
    });

    describe("tap", () => {
      test("should call side effect on Some", () => {
        let sideEffect = 0;
        const result = tap(some(42), (x) => {
          sideEffect = x;
        });
        expect(sideEffect).toBe(42);
        expect(unwrap(result)).toBe(42);
      });

      test("should not call side effect on None", () => {
        let sideEffect = 0;
        tap(none<number>(), (_x) => {
          sideEffect = 99;
        });
        expect(sideEffect).toBe(0);
      });
    });
  });

  describe("Namespace (Option.*)", () => {
    test("Option.some should work like some", () => {
      expect(unwrap(Option.some(42))).toBe(42);
    });

    test("Option.none should work like none", () => {
      expect(isNone(Option.none())).toBe(true);
    });

    test("Option.fromNullable should work", () => {
      expect(unwrap(Option.fromNullable("hello"))).toBe("hello");
      expect(isNone(Option.fromNullable(null))).toBe(true);
    });

    test("Option.fromPredicate should work", () => {
      const r = Option.fromPredicate(10, (x: number) => x > 5);
      expect(unwrap(r)).toBe(10);
    });

    test("Option.map should work", () => {
      const r = Option.map(some(5), (x: number) => x * 2);
      expect(unwrap(r)).toBe(10);
    });

    test("Option.fold should work", () => {
      const r = Option.fold(some(5), () => 0, (x: number) => x * 2);
      expect(r).toBe(10);
    });

    test("Option.new should work like fromNullable", () => {
      expect(unwrap(Option.new("hello"))).toBe("hello");
      expect(isNone(Option.new(null))).toBe(true);
    });
  });
});

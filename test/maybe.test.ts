import { describe, test, expect } from "./utils";
import {
  just,
  nothing,
  nothingNull,
  nothingUndefined,
  isJust,
  isNothing,
  isNull,
  isUndefined,
  fromNullable,
  fromPredicate,
  fromThrowable,
  fromPromise,
  map,
  flatMap,
  filter,
  fold,
  match,
  tap,
  getOrElse,
  getOrUndefined,
  getOrNull,
  getOrThrow,
  zip,
  apply,
  orElse,
  Maybe,
} from "../src/Maybe";

describe("Maybe", () => {
  describe("Constructors", () => {
    describe("just", () => {
      test("should return the value as-is", () => {
        expect(just(42)).toBe(42);
      });

      test("should work with strings", () => {
        expect(just("hello")).toBe("hello");
      });

      test("should work with objects", () => {
        const obj = { a: 1 };
        expect(just(obj)).toBe(obj);
      });
    });

    describe("nothing", () => {
      test("should return undefined", () => {
        expect(nothing()).toBeUndefined();
      });

      test("should be isNothing", () => {
        expect(isNothing(nothing())).toBe(true);
      });
    });

    describe("nothingNull", () => {
      test("should return null", () => {
        expect(nothingNull()).toBeNull();
      });

      test("should be isNothing", () => {
        expect(isNothing(nothingNull())).toBe(true);
      });
    });

    describe("nothingUndefined", () => {
      test("should return undefined", () => {
        expect(nothingUndefined()).toBeUndefined();
      });
    });
  });

  describe("Guards", () => {
    describe("isJust", () => {
      test("should return true for non-null/non-undefined", () => {
        expect(isJust(42)).toBe(true);
        expect(isJust("hello")).toBe(true);
        expect(isJust(false)).toBe(true);
        expect(isJust(0)).toBe(true);
        expect(isJust("")).toBe(true);
      });

      test("should return false for null", () => {
        expect(isJust(null)).toBe(false);
      });

      test("should return false for undefined", () => {
        expect(isJust(undefined)).toBe(false);
      });
    });

    describe("isNothing", () => {
      test("should return true for null", () => {
        expect(isNothing(null)).toBe(true);
      });

      test("should return true for undefined", () => {
        expect(isNothing(undefined)).toBe(true);
      });

      test("should return false for any value", () => {
        expect(isNothing(42)).toBe(false);
        expect(isNothing("hello")).toBe(false);
        expect(isNothing(false)).toBe(false);
      });
    });

    describe("isNull", () => {
      test("should return true for null only", () => {
        expect(isNull(null)).toBe(true);
        expect(isNull(undefined)).toBe(false);
        expect(isNull(42)).toBe(false);
      });
    });

    describe("isUndefined", () => {
      test("should return true for undefined only", () => {
        expect(isUndefined(undefined)).toBe(true);
        expect(isUndefined(null)).toBe(false);
        expect(isUndefined(42)).toBe(false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      test("should return value for non-null value", () => {
        expect(fromNullable(42)).toBe(42);
      });

      test("should return nothing for null", () => {
        expect(isNothing(fromNullable(null))).toBe(true);
      });

      test("should return nothing for undefined", () => {
        expect(isNothing(fromNullable(undefined))).toBe(true);
      });
    });

    describe("fromPredicate", () => {
      test("should return value when predicate passes", () => {
        expect(fromPredicate(10, (x) => x > 5)).toBe(10);
      });

      test("should return nothing when predicate fails", () => {
        expect(isNothing(fromPredicate(3, (x) => x > 5))).toBe(true);
      });
    });

    describe("fromThrowable", () => {
      test("should return value when function succeeds", () => {
        const result = fromThrowable(() => JSON.parse('{"ok":true}'));
        expect(result).toEqual({ ok: true });
      });

      test("should return nothing when function throws", () => {
        const result = fromThrowable(() => JSON.parse("invalid"));
        expect(isNothing(result)).toBe(true);
      });
    });

    describe("fromPromise", () => {
      test("should return value when promise resolves", async () => {
        const result = await fromPromise(Promise.resolve("data"));
        expect(result).toBe("data");
      });

      test("should return nothing when promise rejects", async () => {
        const result = await fromPromise(Promise.reject("fail"));
        expect(isNothing(result)).toBe(true);
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      test("should transform Just value", () => {
        const result = map(5, (x) => x * 2);
        expect(result).toBe(10);
      });

      test("should not transform Nothing", () => {
        const result = map(null as Maybe<number>, (x) => x * 2);
        expect(isNothing(result)).toBe(true);
      });

      test("should change type", () => {
        const result = map(42, (x) => `num: ${x}`);
        expect(result).toBe("num: 42");
      });
    });

    describe("flatMap", () => {
      test("should chain on Just value returning Just", () => {
        const result = flatMap(5, (x) => x * 2);
        expect(result).toBe(10);
      });

      test("should chain on Just value returning Nothing", () => {
        const result = flatMap(0, (x) => (x > 0 ? x : nothing()));
        expect(isNothing(result)).toBe(true);
      });

      test("should not chain on Nothing", () => {
        const result = flatMap(null as Maybe<number>, (x) => x * 2);
        expect(isNothing(result)).toBe(true);
      });
    });

    describe("filter", () => {
      test("should keep value when predicate passes", () => {
        const result = filter(10, (x) => x > 5);
        expect(result).toBe(10);
      });

      test("should become nothing when predicate fails", () => {
        const result = filter(3, (x) => x > 5);
        expect(isNothing(result)).toBe(true);
      });

      test("should keep nothing", () => {
        const result = filter(null, (_x: number) => true);
        expect(isNothing(result)).toBe(true);
      });
    });

    describe("fold", () => {
      test("should call onJust for Just value", () => {
        const result = fold(5, () => 0, (x) => x * 2);
        expect(result).toBe(10);
      });

      test("should call onNothing for Nothing", () => {
        const result = fold(null, () => 0, (x: number) => x * 2);
        expect(result).toBe(0);
      });
    });

    describe("match", () => {
      test("should call some branch on Just", () => {
        const result = match(42, {
          some: (v) => `ok: ${v}`,
          nothing: () => "empty",
        });
        expect(result).toBe("ok: 42");
      });

      test("should call nothing branch on Nothing", () => {
        const result = match(null, {
          some: (v: number) => `ok: ${v}`,
          nothing: () => "empty",
        });
        expect(result).toBe("empty");
      });
    });
  });

  describe("Extract", () => {
    describe("getOrElse", () => {
      test("should return Just value", () => {
        expect(getOrElse(42, 0)).toBe(42);
      });

      test("should return default for Nothing (null)", () => {
        expect(getOrElse(null, 42)).toBe(42);
      });

      test("should return default for Nothing (undefined)", () => {
        expect(getOrElse(undefined, 42)).toBe(42);
      });
    });

    describe("getOrUndefined", () => {
      test("should return Just value", () => {
        expect(getOrUndefined(42)).toBe(42);
      });

      test("should return undefined for Nothing", () => {
        expect(getOrUndefined(null)).toBeUndefined();
      });
    });

    describe("getOrNull", () => {
      test("should return Just value", () => {
        expect(getOrNull(42)).toBe(42);
      });

      test("should return null for Nothing", () => {
        expect(getOrNull(undefined)).toBeNull();
      });
    });

    describe("getOrThrow", () => {
      test("should return Just value", () => {
        expect(getOrThrow(42)).toBe(42);
      });

      test("should throw for Nothing (null)", () => {
        expect(() => getOrThrow(null)).toThrow("Maybe is nothing");
      });

      test("should throw for Nothing (undefined)", () => {
        expect(() => getOrThrow(undefined)).toThrow("Maybe is nothing");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      test("should combine two Justs", () => {
        const result = zip(1, "a");
        expect(result).toEqual([1, "a"]);
      });

      test("should return Nothing if first is Nothing", () => {
        const result = zip(null, 1);
        expect(isNothing(result)).toBe(true);
      });

      test("should return Nothing if second is Nothing", () => {
        const result = zip(1, undefined);
        expect(isNothing(result)).toBe(true);
      });
    });

    describe("apply", () => {
      test("should apply function to Just value", () => {
        const fn: Maybe<(x: number) => number> = (x) => x * 2;
        const result = apply(fn, 10);
        expect(result).toBe(20);
      });

      test("should return Nothing if fn is Nothing", () => {
        const result = apply(null as Maybe<(x: number) => number>, 10);
        expect(isNothing(result)).toBe(true);
      });

      test("should return Nothing if arg is Nothing", () => {
        const fn: Maybe<(x: number) => number> = (x) => x * 2;
        const result = apply(fn, null);
        expect(isNothing(result)).toBe(true);
      });
    });

    describe("orElse", () => {
      test("should return first if Just", () => {
        const result = orElse(42, 99);
        expect(result).toBe(42);
      });

      test("should return second if first is Nothing", () => {
        const result = orElse(null, 42);
        expect(result).toBe(42);
      });

      test("should return Nothing if both are Nothing", () => {
        expect(isNothing(orElse(null, undefined))).toBe(true);
      });
    });

    describe("tap", () => {
      test("should call side effect on Just", () => {
        let sideEffect = 0;
        const result = tap(42, (x) => {
          sideEffect = x;
        });
        expect(sideEffect).toBe(42);
        expect(result).toBe(42);
      });

      test("should not call side effect on Nothing", () => {
        let sideEffect = 0;
        tap(null as Maybe<number>, (_x) => {
          sideEffect = 99;
        });
        expect(sideEffect).toBe(0);
      });
    });
  });

  describe("Namespace (Maybe.*)", () => {
    test("Maybe.just should work like just", () => {
      expect(Maybe.just(42)).toBe(42);
    });

    test("Maybe.nothing should work like nothing", () => {
      expect(Maybe.nothing()).toBeUndefined();
    });

    test("Maybe.isJust should work like isJust", () => {
      expect(Maybe.isJust(42)).toBe(true);
      expect(Maybe.isJust(null)).toBe(false);
    });

    test("Maybe.isNothing should work like isNothing", () => {
      expect(Maybe.isNothing(null)).toBe(true);
      expect(Maybe.isNothing(42)).toBe(false);
    });

    test("Maybe.fromNullable should work", () => {
      expect(Maybe.fromNullable("hello")).toBe("hello");
      expect(isNothing(Maybe.fromNullable(null))).toBe(true);
    });

    test("Maybe.map should work", () => {
      expect(Maybe.map(5, (x: number) => x * 2)).toBe(10);
    });

    test("Maybe.fold should work", () => {
      const r = Maybe.fold(5, () => 0, (x: number) => x * 2);
      expect(r).toBe(10);
    });

    test("Maybe.new should work like fromNullable", () => {
      expect(Maybe.new("hello")).toBe("hello");
      expect(isNothing(Maybe.new(null))).toBe(true);
    });
  });
});

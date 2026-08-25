import { describe, it, assert } from "./utils";
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
  unwrap,
  zip,
  apply,
  orElse,
  Maybe,
} from "../src/Maybe";

describe("Maybe", () => {
  describe("Constructors", () => {
    describe("just", () => {
      it("should return the value as-is", () => {
        assert.equal(just(42), 42);
      });

      it("should work with strings", () => {
        assert.equal(just("hello"), "hello");
      });

      it("should work with objects", () => {
        const obj = { a: 1 };
        assert.equal(just(obj), obj);
      });
    });

    describe("nothing", () => {
      it("should return undefined", () => {
        assert.equal(nothing(), undefined);
      });

      it("should be isNothing", () => {
        assert.equal(isNothing(nothing()), true);
      });
    });

    describe("nothingNull", () => {
      it("should return null", () => {
        assert.equal(nothingNull(), null);
      });

      it("should be isNothing", () => {
        assert.equal(isNothing(nothingNull()), true);
      });
    });

    describe("nothingUndefined", () => {
      it("should return undefined", () => {
        assert.equal(nothingUndefined(), undefined);
      });
    });
  });

  describe("Guards", () => {
    describe("isJust", () => {
      it("should return true for non-null/non-undefined", () => {
        assert.equal(isJust(42), true);
        assert.equal(isJust("hello"), true);
        assert.equal(isJust(false), true);
        assert.equal(isJust(0), true);
        assert.equal(isJust(""), true);
      });

      it("should return false for null", () => {
        assert.equal(isJust(null), false);
      });

      it("should return false for undefined", () => {
        assert.equal(isJust(undefined), false);
      });
    });

    describe("isNothing", () => {
      it("should return true for null", () => {
        assert.equal(isNothing(null), true);
      });

      it("should return true for undefined", () => {
        assert.equal(isNothing(undefined), true);
      });

      it("should return false for any value", () => {
        assert.equal(isNothing(42), false);
        assert.equal(isNothing("hello"), false);
        assert.equal(isNothing(false), false);
      });
    });

    describe("isNull", () => {
      it("should return true for null only", () => {
        assert.equal(isNull(null), true);
        assert.equal(isNull(undefined), false);
        assert.equal(isNull(42), false);
      });
    });

    describe("isUndefined", () => {
      it("should return true for undefined only", () => {
        assert.equal(isUndefined(undefined), true);
        assert.equal(isUndefined(null), false);
        assert.equal(isUndefined(42), false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      it("should return value for non-null value", () => {
        assert.equal(fromNullable(42), 42);
      });

      it("should return nothing for null", () => {
        assert.equal(isNothing(fromNullable(null)), true);
      });

      it("should return nothing for undefined", () => {
        assert.equal(isNothing(fromNullable(undefined)), true);
      });
    });

    describe("fromPredicate", () => {
      it("should return value when predicate passes", () => {
        assert.equal(fromPredicate(10, (x) => x > 5), 10);
      });

      it("should return nothing when predicate fails", () => {
        assert.equal(isNothing(fromPredicate(3, (x) => x > 5)), true);
      });
    });

    describe("fromThrowable", () => {
      it("should return value when function succeeds", () => {
        const result = fromThrowable(() => JSON.parse('{"ok":true}'));
        assert.deepEqual(result, { ok: true });
      });

      it("should return nothing when function throws", () => {
        const result = fromThrowable(() => JSON.parse("invalid"));
        assert.equal(isNothing(result), true);
      });
    });

    describe("fromPromise", () => {
      it("should return value when promise resolves", async () => {
        const result = await fromPromise(Promise.resolve("data"));
        assert.equal(result, "data");
      });

      it("should return nothing when promise rejects", async () => {
        const result = await fromPromise(Promise.reject("fail"));
        assert.equal(isNothing(result), true);
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      it("should transform Just value", () => {
        const result = map(5, (x) => x * 2);
        assert.equal(result, 10);
      });

      it("should not transform Nothing", () => {
        const result = map(null as Maybe<number>, (x) => x * 2);
        assert.equal(isNothing(result), true);
      });

      it("should change type", () => {
        const result = map(42, (x) => `num: ${x}`);
        assert.equal(result, "num: 42");
      });
    });

    describe("flatMap", () => {
      it("should chain on Just value returning Just", () => {
        const result = flatMap(5, (x) => x * 2);
        assert.equal(result, 10);
      });

      it("should chain on Just value returning Nothing", () => {
        const result = flatMap(0, (x) => (x > 0 ? x : nothing()));
        assert.equal(isNothing(result), true);
      });

      it("should not chain on Nothing", () => {
        const result = flatMap(null as Maybe<number>, (x) => x * 2);
        assert.equal(isNothing(result), true);
      });
    });

    describe("filter", () => {
      it("should keep value when predicate passes", () => {
        const result = filter(10, (x) => x > 5);
        assert.equal(result, 10);
      });

      it("should become nothing when predicate fails", () => {
        const result = filter(3, (x) => x > 5);
        assert.equal(isNothing(result), true);
      });

      it("should keep nothing", () => {
        const result = filter(null, (_x: number) => true);
        assert.equal(isNothing(result), true);
      });
    });

    describe("fold", () => {
      it("should call onJust for Just value", () => {
        const result = fold(5, () => 0, (x) => x * 2);
        assert.equal(result, 10);
      });

      it("should call onNothing for Nothing", () => {
        const result = fold(null, () => 0, (x: number) => x * 2);
        assert.equal(result, 0);
      });
    });

    describe("match", () => {
      it("should call some branch on Just", () => {
        const result = match(42, {
          just: (v) => `ok: ${v}`,
          nothing: () => "empty",
        });
        assert.equal(result, "ok: 42");
      });

      it("should call nothing branch on Nothing", () => {
        const result = match(null, {
          just: (v: number) => `ok: ${v}`,
          nothing: () => "empty",
        });
        assert.equal(result, "empty");
      });
    });
  });

  describe("Extract", () => {
    describe("getOrElse", () => {
      it("should return Just value", () => {
        assert.equal(getOrElse(42, 0), 42);
      });

      it("should return default for Nothing (null)", () => {
        assert.equal(getOrElse(null, 42), 42);
      });

      it("should return default for Nothing (undefined)", () => {
        assert.equal(getOrElse(undefined, 42), 42);
      });
    });

    describe("getOrUndefined", () => {
      it("should return Just value", () => {
        assert.equal(getOrUndefined(42), 42);
      });

      it("should return undefined for Nothing", () => {
        assert.equal(getOrUndefined(null), undefined);
      });
    });

    describe("getOrNull", () => {
      it("should return Just value", () => {
        assert.equal(getOrNull(42), 42);
      });

      it("should return null for Nothing", () => {
        assert.equal(getOrNull(undefined), null);
      });
    });

    describe("getOrThrow", () => {
      it("should return Just value", () => {
        assert.equal(getOrThrow(42), 42);
      });

      it("should throw for Nothing (null)", () => {
        assert.throws(() => getOrThrow(null), "Maybe is nothing");
      });

      it("should throw for Nothing (undefined)", () => {
        assert.throws(() => getOrThrow(undefined), "Maybe is nothing");
      });
    });

    describe("unwrap", () => {
      it("should return Just value as-is", () => {
        assert.equal(unwrap(42), 42);
      });

      it("should work with objects", () => {
        const obj = { a: 1 };
        assert.equal(unwrap(obj), obj);
      });

      it("should work with strings", () => {
        assert.equal(unwrap("hello"), "hello");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      it("should combine two Justs", () => {
        const result = zip(1, "a");
        assert.deepEqual(result, [1, "a"]);
      });

      it("should return Nothing if first is Nothing", () => {
        const result = zip(null, 1);
        assert.equal(isNothing(result), true);
      });

      it("should return Nothing if second is Nothing", () => {
        const result = zip(1, undefined);
        assert.equal(isNothing(result), true);
      });
    });

    describe("apply", () => {
      it("should apply function to Just value", () => {
        const fn: Maybe<(x: number) => number> = (x) => x * 2;
        const result = apply(fn, 10);
        assert.equal(result, 20);
      });

      it("should return Nothing if fn is Nothing", () => {
        const result = apply(null as Maybe<(x: number) => number>, 10);
        assert.equal(isNothing(result), true);
      });

      it("should return Nothing if arg is Nothing", () => {
        const fn: Maybe<(x: number) => number> = (x) => x * 2;
        const result = apply(fn, null);
        assert.equal(isNothing(result), true);
      });
    });

    describe("orElse", () => {
      it("should return first if Just", () => {
        const result = orElse(42, 99);
        assert.equal(result, 42);
      });

      it("should return second if first is Nothing", () => {
        const result = orElse(null, 42);
        assert.equal(result, 42);
      });

      it("should return Nothing if both are Nothing", () => {
        assert.equal(isNothing(orElse(null, undefined)), true);
      });
    });

    describe("tap", () => {
      it("should call side effect on Just", () => {
        let sideEffect = 0;
        const result = tap(42, (x) => {
          sideEffect = x;
        });
        assert.equal(sideEffect, 42);
        assert.equal(result, 42);
      });

      it("should not call side effect on Nothing", () => {
        let sideEffect = 0;
        tap(null as Maybe<number>, (_x) => {
          sideEffect = 99;
        });
        assert.equal(sideEffect, 0);
      });
    });
  });

  describe("Namespace (Maybe.*)", () => {
    it("Maybe.just should work like just", () => {
      assert.equal(Maybe.just(42), 42);
    });

    it("Maybe.nothing should work like nothing", () => {
      assert.equal(Maybe.nothing(), undefined);
    });

    it("Maybe.isJust should work like isJust", () => {
      assert.equal(Maybe.isJust(42), true);
      assert.equal(Maybe.isJust(null), false);
    });

    it("Maybe.isNothing should work like isNothing", () => {
      assert.equal(Maybe.isNothing(null), true);
      assert.equal(Maybe.isNothing(42), false);
    });

    it("Maybe.fromNullable should work", () => {
      assert.equal(Maybe.fromNullable("hello"), "hello");
      assert.equal(isNothing(Maybe.fromNullable(null)), true);
    });

    it("Maybe.map should work", () => {
      assert.equal(Maybe.map(5, (x: number) => x * 2), 10);
    });

    it("Maybe.fold should work", () => {
      const r = Maybe.fold(5, () => 0, (x: number) => x * 2);
      assert.equal(r, 10);
    });

    it("Maybe.new should work like fromNullable", () => {
      assert.equal(Maybe.new("hello"), "hello");
      assert.equal(isNothing(Maybe.new(null)), true);
    });
  });
});

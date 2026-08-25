import { describe, it, assert } from "./utils";
import {
  left,
  right,
  isLeft,
  isRight,
  fromNullable,
  fromThrowable,
  fromPromise,
  toPromise,
  map,
  mapLeft,
  bimap,
  flatMap,
  filter,
  fold,
  match,
  recover,
  swap,
  lft,
  rgt,
  getOrElse,
  getOrNull,
  getOrUndefined,
  getOrThrow,
  zip,
  apply,
  orElse,
  tap,
  tapLeft,
  all,
  flatten,
  partition,
  Either,
} from "../src/Either";

describe("Either", () => {
  describe("Constructors", () => {
    describe("left", () => {
      it("should create a Left with the given value", () => {
        const result = left("error");
        assert.equal(result.$, "Left");
        assert.equal(lft(result), "error");
      });

      it("should work with numbers", () => {
        const result = left(42);
        assert.equal(lft(result), 42);
      });

      it("should work with objects", () => {
        const obj = { message: "fail" };
        const result = left(obj);
        assert.deepEqual(lft(result), obj);
      });
    });

    describe("right", () => {
      it("should create a Right with the given value", () => {
        const result = right(100);
        assert.equal(result.$, "Right");
        assert.equal(rgt(result), 100);
      });

      it("should work with strings", () => {
        const result = right("success");
        assert.equal(rgt(result), "success");
      });

      it("should work with objects", () => {
        const obj = { data: [1, 2, 3] };
        const result = right(obj);
        assert.deepEqual(rgt(result), obj);
      });
    });
  });

  describe("Guards", () => {
    describe("isLeft", () => {
      it("should return true for Left", () => {
        assert.equal(isLeft(left("error")), true);
      });

      it("should return false for Right", () => {
        assert.equal(isLeft(right(42)), false);
      });
    });

    describe("isRight", () => {
      it("should return true for Right", () => {
        assert.equal(isRight(right(42)), true);
      });

      it("should return false for Left", () => {
        assert.equal(isRight(left("error")), false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      it("should return Right for non-null value", () => {
        const result = fromNullable(42, "was null");
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 42);
      });

      it("should return Left for null", () => {
        const result = fromNullable(null, "was null");
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "was null");
      });

      it("should return Left for undefined", () => {
        const result = fromNullable(undefined, "was undefined");
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "was undefined");
      });
    });

    describe("fromThrowable", () => {
      it("should return Right when function succeeds", () => {
        const result = fromThrowable(
          () => JSON.parse('{"ok":true}'),
          (e) => `Parse error: ${(e as Error).message}`,
        );
        assert.equal(isRight(result), true);
        assert.deepEqual(getOrThrow(result), { ok: true });
      });

      it("should return Left when function throws", () => {
        const result = fromThrowable(
          () => JSON.parse("invalid"),
          (e) => `Parse error: ${(e as Error).message}`,
        );
        assert.equal(isLeft(result), true);
        assert.ok(getOrThrow(swap(result)).includes("Parse error"));
      });

      it("should return Left with custom error object", () => {
        const result = fromThrowable(
          () => {
            throw new Error("boom");
          },
          () => ({ code: 500, msg: "boom" }),
        );
        assert.equal(isLeft(result), true);
        assert.deepEqual(getOrThrow(swap(result)), { code: 500, msg: "boom" });
      });
    });

    describe("fromPromise", () => {
      it("should return Right when promise resolves", async () => {
        const result = await fromPromise(
          Promise.resolve("data"),
          (e) => `Error: ${String(e)}`,
        );
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), "data");
      });

      it("should return Left when promise rejects", async () => {
        const result = await fromPromise(
          Promise.reject("fail"),
          (e) => `Error: ${String(e)}`,
        );
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "Error: fail");
      });
    });

    describe("toPromise", () => {
      it("should resolve with Right value", async () => {
        const result = await toPromise(right(42));
        assert.equal(result, 42);
      });

      it("should reject with Left value", async () => {
        try {
          await toPromise(left("error"));
          assert.equal(false, true);
        } catch (e) {
          assert.equal(e, "error");
        }
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      it("should transform Right value", () => {
        const result = map(right(5), (x) => x * 2);
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 10);
      });

      it("should not transform Left value", () => {
        const result = map(left("error") as Either<string, number>, (x: number) => x * 2);
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "error");
      });

      it("should change the type of Right value", () => {
        const result = map(right(42), (x) => `num: ${x}`);
        assert.equal(getOrThrow(result), "num: 42");
      });
    });

    describe("mapLeft", () => {
      it("should transform Left value", () => {
        const result = mapLeft(left("err"), (x) => x.toUpperCase());
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "ERR");
      });

      it("should not transform Right value", () => {
        const result = mapLeft(right<number>(42), (x: string) => x.toUpperCase());
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 42);
      });
    });

    describe("bimap", () => {
      it("should apply left fn on Left", () => {
        const result = bimap(
          left("err"),
          (l: string) => l.toUpperCase(),
          (r: number) => r * 2,
        );
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "ERR");
      });

      it("should apply right fn on Right", () => {
        const result = bimap(
          right(5),
          (l: string) => l.toUpperCase(),
          (r: number) => r * 2,
        );
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 10);
      });
    });

    describe("flatMap", () => {
      it("should chain on Right value", () => {
        const result = flatMap(right(5), (x) => right(x * 2));
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 10);
      });

      it("should not chain on Left value", () => {
        const result = flatMap(left("error") as Either<string, number>, (x: number) =>
          right(x * 2),
        );
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "error");
      });

      it("should allow switching from Right to Left", () => {
        const result = flatMap(right(0), (x: number): Either<string, number> =>
          x > 0 ? right(x) : left("non-positive"),
        );
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "non-positive");
      });
    });

    describe("filter", () => {
      it("should keep Right when predicate passes", () => {
        const result = filter(right(10), (x) => x > 5, "too small");
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 10);
      });

      it("should become Left when predicate fails", () => {
        const result = filter(right(3), (x) => x > 5, "too small");
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "too small");
      });

      it("should keep Left unchanged", () => {
        const result = filter(left("original"), (_x: unknown) => true, "ignored");
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "original");
      });
    });

    describe("fold", () => {
      it("should call onRight for Right value", () => {
        const result = fold(
          right(5),
          (l) => `left: ${l}`,
          (r) => `right: ${r}`,
        );
        assert.equal(result, "right: 5");
      });

      it("should call onLeft for Left value", () => {
        const result = fold(
          left("err"),
          (l: string) => `left: ${l}`,
          (r: number) => `right: ${r}`,
        );
        assert.equal(result, "left: err");
      });

      it("should unify both branches to same type", () => {
        const result = fold(
          right(10),
          (_l: string) => 0,
          (r: number) => r * 2,
        );
        assert.equal(result, 20);
      });
    });

    describe("match", () => {
      it("should call right branch on Right", () => {
        const result = match(right(42), {
          right: (v) => `ok: ${v}`,
          left: (e) => `fail: ${e}`,
        });
        assert.equal(result, "ok: 42");
      });

      it("should call left branch on Left", () => {
        const result = match(left("error"), {
          right: (v: number) => `ok: ${v}`,
          left: (e: string) => `fail: ${e}`,
        });
        assert.equal(result, "fail: error");
      });
    });

    describe("recover", () => {
      it("should recover Left into Right", () => {
        const result = recover(left("error"), (_e: string) => 42);
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 42);
      });

      it("should not change Right value", () => {
        const result = recover(right(10), (_e: string) => 99);
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), 10);
      });

      it("should use Left value in recovery fn", () => {
        const result = recover(left(5), (e: number) => e * 10);
        assert.equal(getOrThrow(result), 50);
      });
    });

    describe("swap", () => {
      it("should swap Left to Right", () => {
        const result = swap(left("error"));
        assert.equal(isRight(result), true);
        assert.equal(getOrThrow(result), "error");
      });

      it("should swap Right to Left", () => {
        const result = swap(right(42));
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), 42);
      });

      it("double swap returns original", () => {
        const original = left("error");
        const swapped = swap(swap(original));
        assert.equal(getOrThrow(swap(swapped)), "error");
      });
    });
  });

  describe("Extract", () => {
    describe("lft", () => {
      it("should extract value from Left", () => {
        assert.equal(lft(left("error")), "error");
      });
    });

    describe("rgt", () => {
      it("should extract value from Right", () => {
        assert.equal(rgt(right(42)), 42);
      });
    });

    describe("getOrElse", () => {
      it("should return Right value", () => {
        assert.equal(getOrElse(right(42), 0), 42);
      });

      it("should return default for Left", () => {
        assert.equal(getOrElse(left("error"), 42), 42);
      });
    });

    describe("getOrNull", () => {
      it("should return Right value", () => {
        assert.equal(getOrNull(right(42)), 42);
      });

      it("should return null for Left", () => {
        assert.equal(getOrNull(left("error")), null);
      });
    });

    describe("getOrUndefined", () => {
      it("should return Right value", () => {
        assert.equal(getOrUndefined(right(42)), 42);
      });

      it("should return undefined for Left", () => {
        assert.equal(getOrUndefined(left("error")), undefined);
      });
    });

    describe("getOrThrow", () => {
      it("should return Right value", () => {
        assert.equal(getOrThrow(right(42)), 42);
      });

      it("should throw for Left with string", () => {
        assert.throws(() => getOrThrow(left("error message")), "error message",);
      });

      it("should throw for Left with Error instance", () => {
        const err = new TypeError("type error");
        assert.throws(() => getOrThrow(left(err)), "type error");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      it("should combine two Rights", () => {
        const result = zip(right(1), right("a"));
        assert.equal(isRight(result), true);
        assert.deepEqual(getOrThrow(result), [1, "a"]);
      });

      it("should return first Left if first is Left", () => {
        const result = zip(left("error1"), right(1));
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "error1");
      });

      it("should return second Left if second is Left", () => {
        const result = zip(right(1), left("error2"));
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "error2");
      });
    });

    describe("apply", () => {
      it("should apply function to value when both are Right", () => {
        const fn: Either<string, (x: number) => string> = right((x: number) => `val: ${x}`);
        const result = apply(fn, right(10));
        assert.equal(getOrThrow(result), "val: 10");
      });

      it("should return Left if fn is Left", () => {
        const fn: Either<string, (x: number) => string> = left("error");
        const result = apply(fn, right(10));
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "error");
      });

      it("should return Left if arg is Left", () => {
        const fn: Either<string, (x: number) => string> = right((x: number) => `val: ${x}`);
        const result = apply(fn, left("error"));
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "error");
      });
    });

    describe("orElse", () => {
      it("should return first if Right", () => {
        const result = orElse(right(42), left("fallback"));
        assert.equal(getOrThrow(result), 42);
      });

      it("should return second if first is Left", () => {
        const result = orElse(left("error"), right(42));
        assert.equal(getOrThrow(result), 42);
      });

      it("should return second Left if both are Left", () => {
        const result = orElse(left("first"), left("second"));
        assert.equal(getOrThrow(swap(result)), "second");
      });
    });

    describe("tap", () => {
      it("should call side effect on Right", () => {
        let sideEffect = 0;
        const result = tap(right(42), (x) => {
          sideEffect = x;
        });
        assert.equal(sideEffect, 42);
        assert.equal(getOrThrow(result), 42);
      });

      it("should not call side effect on Left", () => {
        let sideEffect = 0;
        tap(left("error"), (_x: number) => {
          sideEffect = 99;
        });
        assert.equal(sideEffect, 0);
      });
    });

    describe("tapLeft", () => {
      it("should call side effect on Left", () => {
        let sideEffect = "";
        tapLeft(left("error"), (x) => {
          sideEffect = x;
        });
        assert.equal(sideEffect, "error");
      });

      it("should not call side effect on Right", () => {
        let sideEffect = "";
        tapLeft(right(42), (_x: string) => {
          sideEffect = "changed";
        });
        assert.equal(sideEffect, "");
      });
    });
  });

  describe("Collection", () => {
    describe("all", () => {
      it("should collect all Right values", () => {
        const result = all([right(1), right(2), right(3)]);
        assert.equal(isRight(result), true);
        assert.deepEqual(getOrThrow(result), [1, 2, 3]);
      });

      it("should return first Left encountered", () => {
        const result = all([right(1), left("error"), right(3)]);
        assert.equal(isLeft(result), true);
        assert.equal(getOrThrow(swap(result)), "error");
      });

      it("should work with empty array", () => {
        const result = all([]);
        assert.equal(isRight(result), true);
        assert.deepEqual(getOrThrow(result), []);
      });
    });

    describe("flatten", () => {
      it("should flatten Right-Right to Right", () => {
        const nested: Either<string, Either<string, number>> = right(right(42));
        const result = flatten(nested);
        assert.equal(getOrThrow(result), 42);
      });

      it("should flatten Right-Left to Left", () => {
        const nested: Either<string, Either<string, number>> = right(
          left("inner error"),
        );
        const result = flatten(nested);
        assert.equal(getOrThrow(swap(result)), "inner error");
      });

      it("should keep Left unchanged", () => {
        const nested: Either<string, Either<string, number>> = left("outer error");
        const result = flatten(nested);
        assert.equal(getOrThrow(swap(result)), "outer error");
      });
    });

    describe("partition", () => {
      it("should separate rights and lefts", () => {
        const result = partition([
          right(1),
          left("a"),
          right(2),
          left("b"),
          right(3),
        ]);
        assert.deepEqual(result.right, [1, 2, 3]);
        assert.deepEqual(result.left, ["a", "b"]);
      });

      it("should return empty arrays for empty input", () => {
        const result = partition([]);
        assert.deepEqual(result.right, []);
        assert.deepEqual(result.left, []);
      });

      it("should put all in right when only Rights", () => {
        const result = partition([right(1), right(2)]);
        assert.deepEqual(result.right, [1, 2]);
        assert.deepEqual(result.left, []);
      });

      it("should put all in left when only Lefts", () => {
        const result = partition([left("a"), left("b")]);
        assert.deepEqual(result.right, []);
        assert.deepEqual(result.left, ["a", "b"]);
      });
    });
  });

  describe("Namespace (Either.*)", () => {
    it("Either.left should work like left", () => {
      const result = Either.left("error");
      assert.equal(isLeft(result), true);
      assert.equal(getOrThrow(swap(result)), "error");
    });

    it("Either.right should work like right", () => {
      const result = Either.right(42);
      assert.equal(rgt(result), 42);
    });

    it("Either.isLeft should work like isLeft", () => {
      assert.equal(Either.isLeft(left("err")), true);
      assert.equal(Either.isLeft(right(1)), false);
    });

    it("Either.isRight should work like isRight", () => {
      assert.equal(Either.isRight(right(1)), true);
      assert.equal(Either.isRight(left("err")), false);
    });

    it("Either.fromNullable should work", () => {
      const result = Either.fromNullable("hello", "was null");
      assert.equal(getOrThrow(result), "hello");
    });

    it("Either.map should work", () => {
      const result = Either.map(right(5), (x: number) => x * 2);
      assert.equal(getOrThrow(result), 10);
    });

    it("Either.fold should work", () => {
      const result = Either.fold(
        right(5),
        (l: string) => 0,
        (r: number) => r * 2,
      );
      assert.equal(result, 10);
    });

    it("Either.all should work", () => {
      const result = Either.all([right(1), right(2)]);
      assert.deepEqual(getOrThrow(result), [1, 2]);
    });

    it("Either.chain should work like flatMap", () => {
      const result = Either.chain(right(5), (x: number) => right(x * 3));
      assert.equal(getOrThrow(result), 15);
    });
  });
});

import { describe, test, expect } from "./utils";
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
      test("should create a Left with the given value", () => {
        const result = left("error");
        expect(result.$).toBe("Left");
        expect(lft(result)).toBe("error");
      });

      test("should work with numbers", () => {
        const result = left(42);
        expect(lft(result)).toBe(42);
      });

      test("should work with objects", () => {
        const obj = { message: "fail" };
        const result = left(obj);
        expect(lft(result)).toEqual(obj);
      });
    });

    describe("right", () => {
      test("should create a Right with the given value", () => {
        const result = right(100);
        expect(result.$).toBe("Right");
        expect(rgt(result)).toBe(100);
      });

      test("should work with strings", () => {
        const result = right("success");
        expect(rgt(result)).toBe("success");
      });

      test("should work with objects", () => {
        const obj = { data: [1, 2, 3] };
        const result = right(obj);
        expect(rgt(result)).toEqual(obj);
      });
    });
  });

  describe("Guards", () => {
    describe("isLeft", () => {
      test("should return true for Left", () => {
        expect(isLeft(left("error"))).toBe(true);
      });

      test("should return false for Right", () => {
        expect(isLeft(right(42))).toBe(false);
      });
    });

    describe("isRight", () => {
      test("should return true for Right", () => {
        expect(isRight(right(42))).toBe(true);
      });

      test("should return false for Left", () => {
        expect(isRight(left("error"))).toBe(false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      test("should return Right for non-null value", () => {
        const result = fromNullable(42, "was null");
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(42);
      });

      test("should return Left for null", () => {
        const result = fromNullable(null, "was null");
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("was null");
      });

      test("should return Left for undefined", () => {
        const result = fromNullable(undefined, "was undefined");
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("was undefined");
      });
    });

    describe("fromThrowable", () => {
      test("should return Right when function succeeds", () => {
        const result = fromThrowable(
          () => JSON.parse('{"ok":true}'),
          (e) => `Parse error: ${(e as Error).message}`,
        );
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toEqual({ ok: true });
      });

      test("should return Left when function throws", () => {
        const result = fromThrowable(
          () => JSON.parse("invalid"),
          (e) => `Parse error: ${(e as Error).message}`,
        );
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toContain("Parse error");
      });

      test("should return Left with custom error object", () => {
        const result = fromThrowable(
          () => {
            throw new Error("boom");
          },
          () => ({ code: 500, msg: "boom" }),
        );
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toEqual({ code: 500, msg: "boom" });
      });
    });

    describe("fromPromise", () => {
      test("should return Right when promise resolves", async () => {
        const result = await fromPromise(
          Promise.resolve("data"),
          (e) => `Error: ${String(e)}`,
        );
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe("data");
      });

      test("should return Left when promise rejects", async () => {
        const result = await fromPromise(
          Promise.reject("fail"),
          (e) => `Error: ${String(e)}`,
        );
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("Error: fail");
      });
    });

    describe("toPromise", () => {
      test("should resolve with Right value", async () => {
        const result = await toPromise(right(42));
        expect(result).toBe(42);
      });

      test("should reject with Left value", async () => {
        try {
          await toPromise(left("error"));
          expect(false).toBe(true);
        } catch (e) {
          expect(e).toBe("error");
        }
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      test("should transform Right value", () => {
        const result = map(right(5), (x) => x * 2);
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(10);
      });

      test("should not transform Left value", () => {
        const result = map(left("error") as Either<string, number>, (x: number) => x * 2);
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("error");
      });

      test("should change the type of Right value", () => {
        const result = map(right(42), (x) => `num: ${x}`);
        expect(getOrThrow(result)).toBe("num: 42");
      });
    });

    describe("mapLeft", () => {
      test("should transform Left value", () => {
        const result = mapLeft(left("err"), (x) => x.toUpperCase());
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("ERR");
      });

      test("should not transform Right value", () => {
        const result = mapLeft(right<number>(42), (x: string) => x.toUpperCase());
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(42);
      });
    });

    describe("bimap", () => {
      test("should apply left fn on Left", () => {
        const result = bimap(
          left("err"),
          (l: string) => l.toUpperCase(),
          (r: number) => r * 2,
        );
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("ERR");
      });

      test("should apply right fn on Right", () => {
        const result = bimap(
          right(5),
          (l: string) => l.toUpperCase(),
          (r: number) => r * 2,
        );
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(10);
      });
    });

    describe("flatMap", () => {
      test("should chain on Right value", () => {
        const result = flatMap(right(5), (x) => right(x * 2));
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(10);
      });

      test("should not chain on Left value", () => {
        const result = flatMap(left("error") as Either<string, number>, (x: number) =>
          right(x * 2),
        );
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("error");
      });

      test("should allow switching from Right to Left", () => {
        const result = flatMap(right(0), (x: number): Either<string, number> =>
          x > 0 ? right(x) : left("non-positive"),
        );
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("non-positive");
      });
    });

    describe("filter", () => {
      test("should keep Right when predicate passes", () => {
        const result = filter(right(10), (x) => x > 5, "too small");
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(10);
      });

      test("should become Left when predicate fails", () => {
        const result = filter(right(3), (x) => x > 5, "too small");
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("too small");
      });

      test("should keep Left unchanged", () => {
        const result = filter(left("original"), (_x: unknown) => true, "ignored");
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("original");
      });
    });

    describe("fold", () => {
      test("should call onRight for Right value", () => {
        const result = fold(
          right(5),
          (l) => `left: ${l}`,
          (r) => `right: ${r}`,
        );
        expect(result).toBe("right: 5");
      });

      test("should call onLeft for Left value", () => {
        const result = fold(
          left("err"),
          (l: string) => `left: ${l}`,
          (r: number) => `right: ${r}`,
        );
        expect(result).toBe("left: err");
      });

      test("should unify both branches to same type", () => {
        const result = fold(
          right(10),
          (_l: string) => 0,
          (r: number) => r * 2,
        );
        expect(result).toBe(20);
      });
    });

    describe("match", () => {
      test("should call right branch on Right", () => {
        const result = match(right(42), {
          right: (v) => `ok: ${v}`,
          left: (e) => `fail: ${e}`,
        });
        expect(result).toBe("ok: 42");
      });

      test("should call left branch on Left", () => {
        const result = match(left("error"), {
          right: (v: number) => `ok: ${v}`,
          left: (e: string) => `fail: ${e}`,
        });
        expect(result).toBe("fail: error");
      });
    });

    describe("recover", () => {
      test("should recover Left into Right", () => {
        const result = recover(left("error"), (_e: string) => 42);
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(42);
      });

      test("should not change Right value", () => {
        const result = recover(right(10), (_e: string) => 99);
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe(10);
      });

      test("should use Left value in recovery fn", () => {
        const result = recover(left(5), (e: number) => e * 10);
        expect(getOrThrow(result)).toBe(50);
      });
    });

    describe("swap", () => {
      test("should swap Left to Right", () => {
        const result = swap(left("error"));
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toBe("error");
      });

      test("should swap Right to Left", () => {
        const result = swap(right(42));
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe(42);
      });

      test("double swap returns original", () => {
        const original = left("error");
        const swapped = swap(swap(original));
        expect(getOrThrow(swap(swapped))).toBe("error");
      });
    });
  });

  describe("Extract", () => {
    describe("lft", () => {
      test("should extract value from Left", () => {
        expect(lft(left("error"))).toBe("error");
      });
    });

    describe("rgt", () => {
      test("should extract value from Right", () => {
        expect(rgt(right(42))).toBe(42);
      });
    });

    describe("getOrElse", () => {
      test("should return Right value", () => {
        expect(getOrElse(right(42), 0)).toBe(42);
      });

      test("should return default for Left", () => {
        expect(getOrElse(left("error"), 42)).toBe(42);
      });
    });

    describe("getOrNull", () => {
      test("should return Right value", () => {
        expect(getOrNull(right(42))).toBe(42);
      });

      test("should return null for Left", () => {
        expect(getOrNull(left("error"))).toBeNull();
      });
    });

    describe("getOrUndefined", () => {
      test("should return Right value", () => {
        expect(getOrUndefined(right(42))).toBe(42);
      });

      test("should return undefined for Left", () => {
        expect(getOrUndefined(left("error"))).toBeUndefined();
      });
    });

    describe("getOrThrow", () => {
      test("should return Right value", () => {
        expect(getOrThrow(right(42))).toBe(42);
      });

      test("should throw for Left with string", () => {
        expect(() => getOrThrow(left("error message"))).toThrow(
          "error message",
        );
      });

      test("should throw for Left with Error instance", () => {
        const err = new TypeError("type error");
        expect(() => getOrThrow(left(err))).toThrow("type error");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      test("should combine two Rights", () => {
        const result = zip(right(1), right("a"));
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toEqual([1, "a"]);
      });

      test("should return first Left if first is Left", () => {
        const result = zip(left("error1"), right(1));
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("error1");
      });

      test("should return second Left if second is Left", () => {
        const result = zip(right(1), left("error2"));
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("error2");
      });
    });

    describe("apply", () => {
      test("should apply function to value when both are Right", () => {
        const fn: Either<string, (x: number) => string> = right((x: number) => `val: ${x}`);
        const result = apply(fn, right(10));
        expect(getOrThrow(result)).toBe("val: 10");
      });

      test("should return Left if fn is Left", () => {
        const fn: Either<string, (x: number) => string> = left("error");
        const result = apply(fn, right(10));
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("error");
      });

      test("should return Left if arg is Left", () => {
        const fn: Either<string, (x: number) => string> = right((x: number) => `val: ${x}`);
        const result = apply(fn, left("error"));
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("error");
      });
    });

    describe("orElse", () => {
      test("should return first if Right", () => {
        const result = orElse(right(42), left("fallback"));
        expect(getOrThrow(result)).toBe(42);
      });

      test("should return second if first is Left", () => {
        const result = orElse(left("error"), right(42));
        expect(getOrThrow(result)).toBe(42);
      });

      test("should return second Left if both are Left", () => {
        const result = orElse(left("first"), left("second"));
        expect(getOrThrow(swap(result))).toBe("second");
      });
    });

    describe("tap", () => {
      test("should call side effect on Right", () => {
        let sideEffect = 0;
        const result = tap(right(42), (x) => {
          sideEffect = x;
        });
        expect(sideEffect).toBe(42);
        expect(getOrThrow(result)).toBe(42);
      });

      test("should not call side effect on Left", () => {
        let sideEffect = 0;
        tap(left("error"), (_x: number) => {
          sideEffect = 99;
        });
        expect(sideEffect).toBe(0);
      });
    });

    describe("tapLeft", () => {
      test("should call side effect on Left", () => {
        let sideEffect = "";
        tapLeft(left("error"), (x) => {
          sideEffect = x;
        });
        expect(sideEffect).toBe("error");
      });

      test("should not call side effect on Right", () => {
        let sideEffect = "";
        tapLeft(right(42), (_x: string) => {
          sideEffect = "changed";
        });
        expect(sideEffect).toBe("");
      });
    });
  });

  describe("Collection", () => {
    describe("all", () => {
      test("should collect all Right values", () => {
        const result = all([right(1), right(2), right(3)]);
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toEqual([1, 2, 3]);
      });

      test("should return first Left encountered", () => {
        const result = all([right(1), left("error"), right(3)]);
        expect(isLeft(result)).toBe(true);
        expect(getOrThrow(swap(result))).toBe("error");
      });

      test("should work with empty array", () => {
        const result = all([]);
        expect(isRight(result)).toBe(true);
        expect(getOrThrow(result)).toEqual([]);
      });
    });

    describe("flatten", () => {
      test("should flatten Right-Right to Right", () => {
        const nested: Either<string, Either<string, number>> = right(right(42));
        const result = flatten(nested);
        expect(getOrThrow(result)).toBe(42);
      });

      test("should flatten Right-Left to Left", () => {
        const nested: Either<string, Either<string, number>> = right(
          left("inner error"),
        );
        const result = flatten(nested);
        expect(getOrThrow(swap(result))).toBe("inner error");
      });

      test("should keep Left unchanged", () => {
        const nested: Either<string, Either<string, number>> = left("outer error");
        const result = flatten(nested);
        expect(getOrThrow(swap(result))).toBe("outer error");
      });
    });

    describe("partition", () => {
      test("should separate rights and lefts", () => {
        const result = partition([
          right(1),
          left("a"),
          right(2),
          left("b"),
          right(3),
        ]);
        expect(result.right).toEqual([1, 2, 3]);
        expect(result.left).toEqual(["a", "b"]);
      });

      test("should return empty arrays for empty input", () => {
        const result = partition([]);
        expect(result.right).toEqual([]);
        expect(result.left).toEqual([]);
      });

      test("should put all in right when only Rights", () => {
        const result = partition([right(1), right(2)]);
        expect(result.right).toEqual([1, 2]);
        expect(result.left).toEqual([]);
      });

      test("should put all in left when only Lefts", () => {
        const result = partition([left("a"), left("b")]);
        expect(result.right).toEqual([]);
        expect(result.left).toEqual(["a", "b"]);
      });
    });
  });

  describe("Namespace (Either.*)", () => {
    test("Either.left should work like left", () => {
      const result = Either.left("error");
      expect(isLeft(result)).toBe(true);
      expect(getOrThrow(swap(result))).toBe("error");
    });

    test("Either.right should work like right", () => {
      const result = Either.right(42);
      expect(rgt(result)).toBe(42);
    });

    test("Either.isLeft should work like isLeft", () => {
      expect(Either.isLeft(left("err"))).toBe(true);
      expect(Either.isLeft(right(1))).toBe(false);
    });

    test("Either.isRight should work like isRight", () => {
      expect(Either.isRight(right(1))).toBe(true);
      expect(Either.isRight(left("err"))).toBe(false);
    });

    test("Either.fromNullable should work", () => {
      const result = Either.fromNullable("hello", "was null");
      expect(getOrThrow(result)).toBe("hello");
    });

    test("Either.map should work", () => {
      const result = Either.map(right(5), (x: number) => x * 2);
      expect(getOrThrow(result)).toBe(10);
    });

    test("Either.fold should work", () => {
      const result = Either.fold(
        right(5),
        (l: string) => 0,
        (r: number) => r * 2,
      );
      expect(result).toBe(10);
    });

    test("Either.all should work", () => {
      const result = Either.all([right(1), right(2)]);
      expect(getOrThrow(result)).toEqual([1, 2]);
    });

    test("Either.chain should work like flatMap", () => {
      const result = Either.chain(right(5), (x: number) => right(x * 3));
      expect(getOrThrow(result)).toBe(15);
    });
  });
});

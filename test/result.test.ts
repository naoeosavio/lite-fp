import { describe, test, expect } from "./utils";
import {
  done,
  fail,
  Ok,
  Err,
  isDone,
  isFail,
  isOk,
  isErr,
  fromNullable,
  fromThrowable,
  fromPromise,
  toPromise,
  map,
  mapFail,
  bimap,
  flatMap,
  filter,
  fold,
  match,
  recover,
  swap,
  val,
  err,
  getOrElse,
  getOrNull,
  getOrUndefined,
  getOrThrow,
  zip,
  apply,
  orElse,
  tap,
  tapFail,
  all,
  flatten,
  partition,
  Result,
} from "../src/Result";

describe("Result", () => {
  describe("Constructors", () => {
    describe("done", () => {
      test("should create a Done with the given value", () => {
        const r = done(42);
        expect(isDone(r)).toBe(true);
        expect(val(r)).toBe(42);
      });

      test("should work with strings", () => {
        const r = done("success");
        expect(val(r)).toBe("success");
      });

      test("should work with objects", () => {
        const obj = { name: "test" };
        const r = done(obj);
        expect(val(r)).toEqual(obj);
      });
    });

    describe("fail", () => {
      test("should create a Fail with the given error", () => {
        const r = fail("error");
        expect(isFail(r)).toBe(true);
        expect(err(r)).toBe("error");
      });

      test("should work with Error instances", () => {
        const e = new Error("boom");
        const r = fail(e);
        expect(err(r)).toBe(e);
      });
    });

    describe("Ok (alias)", () => {
      test("should create a Done", () => {
        const r = Ok(42);
        expect(isOk(r)).toBe(true);
        expect(val(r)).toBe(42);
      });
    });

    describe("Err (alias)", () => {
      test("should create a Fail", () => {
        const r = Err("error");
        expect(isErr(r)).toBe(true);
        expect(err(r)).toBe("error");
      });
    });
  });

  describe("Guards", () => {
    describe("isDone", () => {
      test("should return true for Done", () => {
        expect(isDone(done(42))).toBe(true);
      });

      test("should return false for Fail", () => {
        expect(isDone(fail("error"))).toBe(false);
      });
    });

    describe("isFail", () => {
      test("should return true for Fail", () => {
        expect(isFail(fail("error"))).toBe(true);
      });

      test("should return false for Done", () => {
        expect(isFail(done(42))).toBe(false);
      });
    });

    describe("isOk", () => {
      test("should be alias for isDone", () => {
        expect(isOk(done(42))).toBe(true);
        expect(isOk(fail("error"))).toBe(false);
      });
    });

    describe("isErr", () => {
      test("should be alias for isFail", () => {
        expect(isErr(fail("error"))).toBe(true);
        expect(isErr(done(42))).toBe(false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      test("should return Done for non-null value", () => {
        const r = fromNullable(42, "was null");
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(42);
      });

      test("should return Fail for null", () => {
        const r = fromNullable(null, "was null");
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("was null");
      });

      test("should return Fail for undefined", () => {
        const r = fromNullable(undefined, "was undefined");
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("was undefined");
      });
    });

    describe("fromThrowable", () => {
      test("should return Done when function succeeds", () => {
        const r = fromThrowable(() => 42, (e) => `Error: ${String(e)}`);
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(42);
      });

      test("should return Fail when function throws", () => {
        const r = fromThrowable(
          () => {
            throw new Error("boom");
          },
          (e) => `Error: ${(e as Error).message}`,
        );
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("Error: boom");
      });
    });

    describe("fromPromise", () => {
      test("should return Done when promise resolves", async () => {
        const r = await fromPromise(
          Promise.resolve("data"),
          (e) => `Error: ${String(e)}`,
        );
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe("data");
      });

      test("should return Fail when promise rejects", async () => {
        const r = await fromPromise(
          Promise.reject("fail"),
          (e) => `Error: ${String(e)}`,
        );
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("Error: fail");
      });
    });

    describe("toPromise", () => {
      test("should resolve with Done value", async () => {
        const value = await toPromise(done(42));
        expect(value).toBe(42);
      });

      test("should reject with Fail error", async () => {
        try {
          await toPromise(fail("error"));
          expect(false).toBe(true);
        } catch (e) {
          expect(e).toBe("error");
        }
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      test("should transform Done value", () => {
        const r = map(done(5), (x) => x * 2);
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(10);
      });

      test("should not transform Fail", () => {
        const r = map(fail("error"), (x: number) => x * 2);
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("error");
      });
    });

    describe("mapFail", () => {
      test("should transform Fail error", () => {
        const r = mapFail(fail("err"), (x) => x.toUpperCase());
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("ERR");
      });

      test("should not transform Done", () => {
        const r = mapFail(done(42), (x: string) => x.toUpperCase());
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(42);
      });
    });

    describe("bimap", () => {
      test("should apply done fn on Done", () => {
        const r = bimap(
          done(5),
          (v: number) => v * 2,
          (e: string) => e.toUpperCase(),
        );
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(10);
      });

      test("should apply fail fn on Fail", () => {
        const r = bimap(
          fail("err"),
          (v: number) => v * 2,
          (e: string) => e.toUpperCase(),
        );
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("ERR");
      });
    });

    describe("flatMap", () => {
      test("should chain on Done", () => {
        const r = flatMap(done(5), (x: number) => done(x * 2));
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(10);
      });

      test("should not chain on Fail", () => {
        const r = flatMap(fail("error"), (x: number) => done(x * 2));
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("error");
      });

      test("should allow switching Done to Fail", () => {
        const r = flatMap(done(0), (x: number) => (x > 0 ? done(x) : fail("non-positive")));
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("non-positive");
      });
    });

    describe("filter", () => {
      test("should keep Done when predicate passes", () => {
        const r = filter(done(10), (x) => x > 5, "too small");
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(10);
      });

      test("should become Fail when predicate fails", () => {
        const r = filter(done(3), (x) => x > 5, "too small");
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("too small");
      });

      test("should keep Fail unchanged", () => {
        const r = filter(fail("original"), (_x: number) => true, "ignored");
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("original");
      });
    });

    describe("fold", () => {
      test("should call onDone for Done", () => {
        const r = fold(done(5), (e) => `fail: ${e}`, (v) => `done: ${v}`);
        expect(r).toBe("done: 5");
      });

      test("should call onFail for Fail", () => {
        const r = fold(fail("err"), (e: string) => `fail: ${e}`, (v: number) => `done: ${v}`);
        expect(r).toBe("fail: err");
      });
    });

    describe("match", () => {
      test("should call done branch on Done", () => {
        const r = match(done(42), {
          done: (v) => `ok: ${v}`,
          fail: (e) => `fail: ${e}`,
        });
        expect(r).toBe("ok: 42");
      });

      test("should call fail branch on Fail", () => {
        const r = match(fail("err"), {
          done: (v: number) => `ok: ${v}`,
          fail: (e: string) => `fail: ${e}`,
        });
        expect(r).toBe("fail: err");
      });
    });

    describe("recover", () => {
      test("should recover Fail into Done", () => {
        const r = recover(fail("error"), (_e: string) => 42);
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(42);
      });

      test("should not change Done", () => {
        const r = recover(done(10), (_e: string) => 99);
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(10);
      });
    });

    describe("swap", () => {
      test("should swap Done to Fail", () => {
        const r = swap(done(42));
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe(42);
      });

      test("should swap Fail to Done", () => {
        const r = swap(fail("error"));
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe("error");
      });

      test("double swap returns original", () => {
        const r = swap(swap(done(42)));
        expect(getOrThrow(r)).toBe(42);
      });
    });
  });

  describe("Extract", () => {
    describe("val", () => {
      test("should extract value from Done", () => {
        expect(val(done(42))).toBe(42);
      });
    });

    describe("err", () => {
      test("should extract error from Fail", () => {
        expect(err(fail("error"))).toBe("error");
      });
    });

    describe("getOrElse", () => {
      test("should return Done value", () => {
        expect(getOrElse(done(42), 0)).toBe(42);
      });

      test("should return default for Fail", () => {
        expect(getOrElse(fail("error"), 42)).toBe(42);
      });
    });

    describe("getOrNull", () => {
      test("should return Done value", () => {
        expect(getOrNull(done(42))).toBe(42);
      });

      test("should return null for Fail", () => {
        expect(getOrNull(fail("error"))).toBeNull();
      });
    });

    describe("getOrUndefined", () => {
      test("should return Done value", () => {
        expect(getOrUndefined(done(42))).toBe(42);
      });

      test("should return undefined for Fail", () => {
        expect(getOrUndefined(fail("error"))).toBeUndefined();
      });
    });

    describe("getOrThrow", () => {
      test("should return Done value", () => {
        expect(getOrThrow(done(42))).toBe(42);
      });

      test("should throw for Fail with string", () => {
        expect(() => getOrThrow(fail("error message"))).toThrow("error message");
      });

      test("should throw for Fail with Error instance", () => {
        const e = new TypeError("type error");
        expect(() => getOrThrow(fail(e))).toThrow("type error");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      test("should combine two Dones", () => {
        const r = zip(done(1), done("a"));
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toEqual([1, "a"]);
      });

      test("should return first Fail if first fails", () => {
        const r = zip(fail("error1"), done(1));
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("error1");
      });

      test("should return second Fail if second fails", () => {
        const r = zip(done(1), fail("error2"));
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("error2");
      });
    });

    describe("apply", () => {
      test("should apply function to Done value", () => {
        const fn: Result<(x: number) => number, unknown> = done((x: number) => x * 2);
        const r = apply(fn, done(10));
        expect(getOrThrow(r)).toBe(20);
      });

      test("should return Fail if fn is Fail", () => {
        const r = apply(fail("error"), done(10));
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("error");
      });

      test("should return Fail if arg is Fail", () => {
        const fn: Result<(x: number) => number, unknown> = done((x: number) => x * 2);
        const r = apply(fn, fail("error"));
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("error");
      });
    });

    describe("orElse", () => {
      test("should return first if Done", () => {
        const r = orElse(done(42), fail("fallback"));
        expect(getOrThrow(r)).toBe(42);
      });

      test("should return second if first is Fail", () => {
        const r = orElse(fail("error"), done(42));
        expect(getOrThrow(r)).toBe(42);
      });

      test("should return second Fail if both Fail", () => {
        const r = orElse(fail("first"), fail("second"));
        expect(getOrThrow(swap(r))).toBe("second");
      });
    });

    describe("tap", () => {
      test("should call side effect on Done", () => {
        let sideEffect = 0;
        const r = tap(done(42), (x: number) => {
          sideEffect = x;
        });
        expect(sideEffect).toBe(42);
        expect(getOrThrow(r)).toBe(42);
      });

      test("should not call side effect on Fail", () => {
        let sideEffect = 0;
        tap(fail("error"), (_x: number) => {
          sideEffect = 99;
        });
        expect(sideEffect).toBe(0);
      });
    });

    describe("tapFail", () => {
      test("should call side effect on Fail", () => {
        let sideEffect = "";
        tapFail(fail("error"), (x: string) => {
          sideEffect = x;
        });
        expect(sideEffect).toBe("error");
      });

      test("should not call side effect on Done", () => {
        let sideEffect = "";
        tapFail(done(42), (_x: string) => {
          sideEffect = "changed";
        });
        expect(sideEffect).toBe("");
      });
    });
  });

  describe("Collection", () => {
    describe("all", () => {
      test("should collect all Done values", () => {
        const r = all([done(1), done(2), done(3)]);
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toEqual([1, 2, 3]);
      });

      test("should return first Fail encountered", () => {
        const r = all([done(1), fail("error"), done(3)]);
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("error");
      });

      test("should work with empty array", () => {
        const r = all([]);
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toEqual([]);
      });
    });

    describe("flatten", () => {
      test("should flatten Done-Done to Done", () => {
        const nested = done(done(42));
        const r = flatten(nested);
        expect(isDone(r)).toBe(true);
        expect(getOrThrow(r)).toBe(42);
      });

      test("should flatten Done-Fail to Fail", () => {
        const nested= done(fail("inner error"));
        const r = flatten(nested);
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("inner error");
      });

      test("should keep Fail unchanged", () => {
        const nested = fail("outer error");
        const r = flatten(nested);
        expect(isFail(r)).toBe(true);
        expect(getOrThrow(swap(r))).toBe("outer error");
      });
    });

    describe("partition", () => {
      test("should separate dones and fails", () => {
        const r = partition([done(1), fail("a"), done(2), fail("b")]);
        expect(r.done).toEqual([1, 2]);
        expect(r.fail).toEqual(["a", "b"]);
      });

      test("should return empty arrays for empty input", () => {
        const r = partition([]);
        expect(r.done).toEqual([]);
        expect(r.fail).toEqual([]);
      });

      test("should put all in done when only Dones", () => {
        const r = partition([done(1), done(2)]);
        expect(r.done).toEqual([1, 2]);
        expect(r.fail).toEqual([]);
      });
    });
  });

  describe("Namespace (Result.*)", () => {
    test("Result.done should work like done", () => {
      const r = Result.done(42);
      expect(val(r)).toBe(42);
    });

    test("Result.fail should work like fail", () => {
      expect(err(Result.fail("error"))).toBe("error");
    });

    test("Result.fromNullable should work", () => {
      const r = Result.fromNullable("hello", "was null");
      expect(getOrThrow(r)).toBe("hello");
    });

    test("Result.map should work", () => {
      const r = Result.map(done(5), (x: number) => x * 2);
      expect(getOrThrow(r)).toBe(10);
    });

    test("Result.fold should work", () => {
      const r = Result.fold(done(5), (e: string) => 0, (v: number) => v * 2);
      expect(r).toBe(10);
    });

    test("Result.all should work", () => {
      const r = Result.all([done(1), done(2)]);
      expect(getOrThrow(r)).toEqual([1, 2]);
    });

    test("Result.chain should work like flatMap", () => {
      const r = Result.chain(done(5), (x: number) => done(x * 3));
      expect(getOrThrow(r)).toBe(15);
    });

    test("Result.new should work like fromNullable", () => {
      expect(getOrThrow(Result.new("hello", "was null"))).toBe("hello");
    });

    test("Result.mapErr should work like mapFail", () => {
      const r = Result.mapErr(fail("err"), (x: string) => x.toUpperCase());
      expect(getOrThrow(swap(r))).toBe("ERR");
    });

    test("Result.tapErr should work like tapFail", () => {
      let sideEffect = "";
      Result.tapErr(fail("error"), (x: string) => {
        sideEffect = x;
      });
      expect(sideEffect).toBe("error");
    });
  });
});

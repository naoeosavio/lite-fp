import { describe, it, assert } from "./utils";
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
      it("should create a Done with the given value", () => {
        const r = done(42);
        assert.equal(isDone(r), true);
        assert.equal(val(r), 42);
      });

      it("should work with strings", () => {
        const r = done("success");
        assert.equal(val(r), "success");
      });

      it("should work with objects", () => {
        const obj = { name: "test" };
        const r = done(obj);
        assert.deepEqual(val(r), obj);
      });
    });

    describe("fail", () => {
      it("should create a Fail with the given error", () => {
        const r = fail("error");
        assert.equal(isFail(r), true);
        assert.equal(err(r), "error");
      });

      it("should work with Error instances", () => {
        const e = new Error("boom");
        const r = fail(e);
        assert.equal(err(r), e);
      });
    });

    describe("Ok (alias)", () => {
      it("should create a Done", () => {
        const r = Ok(42);
        assert.equal(isOk(r), true);
        assert.equal(val(r), 42);
      });
    });

    describe("Err (alias)", () => {
      it("should create a Fail", () => {
        const r = Err("error");
        assert.equal(isErr(r), true);
        assert.equal(err(r), "error");
      });
    });
  });

  describe("Guards", () => {
    describe("isDone", () => {
      it("should return true for Done", () => {
        assert.equal(isDone(done(42)), true);
      });

      it("should return false for Fail", () => {
        assert.equal(isDone(fail("error")), false);
      });
    });

    describe("isFail", () => {
      it("should return true for Fail", () => {
        assert.equal(isFail(fail("error")), true);
      });

      it("should return false for Done", () => {
        assert.equal(isFail(done(42)), false);
      });
    });

    describe("isOk", () => {
      it("should be alias for isDone", () => {
        assert.equal(isOk(done(42)), true);
        assert.equal(isOk(fail("error")), false);
      });
    });

    describe("isErr", () => {
      it("should be alias for isFail", () => {
        assert.equal(isErr(fail("error")), true);
        assert.equal(isErr(done(42)), false);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromNullable", () => {
      it("should return Done for non-null value", () => {
        const r = fromNullable(42, "was null");
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 42);
      });

      it("should return Fail for null", () => {
        const r = fromNullable(null, "was null");
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "was null");
      });

      it("should return Fail for undefined", () => {
        const r = fromNullable(undefined, "was undefined");
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "was undefined");
      });
    });

    describe("fromThrowable", () => {
      it("should return Done when function succeeds", () => {
        const r = fromThrowable(() => 42, (e) => `Error: ${String(e)}`);
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 42);
      });

      it("should return Fail when function throws", () => {
        const r = fromThrowable(
          () => {
            throw new Error("boom");
          },
          (e) => `Error: ${(e as Error).message}`,
        );
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "Error: boom");
      });
    });

    describe("fromPromise", () => {
      it("should return Done when promise resolves", async () => {
        const r = await fromPromise(
          Promise.resolve("data"),
          (e) => `Error: ${String(e)}`,
        );
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), "data");
      });

      it("should return Fail when promise rejects", async () => {
        const r = await fromPromise(
          Promise.reject("fail"),
          (e) => `Error: ${String(e)}`,
        );
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "Error: fail");
      });
    });

    describe("toPromise", () => {
      it("should resolve with Done value", async () => {
        const value = await toPromise(done(42));
        assert.equal(value, 42);
      });

      it("should reject with Fail error", async () => {
        try {
          await toPromise(fail("error"));
          assert.equal(false, true);
        } catch (e) {
          assert.equal(e, "error");
        }
      });
    });
  });

  describe("Operations", () => {
    describe("map", () => {
      it("should transform Done value", () => {
        const r = map(done(5), (x) => x * 2);
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 10);
      });

      it("should not transform Fail", () => {
        const r = map(fail("error"), (x: number) => x * 2);
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "error");
      });
    });

    describe("mapFail", () => {
      it("should transform Fail error", () => {
        const r = mapFail(fail("err"), (x) => x.toUpperCase());
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "ERR");
      });

      it("should not transform Done", () => {
        const r = mapFail(done(42), (x: string) => x.toUpperCase());
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 42);
      });
    });

    describe("bimap", () => {
      it("should apply done fn on Done", () => {
        const r = bimap(
          done(5),
          (v: number) => v * 2,
          (e: string) => e.toUpperCase(),
        );
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 10);
      });

      it("should apply fail fn on Fail", () => {
        const r = bimap(
          fail("err"),
          (v: number) => v * 2,
          (e: string) => e.toUpperCase(),
        );
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "ERR");
      });
    });

    describe("flatMap", () => {
      it("should chain on Done", () => {
        const r = flatMap(done(5), (x: number) => done(x * 2));
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 10);
      });

      it("should not chain on Fail", () => {
        const r = flatMap(fail("error"), (x: number) => done(x * 2));
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "error");
      });

      it("should allow switching Done to Fail", () => {
        const r = flatMap(done(0), (x: number) => (x > 0 ? done(x) : fail("non-positive")));
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "non-positive");
      });
    });

    describe("filter", () => {
      it("should keep Done when predicate passes", () => {
        const r = filter(done(10), (x) => x > 5, "too small");
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 10);
      });

      it("should become Fail when predicate fails", () => {
        const r = filter(done(3), (x) => x > 5, "too small");
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "too small");
      });

      it("should keep Fail unchanged", () => {
        const r = filter(fail("original"), (_x: number) => true, "ignored");
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "original");
      });
    });

    describe("fold", () => {
      it("should call onDone for Done", () => {
        const r = fold(done(5), (e) => `fail: ${e}`, (v) => `done: ${v}`);
        assert.equal(r, "done: 5");
      });

      it("should call onFail for Fail", () => {
        const r = fold(fail("err"), (e: string) => `fail: ${e}`, (v: number) => `done: ${v}`);
        assert.equal(r, "fail: err");
      });
    });

    describe("match", () => {
      it("should call done branch on Done", () => {
        const r = match(done(42), {
          done: (v) => `ok: ${v}`,
          fail: (e) => `fail: ${e}`,
        });
        assert.equal(r, "ok: 42");
      });

      it("should call fail branch on Fail", () => {
        const r = match(fail("err"), {
          done: (v: number) => `ok: ${v}`,
          fail: (e: string) => `fail: ${e}`,
        });
        assert.equal(r, "fail: err");
      });
    });

    describe("recover", () => {
      it("should recover Fail into Done", () => {
        const r = recover(fail("error"), (_e: string) => 42);
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 42);
      });

      it("should not change Done", () => {
        const r = recover(done(10), (_e: string) => 99);
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 10);
      });
    });

    describe("swap", () => {
      it("should swap Done to Fail", () => {
        const r = swap(done(42));
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), 42);
      });

      it("should swap Fail to Done", () => {
        const r = swap(fail("error"));
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), "error");
      });

      it("double swap returns original", () => {
        const r = swap(swap(done(42)));
        assert.equal(getOrThrow(r), 42);
      });
    });
  });

  describe("Extract", () => {
    describe("val", () => {
      it("should extract value from Done", () => {
        assert.equal(val(done(42)), 42);
      });
    });

    describe("err", () => {
      it("should extract error from Fail", () => {
        assert.equal(err(fail("error")), "error");
      });
    });

    describe("getOrElse", () => {
      it("should return Done value", () => {
        assert.equal(getOrElse(done(42), 0), 42);
      });

      it("should return default for Fail", () => {
        assert.equal(getOrElse(fail("error"), 42), 42);
      });
    });

    describe("getOrNull", () => {
      it("should return Done value", () => {
        assert.equal(getOrNull(done(42)), 42);
      });

      it("should return null for Fail", () => {
        assert.equal(getOrNull(fail("error")), null);
      });
    });

    describe("getOrUndefined", () => {
      it("should return Done value", () => {
        assert.equal(getOrUndefined(done(42)), 42);
      });

      it("should return undefined for Fail", () => {
        assert.equal(getOrUndefined(fail("error")), undefined);
      });
    });

    describe("getOrThrow", () => {
      it("should return Done value", () => {
        assert.equal(getOrThrow(done(42)), 42);
      });

      it("should throw for Fail with string", () => {
        assert.throws(() => getOrThrow(fail("error message")), "error message");
      });

      it("should throw for Fail with Error instance", () => {
        const e = new TypeError("type error");
        assert.throws(() => getOrThrow(fail(e)), "type error");
      });
    });
  });

  describe("Combine", () => {
    describe("zip", () => {
      it("should combine two Dones", () => {
        const r = zip(done(1), done("a"));
        assert.equal(isDone(r), true);
        assert.deepEqual(getOrThrow(r), [1, "a"]);
      });

      it("should return first Fail if first fails", () => {
        const r = zip(fail("error1"), done(1));
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "error1");
      });

      it("should return second Fail if second fails", () => {
        const r = zip(done(1), fail("error2"));
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "error2");
      });
    });

    describe("apply", () => {
      it("should apply function to Done value", () => {
        const fn: Result<(x: number) => number, unknown> = done((x: number) => x * 2);
        const r = apply(fn, done(10));
        assert.equal(getOrThrow(r), 20);
      });

      it("should return Fail if fn is Fail", () => {
        const r = apply(fail("error"), done(10));
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "error");
      });

      it("should return Fail if arg is Fail", () => {
        const fn: Result<(x: number) => number, unknown> = done((x: number) => x * 2);
        const r = apply(fn, fail("error"));
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "error");
      });
    });

    describe("orElse", () => {
      it("should return first if Done", () => {
        const r = orElse(done(42), fail("fallback"));
        assert.equal(getOrThrow(r), 42);
      });

      it("should return second if first is Fail", () => {
        const r = orElse(fail("error"), done(42));
        assert.equal(getOrThrow(r), 42);
      });

      it("should return second Fail if both Fail", () => {
        const r = orElse(fail("first"), fail("second"));
        assert.equal(getOrThrow(swap(r)), "second");
      });
    });

    describe("tap", () => {
      it("should call side effect on Done", () => {
        let sideEffect = 0;
        const r = tap(done(42), (x: number) => {
          sideEffect = x;
        });
        assert.equal(sideEffect, 42);
        assert.equal(getOrThrow(r), 42);
      });

      it("should not call side effect on Fail", () => {
        let sideEffect = 0;
        tap(fail("error"), (_x: number) => {
          sideEffect = 99;
        });
        assert.equal(sideEffect, 0);
      });
    });

    describe("tapFail", () => {
      it("should call side effect on Fail", () => {
        let sideEffect = "";
        tapFail(fail("error"), (x: string) => {
          sideEffect = x;
        });
        assert.equal(sideEffect, "error");
      });

      it("should not call side effect on Done", () => {
        let sideEffect = "";
        tapFail(done(42), (_x: string) => {
          sideEffect = "changed";
        });
        assert.equal(sideEffect, "");
      });
    });
  });

  describe("Collection", () => {
    describe("all", () => {
      it("should collect all Done values", () => {
        const r = all([done(1), done(2), done(3)]);
        assert.equal(isDone(r), true);
        assert.deepEqual(getOrThrow(r), [1, 2, 3]);
      });

      it("should return first Fail encountered", () => {
        const r = all([done(1), fail("error"), done(3)]);
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "error");
      });

      it("should work with empty array", () => {
        const r = all([]);
        assert.equal(isDone(r), true);
        assert.deepEqual(getOrThrow(r), []);
      });
    });

    describe("flatten", () => {
      it("should flatten Done-Done to Done", () => {
        const nested = done(done(42));
        const r = flatten(nested);
        assert.equal(isDone(r), true);
        assert.equal(getOrThrow(r), 42);
      });

      it("should flatten Done-Fail to Fail", () => {
        const nested= done(fail("inner error"));
        const r = flatten(nested);
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "inner error");
      });

      it("should keep Fail unchanged", () => {
        const nested = fail("outer error");
        const r = flatten(nested);
        assert.equal(isFail(r), true);
        assert.equal(getOrThrow(swap(r)), "outer error");
      });
    });

    describe("partition", () => {
      it("should separate dones and fails", () => {
        const r = partition([done(1), fail("a"), done(2), fail("b")]);
        assert.deepEqual(r.done, [1, 2]);
        assert.deepEqual(r.fail, ["a", "b"]);
      });

      it("should return empty arrays for empty input", () => {
        const r = partition([]);
        assert.deepEqual(r.done, []);
        assert.deepEqual(r.fail, []);
      });

      it("should put all in done when only Dones", () => {
        const r = partition([done(1), done(2)]);
        assert.deepEqual(r.done, [1, 2]);
        assert.deepEqual(r.fail, []);
      });
    });
  });

  describe("Namespace (Result.*)", () => {
    it("Result.done should work like done", () => {
      const r = Result.done(42);
      assert.equal(val(r), 42);
    });

    it("Result.fail should work like fail", () => {
      assert.equal(err(Result.fail("error")), "error");
    });

    it("Result.fromNullable should work", () => {
      const r = Result.fromNullable("hello", "was null");
      assert.equal(getOrThrow(r), "hello");
    });

    it("Result.map should work", () => {
      const r = Result.map(done(5), (x: number) => x * 2);
      assert.equal(getOrThrow(r), 10);
    });

    it("Result.fold should work", () => {
      const r = Result.fold(done(5), (e: string) => 0, (v: number) => v * 2);
      assert.equal(r, 10);
    });

    it("Result.all should work", () => {
      const r = Result.all([done(1), done(2)]);
      assert.deepEqual(getOrThrow(r), [1, 2]);
    });

    it("Result.chain should work like flatMap", () => {
      const r = Result.chain(done(5), (x: number) => done(x * 3));
      assert.equal(getOrThrow(r), 15);
    });

    it("Result.new should work like fromNullable", () => {
      assert.equal(getOrThrow(Result.new("hello", "was null")), "hello");
    });

    it("Result.mapErr should work like mapFail", () => {
      const r = Result.mapErr(fail("err"), (x: string) => x.toUpperCase());
      assert.equal(getOrThrow(swap(r)), "ERR");
    });

    it("Result.tapErr should work like tapFail", () => {
      let sideEffect = "";
      Result.tapErr(fail("error"), (x: string) => {
        sideEffect = x;
      });
      assert.equal(sideEffect, "error");
    });
  });
});

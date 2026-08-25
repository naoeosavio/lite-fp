import { describe, it, assert } from "./utils";
import {
  make,
  pair,
  curry,
  fromArray,
  fromObject,
  toArray,
  toObject,
  mapFirst,
  mapSecond,
  map,
  swap,
  fold,
  match,
  eq,
  eql,
  fst,
  snd,
  app,
  apply,
  zip,
  Pair,
} from "../src/Pair";

describe("Pair", () => {
  describe("Constructors", () => {
    describe("make", () => {
      it("should create a pair", () => {
        const p = make(1, "a");
        assert.equal(fst(p), 1);
        assert.equal(snd(p), "a");
      });

      it("should create a pair with objects", () => {
        const obj = { x: 1 };
        const p = make(obj, "hello");
        assert.equal(fst(p), obj);
        assert.equal(snd(p), "hello");
      });
    });

    describe("pair", () => {
      it("should be alias for make", () => {
        const p = pair(1, "a");
        assert.deepEqual(p, [1, "a"]);
      });
    });

    describe("curry", () => {
      it("should create pair in curried form", () => {
        const p = curry(1)("a");
        assert.equal(fst(p), 1);
        assert.equal(snd(p), "a");
      });

      it("should allow partial application", () => {
        const withFirst = curry("fixed");
        const p1 = withFirst(10);
        const p2 = withFirst(20);
        assert.deepEqual(p1, ["fixed", 10]);
        assert.deepEqual(p2, ["fixed", 20]);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromArray", () => {
      it("should convert tuple to pair", () => {
        const p = fromArray(["hello", 42]);
        assert.equal(fst(p), "hello");
        assert.equal(snd(p), 42);
      });
    });

    describe("fromObject", () => {
      it("should convert object to pair", () => {
        const p = fromObject({ fst: "a", snd: 1 });
        assert.equal(fst(p), "a");
        assert.equal(snd(p), 1);
      });
    });

    describe("toArray", () => {
      it("should convert pair to tuple", () => {
        const arr = toArray(make("a", 1));
        assert.deepEqual(arr, ["a", 1]);
      });
    });

    describe("toObject", () => {
      it("should convert pair to object", () => {
        const obj = toObject(make("a", 1));
        assert.deepEqual(obj, { fst: "a", snd: 1 });
      });
    });
  });

  describe("Operations", () => {
    describe("mapFirst", () => {
      it("should transform first element", () => {
        const p = mapFirst(make(1, "a"), (x) => x * 2);
        assert.equal(fst(p), 2);
        assert.equal(snd(p), "a");
      });

      it("should not change second element", () => {
        const p = mapFirst(make(1, "a"), (x) => String(x));
        assert.equal(fst(p), "1");
        assert.equal(snd(p), "a");
      });
    });

    describe("mapSecond", () => {
      it("should transform second element", () => {
        const p = mapSecond(make("a", 1), (x) => x * 2);
        assert.equal(fst(p), "a");
        assert.equal(snd(p), 2);
      });

      it("should not change first element", () => {
        const p = mapSecond(make("a", 1), (x) => String(x));
        assert.equal(fst(p), "a");
        assert.equal(snd(p), "1");
      });
    });

    describe("map", () => {
      it("should transform both elements", () => {
        const p = map(make(1, "a"), (x) => x * 2, (y) => y.toUpperCase());
        assert.equal(fst(p), 2);
        assert.equal(snd(p), "A");
      });
    });

    describe("swap", () => {
      it("should swap elements", () => {
        const p = swap(make(1, "a"));
        assert.equal(fst(p), "a");
        assert.equal(snd(p), 1);
      });

      it("double swap returns original", () => {
        const p = swap(swap(make(1, "a")));
        assert.deepEqual(p, [1, "a"]);
      });
    });

    describe("fold", () => {
      it("should fold both elements into single value", () => {
        const result = fold(make(2, 3), (a, b) => a + b);
        assert.equal(result, 5);
      });

      it("should fold with strings", () => {
        const result = fold(make("hello", "world"), (a, b) => `${a} ${b}`);
        assert.equal(result, "hello world");
      });
    });

    describe("match", () => {
      it("should match both elements", () => {
        const result = match(make(2, 3), {
          new: (a, b) => a * b,
        });
        assert.equal(result, 6);
      });
    });

    describe("eq", () => {
      it("should return true for equal pairs", () => {
        assert.equal(eq(make(1, "a"), make(1, "a")), true);
      });

      it("should return false for different first", () => {
        assert.equal(eq(make(1, "a"), make(2, "a")), false);
      });

      it("should return false for different second", () => {
        assert.equal(eq(make(1, "a"), make(1, "b")), false);
      });
    });

    describe("eql", () => {
      it("should compare with custom equality functions", () => {
        const strEq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
        const result = eql(
          make("HELLO", 1),
          make("hello", 1),
          strEq,
          (a: number, b: number) => a === b,
        );
        assert.equal(result, true);
      });

      it("should return false when different", () => {
        const result = eql(
          make("HELLO", 1),
          make("WORLD", 1),
          (a: string, b: string) => a === b,
          (a: number, b: number) => a === b,
        );
        assert.equal(result, false);
      });
    });
  });

  describe("Extract", () => {
    describe("fst", () => {
      it("should extract first element", () => {
        assert.equal(fst(make(1, "a")), 1);
      });
    });

    describe("snd", () => {
      it("should extract second element", () => {
        assert.equal(snd(make(1, "a")), "a");
      });
    });
  });

  describe("Combine", () => {
    describe("app", () => {
      it("should apply first element (fn) to value", () => {
        const p = make((x: number) => x * 2, "tag");
        const result = app(p, 5);
        assert.equal(fst(result), 10);
        assert.equal(snd(result), "tag");
      });
    });

    describe("apply", () => {
      it("should apply fn pair to value pair", () => {
        const fnPair = make(
          (a: number) => String(a),
          (b: string) => b.toUpperCase(),
        );
        const vPair = make(5, "hello");
        const result = apply(fnPair, vPair);
        assert.equal(fst(result), 5);
        assert.equal(snd(result), "HELLO");
      });
    });

    describe("zip", () => {
      it("should zip two pairs into pair of pairs", () => {
        const result = zip(make(1, "a"), make(true, 42));
        assert.deepEqual(fst(result), [1, true]);
        assert.deepEqual(snd(result), ["a", 42]);
      });
    });
  });

  describe("Namespace (Pair.*)", () => {
    it("Pair.new should work like make", () => {
      assert.deepEqual(Pair.new(1, "a"), [1, "a"]);
    });

    it("Pair.curry should work", () => {
      assert.deepEqual(Pair.curry(1)("a"), [1, "a"]);
    });

    it("Pair.fromArray should work", () => {
      assert.deepEqual(Pair.fromArray(["x", 1]), ["x", 1]);
    });

    it("Pair.fromObject should work", () => {
      assert.deepEqual(Pair.fromObject({ fst: "x", snd: 1 }), ["x", 1]);
    });

    it("Pair.toArray should work", () => {
      assert.deepEqual(Pair.toArray(make("x", 1)), ["x", 1]);
    });

    it("Pair.toObject should work", () => {
      assert.deepEqual(Pair.toObject(make("x", 1)), { fst: "x", snd: 1 });
    });

    it("Pair.mapFirst should work", () => {
      const p = Pair.mapFirst(make(1, "a"), (x: number) => x * 2);
      assert.deepEqual(p, [2, "a"]);
    });

    it("Pair.mapSecond should work", () => {
      const p = Pair.mapSecond(make(1, "a"), (x: string) => x.toUpperCase());
      assert.deepEqual(p, [1, "A"]);
    });

    it("Pair.swap should work", () => {
      assert.deepEqual(Pair.swap(make(1, "a")), ["a", 1]);
    });

    it("Pair.eq should work", () => {
      assert.equal(Pair.eq(make(1, "a"), make(1, "a")), true);
      assert.equal(Pair.eq(make(1, "a"), make(2, "a")), false);
    });

    it("Pair.zip should work", () => {
      const r = Pair.zip(make(1, "a"), make(true, 42));
      assert.deepEqual(fst(r), [1, true]);
      assert.deepEqual(snd(r), ["a", 42]);
    });
  });
});

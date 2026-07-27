import { describe, test, expect } from "./utils";
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
      test("should create a pair", () => {
        const p = make(1, "a");
        expect(fst(p)).toBe(1);
        expect(snd(p)).toBe("a");
      });

      test("should create a pair with objects", () => {
        const obj = { x: 1 };
        const p = make(obj, "hello");
        expect(fst(p)).toBe(obj);
        expect(snd(p)).toBe("hello");
      });
    });

    describe("pair", () => {
      test("should be alias for make", () => {
        const p = pair(1, "a");
        expect(p).toEqual([1, "a"]);
      });
    });

    describe("curry", () => {
      test("should create pair in curried form", () => {
        const p = curry(1)("a");
        expect(fst(p)).toBe(1);
        expect(snd(p)).toBe("a");
      });

      test("should allow partial application", () => {
        const withFirst = curry("fixed");
        const p1 = withFirst(10);
        const p2 = withFirst(20);
        expect(p1).toEqual(["fixed", 10]);
        expect(p2).toEqual(["fixed", 20]);
      });
    });
  });

  describe("Conversions", () => {
    describe("fromArray", () => {
      test("should convert tuple to pair", () => {
        const p = fromArray(["hello", 42]);
        expect(fst(p)).toBe("hello");
        expect(snd(p)).toBe(42);
      });
    });

    describe("fromObject", () => {
      test("should convert object to pair", () => {
        const p = fromObject({ fst: "a", snd: 1 });
        expect(fst(p)).toBe("a");
        expect(snd(p)).toBe(1);
      });
    });

    describe("toArray", () => {
      test("should convert pair to tuple", () => {
        const arr = toArray(make("a", 1));
        expect(arr).toEqual(["a", 1]);
      });
    });

    describe("toObject", () => {
      test("should convert pair to object", () => {
        const obj = toObject(make("a", 1));
        expect(obj).toEqual({ fst: "a", snd: 1 });
      });
    });
  });

  describe("Operations", () => {
    describe("mapFirst", () => {
      test("should transform first element", () => {
        const p = mapFirst(make(1, "a"), (x) => x * 2);
        expect(fst(p)).toBe(2);
        expect(snd(p)).toBe("a");
      });

      test("should not change second element", () => {
        const p = mapFirst(make(1, "a"), (x) => String(x));
        expect(fst(p)).toBe("1");
        expect(snd(p)).toBe("a");
      });
    });

    describe("mapSecond", () => {
      test("should transform second element", () => {
        const p = mapSecond(make("a", 1), (x) => x * 2);
        expect(fst(p)).toBe("a");
        expect(snd(p)).toBe(2);
      });

      test("should not change first element", () => {
        const p = mapSecond(make("a", 1), (x) => String(x));
        expect(fst(p)).toBe("a");
        expect(snd(p)).toBe("1");
      });
    });

    describe("map", () => {
      test("should transform both elements", () => {
        const p = map(make(1, "a"), (x) => x * 2, (y) => y.toUpperCase());
        expect(fst(p)).toBe(2);
        expect(snd(p)).toBe("A");
      });
    });

    describe("swap", () => {
      test("should swap elements", () => {
        const p = swap(make(1, "a"));
        expect(fst(p)).toBe("a");
        expect(snd(p)).toBe(1);
      });

      test("double swap returns original", () => {
        const p = swap(swap(make(1, "a")));
        expect(p).toEqual([1, "a"]);
      });
    });

    describe("fold", () => {
      test("should fold both elements into single value", () => {
        const result = fold(make(2, 3), (a, b) => a + b);
        expect(result).toBe(5);
      });

      test("should fold with strings", () => {
        const result = fold(make("hello", "world"), (a, b) => `${a} ${b}`);
        expect(result).toBe("hello world");
      });
    });

    describe("match", () => {
      test("should match both elements", () => {
        const result = match(make(2, 3), {
          new: (a, b) => a * b,
        });
        expect(result).toBe(6);
      });
    });

    describe("eq", () => {
      test("should return true for equal pairs", () => {
        expect(eq(make(1, "a"), make(1, "a"))).toBe(true);
      });

      test("should return false for different first", () => {
        expect(eq(make(1, "a"), make(2, "a"))).toBe(false);
      });

      test("should return false for different second", () => {
        expect(eq(make(1, "a"), make(1, "b"))).toBe(false);
      });
    });

    describe("eql", () => {
      test("should compare with custom equality functions", () => {
        const strEq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
        const result = eql(
          make("HELLO", 1),
          make("hello", 1),
          strEq,
          (a: number, b: number) => a === b,
        );
        expect(result).toBe(true);
      });

      test("should return false when different", () => {
        const result = eql(
          make("HELLO", 1),
          make("WORLD", 1),
          (a: string, b: string) => a === b,
          (a: number, b: number) => a === b,
        );
        expect(result).toBe(false);
      });
    });
  });

  describe("Extract", () => {
    describe("fst", () => {
      test("should extract first element", () => {
        expect(fst(make(1, "a"))).toBe(1);
      });
    });

    describe("snd", () => {
      test("should extract second element", () => {
        expect(snd(make(1, "a"))).toBe("a");
      });
    });
  });

  describe("Combine", () => {
    describe("app", () => {
      test("should apply first element (fn) to value", () => {
        const p = make((x: number) => x * 2, "tag");
        const result = app(p, 5);
        expect(fst(result)).toBe(10);
        expect(snd(result)).toBe("tag");
      });
    });

    describe("apply", () => {
      test("should apply fn pair to value pair", () => {
        const fnPair = make(
          (a: number) => a * 2,
          (b: string) => b.toUpperCase(),
        );
        const vPair = make(5, "hello");
        const result = apply(fnPair, vPair);
        expect(fst(result)).toBe(5);
        expect(snd(result)).toBe("HELLO");
      });
    });

    describe("zip", () => {
      test("should zip two pairs into pair of pairs", () => {
        const result = zip(make(1, "a"), make(true, 42));
        expect(fst(result)).toEqual([1, true]);
        expect(snd(result)).toEqual(["a", 42]);
      });
    });
  });

  describe("Namespace (Pair.*)", () => {
    test("Pair.new should work like make", () => {
      expect(Pair.new(1, "a")).toEqual([1, "a"]);
    });

    test("Pair.curry should work", () => {
      expect(Pair.curry(1)("a")).toEqual([1, "a"]);
    });

    test("Pair.fromArray should work", () => {
      expect(Pair.fromArray(["x", 1])).toEqual(["x", 1]);
    });

    test("Pair.fromObject should work", () => {
      expect(Pair.fromObject({ fst: "x", snd: 1 })).toEqual(["x", 1]);
    });

    test("Pair.toArray should work", () => {
      expect(Pair.toArray(make("x", 1))).toEqual(["x", 1]);
    });

    test("Pair.toObject should work", () => {
      expect(Pair.toObject(make("x", 1))).toEqual({ fst: "x", snd: 1 });
    });

    test("Pair.mapFirst should work", () => {
      const p = Pair.mapFirst(make(1, "a"), (x: number) => x * 2);
      expect(p).toEqual([2, "a"]);
    });

    test("Pair.mapSecond should work", () => {
      const p = Pair.mapSecond(make(1, "a"), (x: string) => x.toUpperCase());
      expect(p).toEqual([1, "A"]);
    });

    test("Pair.swap should work", () => {
      expect(Pair.swap(make(1, "a"))).toEqual(["a", 1]);
    });

    test("Pair.eq should work", () => {
      expect(Pair.eq(make(1, "a"), make(1, "a"))).toBe(true);
      expect(Pair.eq(make(1, "a"), make(2, "a"))).toBe(false);
    });

    test("Pair.zip should work", () => {
      const r = Pair.zip(make(1, "a"), make(true, 42));
      expect(fst(r)).toEqual([1, true]);
      expect(snd(r)).toEqual(["a", 42]);
    });
  });
});

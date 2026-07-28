import { getOrThrow } from "../dist/Option";
import { getOrElse, swap } from "../src/Result";
import { describe, test, expect } from "./utils";

describe("Extensions", () => {
  describe("Promise.prototype.toEither", () => {
    test("should return Right when promise resolves", async () => {
      const result = await Promise.resolve(42).toEither(
        (e: unknown) => `Error: ${String(e)}`,
      );
      expect(result.$).toBe("Right");
      expect(result.value).toBe(42);
    });

    test("should return Left when promise rejects", async () => {
      const result = await Promise.reject("fail").toEither(
        (e: unknown) => `Error: ${String(e)}`,
      );
      expect(result.$).toBe("Left");
      expect(result.value).toBe("Error: fail");
    });

    test("should handle rejection with Error instance", async () => {
      const result = await Promise.reject(new Error("boom")).toEither(
        (e: unknown) => (e as Error).message,
      );
      expect(result.$).toBe("Left");
      expect(result.value).toBe("boom");
    });
  });

  describe("Promise.prototype.toOption", () => {
    test("should return Some when promise resolves", async () => {
      const result = await Promise.resolve("data").toOption();
      expect(result.$).toBe("Some");
      expect(getOrThrow(result)).toBe("data");
    });

    test("should return None when promise rejects", async () => {
      const result = await Promise.reject("fail").toOption();
      expect(result.$).toBe("None");
    });

    test("should work with number values", async () => {
      const result = await Promise.resolve(42).toOption();
      expect(getOrThrow(result)).toBe(42);
    });
  });

  describe("Promise.prototype.toResult", () => {
    test("should return Done when promise resolves", async () => {
      const result = await Promise.resolve("data").toResult(
        (e: unknown) => `Error: ${String(e)}`,
      );
      expect("v" in result).toBe(true);
      expect(getOrElse(result, "")).toBe("data");
    });

    test("should return Fail when promise rejects", async () => {
      const result = await Promise.reject("fail").toResult(
        (e: unknown) => `Error: ${String(e)}`,
      );
      expect("e" in result).toBe(true);
      expect(getOrElse(swap(result), '')).toBe("Error: fail");
    });
  });

  describe("Array.prototype.firstOption", () => {
    test("should return Some with first element", () => {
      const result = [1, 2, 3].firstOption();
      expect(result.$).toBe("Some");
      expect(getOrThrow(result)).toBe(1);
    });

    test("should return None for empty array", () => {
      const result = ([] as number[]).firstOption();
      expect(result.$).toBe("None");
    });

    test("should work with string arrays", () => {
      const result = ["a", "b", "c"].firstOption();
      expect(getOrThrow(result)).toBe("a");
    });
  });
});

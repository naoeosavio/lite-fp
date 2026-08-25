import { getOrThrow } from "../dist/Option";
import { getOrElse, swap } from "../src/Result";
import { describe, it, assert } from "./utils";

describe("Extensions", () => {
  describe("Promise.prototype.toEither", () => {
    it("should return Right when promise resolves", async () => {
      const result = await Promise.resolve(42).toEither(
        (e: unknown) => `Error: ${String(e)}`,
      );
      assert.equal(result.$, "Right");
      assert.equal(result.value, 42);
    });

    it("should return Left when promise rejects", async () => {
      const result = await Promise.reject("fail").toEither(
        (e: unknown) => `Error: ${String(e)}`,
      );
      assert.equal(result.$, "Left");
      assert.equal(result.value, "Error: fail");
    });

    it("should handle rejection with Error instance", async () => {
      const result = await Promise.reject(new Error("boom")).toEither(
        (e: unknown) => (e as Error).message,
      );
      assert.equal(result.$, "Left");
      assert.equal(result.value, "boom");
    });
  });

  describe("Promise.prototype.toOption", () => {
    it("should return Some when promise resolves", async () => {
      const result = await Promise.resolve("data").toOption();
      assert.equal(result.$, "Some");
      assert.equal(getOrThrow(result), "data");
    });

    it("should return None when promise rejects", async () => {
      const result = await Promise.reject("fail").toOption();
      assert.equal(result.$, "None");
    });

    it("should work with number values", async () => {
      const result = await Promise.resolve(42).toOption();
      assert.equal(getOrThrow(result), 42);
    });
  });

  describe("Promise.prototype.toResult", () => {
    it("should return Done when promise resolves", async () => {
      const result = await Promise.resolve("data").toResult(
        (e: unknown) => `Error: ${String(e)}`,
      );
      assert.equal("v" in result, true);
      assert.equal(getOrElse(result, ""), "data");
    });

    it("should return Fail when promise rejects", async () => {
      const result = await Promise.reject("fail").toResult(
        (e: unknown) => `Error: ${String(e)}`,
      );
      assert.equal("e" in result, true);
      assert.equal(getOrElse(swap(result), ''), "Error: fail");
    });
  });

  describe("Array.prototype.firstOption", () => {
    it("should return Some with first element", () => {
      const result = [1, 2, 3].firstOption();
      assert.equal(result.$, "Some");
      assert.equal(getOrThrow(result), 1);
    });

    it("should return None for empty array", () => {
      const result = ([] as number[]).firstOption();
      assert.equal(result.$, "None");
    });

    it("should work with string arrays", () => {
      const result = ["a", "b", "c"].firstOption();
      assert.equal(getOrThrow(result), "a");
    });
  });
});

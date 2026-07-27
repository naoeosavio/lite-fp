import type { Either } from "./Either";
import { fromPromise as eitherFromPromise } from "./Either";
import type { Option } from "./Option";
import { none, fromPromise as optionFromPromise, some } from "./Option";
import type { Result } from "./Result";
import { fromPromise as resultFromPromise } from "./Result";

declare global {
  interface Promise<T> {
    toEither<A>(onError: (e: unknown) => A): Promise<Either<A, T>>;
    toOption(): Promise<Option<T>>;
    toResult<E = unknown>(onError: (e: unknown) => E): Promise<Result<T, E>>;
  }
  interface Array<T> {
    firstOption(): Option<T>;
  }
}

if (!("toEither" in Promise.prototype)) {
  Object.defineProperty(Promise.prototype, "toEither", {
    value: function <T, L = unknown>(
      this: Promise<T>,
      onError: (e: unknown) => L,
    ): Promise<Either<L, T>> {
      return eitherFromPromise(this, onError);
    },
    writable: true,
    configurable: true,
  });
}

if (!("toOption" in Promise.prototype)) {
  Object.defineProperty(Promise.prototype, "toOption", {
    value: function <T>(this: Promise<T>): Promise<Option<T>> {
      return optionFromPromise(this);
    },
    writable: true,
    configurable: true,
  });
}

if (!("toResult" in Promise.prototype)) {
  Object.defineProperty(Promise.prototype, "toResult", {
    value: function <T, E = unknown>(
      this: Promise<T>,
      onError: (e: unknown) => E,
    ): Promise<Result<T, E>> {
      return resultFromPromise(this, onError);
    },
    writable: true,
    configurable: true,
  });
}

if (!("firstOption" in Array.prototype)) {
  Object.defineProperty(Array.prototype, "firstOption", {
    value: function <T>(this: T[]): Option<T> {
      return this[0] ? some(this[0]) : none();
    },
    writable: true,
    configurable: true,
  });
}

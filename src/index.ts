// Either
export type { Left, Right } from "./Either";
export {
  Either,
  isLeft,
  isRight,
  left,
  lft,
  mapLeft,
  rgt,
  right,
  tapLeft,
} from "./Either";

// Maybe
export type { Nothing } from "./Maybe";
export {
  isJust,
  isNothing,
  isNull,
  isUndefined,
  just,
  Maybe,
  nothing,
  nothingNull,
  nothingUndefined,
} from "./Maybe";

// Option
export type { None, Some } from "./Option";
export {
  isNone,
  isSome,
  none,
  Option,
  some,
  unwrap,
} from "./Option";

// Pair
export {
  app,
  curry,
  eq,
  eql,
  fromArray,
  fromObject,
  fst,
  mapFirst,
  mapSecond,
  Pair,
  pair,
  snd,
  toArray,
  toObject,
} from "./Pair";

// Result
export type { Done, Fail } from "./Result";
export {
  done,
  Err,
  err,
  fail,
  isDone,
  isErr,
  isFail,
  isOk,
  mapFail,
  Ok,
  Result,
  tapFail,
  val,
} from "./Result";

// Signal
export {
  isSignal,
  read,
  Signal,
  signal,
  signalReactive,
  tap,
  toggle,
  update,
  watch,
  watchImmediate,
  write,
} from "./Signal";

import { done, fail, Result } from "./Result";
import { Either, left, right } from "./Either";
import { just, Maybe, nothing } from "./Maybe";
import { signal, Signal } from "./Signal";
/**
 * Create a Signal that tracks a Promise lifecycle using `Maybe<Either<A, B>>`.
 *
 * - `None` = loading (pending)
 * - `Some(Right(value))` = success
 * - `Some(Left(error))` = error
 */
export const fromPromiseEither = <A, B>(
  promise: Promise<B>,
  onError: (e: unknown) => A,
): Signal<Maybe<Either<A, B>>> => {
  const s = signal<Maybe<Either<A, B>>>(nothing());
  promise.then(
    (value) => s.write(just(right(value))),
    (e) => s.write(just(left(onError(e)))),
  );
  return s;
};

/**
 * Create a Signal that tracks a Promise lifecycle using `Maybe<Result<T, E>>`.
 *
 * - `None` = loading (pending)
 * - `Some(Done(value))` = success
 * - `Some(Fail(error))` = error
 */
export const fromPromiseResult = <T, E>(
  promise: Promise<T>,
  onError: (e: unknown) => E,
): Signal<Maybe<Result<T, E>>> => {
  const s = signal<Maybe<Result<T, E>>>(nothing());
  promise.then(
    (value) => s.write(just(done(value))),
    (e) => s.write(just(fail(onError(e)))),
  );
  return s;
};
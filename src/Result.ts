// New simple aliases: Done<T> = T, Fail<E> = E, Result<T,E> = T | E
export type Done<T> = { readonly v: T };
export type Fail<E> = { readonly e: E };
export type Result<T, E> = Done<T> | Fail<E>;

// Constructors
export const done = <T>(v: T): Done<T> => ({ v });
export const fail = <E>(e: E): Fail<E> => ({ e });
export const Ok = done;
export const Err = fail;

// Type guards
export const isDone = <T, E>(r: Result<T, E>): r is Done<T> => "v" in r;
export const isFail = <T, E>(r: Result<T, E>): r is Fail<E> => "e" in r;
export const isOk = isDone;
export const isErr = isFail;

// Conversions
export const fromNullable = <T, E>(
  value: T | null | undefined,
  error: E,
): Result<T, E> => (value == null ? fail(error) : done(value));
export const fromThrowable = <T, E>(
  fn: () => T,
  onError: (e: unknown) => E,
): Result<T, E> => {
  try {
    return done(fn());
  } catch (e) {
    return fail(onError(e));
  }
};
export const fromPromise = <T, E>(
  promise: Promise<T>,
  onError: (e: unknown) => E,
): Promise<Result<T, E>> => promise.then(done, (e) => fail(onError(e)));

// Ops
export const map = <T, E, U>(r: Result<T, E>, fn: (a: T) => U): Result<U, E> =>
  isDone(r) ? done(fn(val(r))) : r;
export const mapErr = <T, E, F>(
  r: Result<T, E>,
  fn: (b: E) => F,
): Result<T, F> => (isFail(r) ? fail(fn(err(r))) : r);
export const bimap = <T, E, U, F>(
  r: Result<T, E>,
  onDone: (a: T) => U,
  onFail: (b: E) => F,
): Result<U, F> => (isDone(r) ? done(onDone(val(r))) : fail(onFail(err(r))));
export const flatMap = <T, E, C>(
  r: Result<T, E>,
  fn: (a: T) => Result<C, E>,
): Result<C, E> => (isDone(r) ? fn(val(r)) : r);
export const match = <T, E, U>(
  r: Result<T, E>,
  matcher: { done: (a: T) => U; fail: (b: E) => U },
): U => (isDone(r) ? matcher.done(val(r)) : matcher.fail(err(r)));
export const fold = <T, E, U>(
  r: Result<T, E>,
  onFail: (error: E) => U,
  onDone: (value: T) => U,
): U => (isDone(r) ? onDone(val(r)) : onFail(err(r)));

export const recover = <T, E>(
  r: Result<T, E>,
  fn: (error: E) => T,
): Result<T, E> => (isFail(r) ? done(fn(err(r))) : r);

// Extract
export const val = <T>(r: Done<T>): T => r.v;
export const err = <E>(r: Fail<E>): E => r.e;
export const getOrElse = <T, E>(r: Result<T, E>, d: T): T =>
  isDone(r) ? val(r) : d;
export const getOrUndefined = <T, E>(r: Result<T, E>): T | undefined =>
  isDone(r) ? val(r) : undefined;
export const getOrThrow = <T, E>(r: Result<T, E>): T => {
  if (isDone(r)) return val(r);
  throw err(r);
};
// Combine
export const zip = <T, U, E>(
  a: Result<T, E>,
  b: Result<U, E>,
): Result<[T, U], E> => {
  if (isFail(a)) return a;
  if (isFail(b)) return b;
  return done([val(a), val(b)]);
};

export const apply = <T, U, E>(
  fn: Result<(a: T) => U, E>,
  arg: Result<T, E>,
): Result<U, E> => {
  if (isFail(fn)) return fn;
  if (isFail(arg)) return arg;
  return done(val(fn)(val(arg)));
};
export const orElse = <T, E>(a: Result<T, E>, b: Result<T, E>): Result<T, E> =>
  isDone(a) ? a : b;
export const filter = <T, E>(
  r: Result<T, E>,
  predicate: (a: T) => boolean,
  onFalse: E,
): Result<T, E> => (isDone(r) ? (predicate(val(r)) ? r : fail(onFalse)) : r);
export const tap = <T, E>(r: Result<T, E>, f: (a: T) => void): Result<T, E> => {
  if (isDone(r)) f(val(r));
  return r;
};
export const tapErr = <T, E>(
  r: Result<T, E>,
  f: (b: E) => void,
): Result<T, E> => {
  if (isFail(r)) f(err(r));
  return r;
};

export const Result = {
  done,
  fail,
  Ok,
  Err,
  val,
  err,
  new: fromNullable,
  isDone,
  isFail,
  isOk,
  isErr,
  fromNullable,
  fromThrowable,
  fromPromise,
  map,
  mapErr,
  bimap,
  flatMap,
  match,
  fold,
  recover,
  getOrElse,
  getOrUndefined,
  getOrThrow,
  zip,
  apply,
  orElse,
  filter,
  tap,
  tapErr,
};

declare global {
  interface Promise<T> {
    toResult<E = unknown>(onError: (e: unknown) => E): Promise<Result<T, E>>;
  }
}

Promise.prototype.toResult = function <T, E = unknown>(
  this: Promise<T>,
  onError: (e: unknown) => E,
): Promise<Result<T, E>> {
  return fromPromise(this, onError);
};

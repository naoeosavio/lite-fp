// New simple aliases: Done<T> = T, Fail<E> = E, Result<T,E> = T | E
export type Done<T> = { readonly value: T };
export type Fail<E> = { readonly error: E };
export type Result<T, E> = Done<T> | Fail<E>;

// Constructors
export const done = <T>(value: T): Done<T> => ({ value });
export const fail = <E>(error: E): Fail<E> => ({ error });

// Type guards
export const isDone = <T, E>(s: Result<T, E>): s is Done<T> => "value" in s;
export const isFail = <T, E>(s: Result<T, E>): s is Fail<E> => "error" in s;

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
export const map = <T, E, U>(s: Result<T, E>, fn: (a: T) => U): Result<U, E> =>
  isDone(s) ? done(fn(s.value)) : s;
export const mapErr = <T, E, F>(
  s: Result<T, E>,
  fn: (b: E) => F,
): Result<T, F> => (isFail(s) ? fail(fn(s.error)) : s);
export const bimap = <T, E, U, F>(
  s: Result<T, E>,
  onDone: (a: T) => U,
  onFail: (b: E) => F,
): Result<U, F> => (isDone(s) ? done(onDone(s.value)) : fail(onFail(s.error)));
export const flatMap = <T, E, C>(
  s: Result<T, E>,
  fn: (a: T) => Result<C, E>,
): Result<C, E> => (isDone(s) ? fn(s.value) : s);
export const match = <T, E, U>(
  s: Result<T, E>,
  matcher: { done: (a: T) => U; fail: (b: E) => U },
): U => (isDone(s) ? matcher.done(s.value) : matcher.fail(s.error));
export const fold = <T, E, U>(
  s: Result<T, E>,
  onFail: (error: E) => U,
  onDone: (value: T) => U,
): U => (isDone(s) ? onDone(s.value) : onFail(s.error));

export const recover = <T, E>(
  s: Result<T, E>,
  fn: (error: E) => T,
): Result<T, E> => (isFail(s) ? done(fn(s.error)) : s);

// Extract
export const getOrElse = <T, E>(s: Result<T, E>, d: T): T =>
  isDone(s) ? s.value : d;
export const getOrUndefined = <T, E>(s: Result<T, E>): T | undefined =>
  isDone(s) ? s.value : undefined;
export const getOrThrow = <T, E>(
  s: Result<T, E>,
  onError: (b: E) => never,
): T => (isDone(s) ? s.value : onError(s.error));

// Combine
export const zip = <T, U, E>(
  a: Result<T, E>,
  b: Result<U, E>,
): Result<[T, U], E> => {
  if (isFail(a)) return a;
  if (isFail(b)) return b;
  return done([a.value, b.value]);
};

export const apply = <T, U, E>(
  fn: Result<(a: T) => U, E>,
  arg: Result<T, E>,
): Result<U, E> => {
  if (isFail(fn)) return fn;
  if (isFail(arg)) return arg;
  return done(fn.value(arg.value));
};
export const orElse = <T, E>(a: Result<T, E>, b: Result<T, E>): Result<T, E> =>
  isDone(a) ? a : b;
export const filter = <T, E>(
  s: Result<T, E>,
  predicate: (a: T) => boolean,
  onFalse: E,
): Result<T, E> => (isDone(s) ? (predicate(s.value) ? s : fail(onFalse)) : s);
export const tap = <T, E>(s: Result<T, E>, f: (a: T) => void): Result<T, E> => {
  if (isDone(s)) f(s.value);
  return s;
};
export const tapErr = <T, E>(
  s: Result<T, E>,
  f: (b: E) => void,
): Result<T, E> => {
  if (isFail(s)) f(s.error);
  return s;
};

export const Result = {
  done,
  fail,
  new: fromNullable,
  isDone,
  isFail,
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

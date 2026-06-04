export interface Done<T> {
  readonly v: T;
}
export interface Fail<E> {
  readonly e: E;
}
export type Result<T, E> = Done<T> | Fail<E>;

// Constructors
export const done = <T>(value: T): Done<T> => ({ v: value });
export const fail = <E>(value: E): Fail<E> => ({ e: value });
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

export const fromPromiseCallback = <T, E>(
  promise: Promise<T>,
  onError: (e: unknown) => E,
  callback: (result: Result<T, E>) => void,
): void => {
  promise.then(
    (value) => callback(done(value)),
    (error) => callback(fail(onError(error))),
  );
};

export const flatMapCallback = <T, E, C>(
  r: Result<T, E>,
  fn: (a: T) => Promise<Result<C, E>>,
  callback: (result: Result<C, E>) => void,
): void => {
  if (isFail(r)) {
    callback(r);
  } else {
    fn(val(r)).then(callback);
  }
};

export const toPromise = <T, E>(r: Result<T, E>): Promise<T> =>
  isDone(r) ? Promise.resolve(val(r)) : Promise.reject(err(r));

// Ops
export const map = <T, E, U>(r: Result<T, E>, fn: (a: T) => U): Result<U, E> =>
  isDone(r) ? done(fn(val(r))) : r;
export const mapFail = <T, E, F>(
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
export const filter = <T, E>(
  r: Result<T, E>,
  predicate: (a: T) => boolean,
  onFalse: E,
): Result<T, E> => (isDone(r) ? (predicate(val(r)) ? r : fail(onFalse)) : r);
export const fold = <T, E, U>(
  r: Result<T, E>,
  onFail: (e: E) => U,
  onDone: (v: T) => U,
): U => (isDone(r) ? onDone(val(r)) : onFail(err(r)));
export const match = <T, E, U>(
  r: Result<T, E>,
  matcher: { done: (a: T) => U; fail: (b: E) => U },
): U => (isDone(r) ? matcher.done(val(r)) : matcher.fail(err(r)));
export const recover = <T, E>(
  r: Result<T, E>,
  fn: (value: E) => T,
): Result<T, E> => (isFail(r) ? done(fn(err(r))) : r);
export const swap = <T, E>(r: Result<T, E>): Result<E, T> =>
  isDone(r) ? fail(val(r)) : done(err(r));

// Extract
export const val = <T>(r: Done<T>): T => r.v;
export const err = <E>(r: Fail<E>): E => r.e;
export const getOrElse = <T, E>(r: Result<T, E>, defaultValue: T): T =>
  isDone(r) ? val(r) : defaultValue;
export const getOrUndefined = <T, E>(r: Result<T, E>): T | undefined =>
  isDone(r) ? val(r) : undefined;
export const getOrNull = <T, E>(r: Result<T, E>): T | null =>
  isDone(r) ? val(r) : null;
export const getOrThrow = <T, E>(r: Result<T, E>): T => {
  if (isDone(r)) return val(r);
  const value = err(r);
  throw value instanceof Error ? value : new Error(String(value));
};
// Combine
export const zip = <T, U, E>(
  a: Result<T, E>,
  b: Result<U, E>,
): Result<[T, U], E> => {
  if (isFail(a)) return a;
  if (isFail(b)) return b;
  return done<[T, U]>([val(a), val(b)]);
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
export const tap = <T, E>(r: Result<T, E>, f: (a: T) => void): Result<T, E> => {
  if (isDone(r)) f(val(r));
  return r;
};
export const tapFail = <T, E>(
  r: Result<T, E>,
  f: (b: E) => void,
): Result<T, E> => {
  if (isFail(r)) f(err(r));
  return r;
};

// Collection
export const all = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const r of results) {
    if (isFail(r)) return r;
    values.push(val(r));
  }
  return done(values);
};
export const collect = all;

export const flatten = <T, E>(r: Result<Result<T, E>, E>): Result<T, E> =>
  isDone(r) ? val(r) : r;

export const partition = <T, E>(
  results: Result<T, E>[],
): { done: T[]; fail: E[] } => {
  const doneArr: T[] = [];
  const failArr: E[] = [];
  for (const r of results) {
    if (isDone(r)) doneArr.push(val(r));
    else failArr.push(err(r));
  }
  return { done: doneArr, fail: failArr };
};

export const Result = {
  // Constructors
  new: fromNullable,
  done,
  fail,

  // Guards
  isDone,
  isFail,
  isOk,
  isErr,

  // Conversions
  fromNullable,
  fromThrowable,
  fromPromise,
  fromPromiseCallback,
  toPromise,

  // Ops
  map,
  mapFail,
  mapErr: mapFail,
  bimap,
  flatMap,
  filter,
  match,
  fold,
  chain: flatMap,
  recover,

  // Callback
  flatMapCallback,

  // Extract
  val,
  err,
  getOrElse,
  getOrUndefined,
  getOrNull,
  getOrThrow,

  // Collection
  all,
  collect,
  flatten,
  partition,

  // Combine
  zip,
  apply,
  orElse,
  tap,
  tapFail,
  tapErr: tapFail,
};

declare global {
  interface Promise<T> {
    toResult<E = unknown>(onError: (e: unknown) => E): Promise<Result<T, E>>;
  }
}

if (!("toResult" in Promise.prototype)) {
  Object.defineProperty(Promise.prototype, "toResult", {
    value: function <T, E = unknown>(
      this: Promise<T>,
      onError: (e: unknown) => E,
    ): Promise<Result<T, E>> {
      return fromPromise(this, onError);
    },
    writable: true,
    configurable: true,
  });
}

// Maybe using null or undefined as Nothing
// By default, Nothing covers both null and undefined for ergonomics.

export type NothingNull = null;
export type NothingUndefined = undefined;
export type Nothing = NothingNull | NothingUndefined;

export type Maybe<T> = T | Nothing;

// Constructors
export const just = <T>(value: T): Maybe<T> => value;
export const nothing = (): Nothing => undefined;
export const nothingNull = (): NothingNull => null;
export const nothingUndefined = (): NothingUndefined => undefined;

// Guards
export const isJust = <T>(m: Maybe<T>): m is T => m != null; // not null/undefined
export const isNothing = <T>(m: Maybe<T>): m is Nothing => m == null; // null or undefined
export const isNothingNull = <T>(m: Maybe<T>): m is NothingNull => m === null;
export const isNothingUndefined = <T>(m: Maybe<T>): m is NothingUndefined =>
  m === undefined;

// Conversions
export const fromNullable = <T>(m: T | null | undefined): Maybe<T> => m;
export const toNullable = <T>(m: Maybe<T>): T | null =>
  isNothing(m) ? null : m;
export const toUndefined = <T>(m: Maybe<T>): T | undefined =>
  isNothing(m) ? undefined : m;
export const fromThrowable = <T>(fn: () => T): Maybe<T> => {
  try {
    return fn();
  } catch {
    return nothing();
  }
};
export const fromPromise = <T>(promise: Promise<T>): Promise<Maybe<T>> =>
  promise.then(
    (v) => v,
    () => nothing(),
  );
export const fromPredicate = <T>(
  value: T,
  predicate: (value: T) => boolean,
): Maybe<T> => (predicate(value) ? just(value) : nothing());

// Ops
export const map = <T, U>(m: Maybe<T>, fn: (v: T) => U): Maybe<U> =>
  isNothing(m) ? nothing() : fn(m);
export const flatMap = <T, U>(m: Maybe<T>, fn: (v: T) => Maybe<U>): Maybe<U> =>
  isNothing(m) ? nothing() : fn(m);
export const filter = <T>(
  m: Maybe<T>,
  predicate: (value: T) => boolean,
): Maybe<T> => (isJust(m) && predicate(m) ? m : nothing());
export const match = <T, U>(
  m: Maybe<T>,
  matcher: { some: (v: T) => U; nothing: () => U },
): U => (isNothing(m) ? matcher.nothing() : matcher.some(m));
export const fold = <T, U>(
  m: Maybe<T>,
  onNothing: () => U,
  onJust: (v: T) => U,
): U => (isNothing(m) ? onNothing() : onJust(m));

// Extract
export const unwrap = <T>(m: Extract<Maybe<T>, T>): T => m;
export const getOrElse = <T>(m: Maybe<T>, d: T): T => (isNothing(m) ? d : m);
export const getOrUndefined = <T>(m: Maybe<T>): T | undefined =>
  isNothing(m) ? nothingUndefined() : m;
export const getOrThrow = <T>(m: Maybe<T>): T => {
  if (isNothing(m)) throw new Error("Maybe is nothing");
  else return m;
};

// Combine
export const zip = <T, U>(a: Maybe<T>, b: Maybe<U>): Maybe<[T, U]> =>
  isJust(a) && isJust(b) ? [a, b] : nothing();
export const apply = <T, U>(
  fn: Maybe<(value: T) => U>,
  opt: Maybe<T>,
): Maybe<U> => (isJust(fn) && isJust(opt) ? fn(opt) : nothing());
export const orElse = <T>(opt: Maybe<T>, other: Maybe<T>): Maybe<T> =>
  isNothing(opt) ? other : opt;

export const Maybe = {
  just,
  nothing,
  new: fromNullable,
  nothingNull,
  nothingUndefined,
  isJust,
  isNothing,
  isNothingNull,
  isNothingUndefined,
  fromNullable,
  fromThrowable,
  fromPromise,
  toNullable,
  toUndefined,
  map,
  flatMap,
  filter,
  match,
  fold,
  unwrap,
  getOrElse,
  getOrUndefined,
  getOrThrow,
  zip,
  apply,
  orElse,
};

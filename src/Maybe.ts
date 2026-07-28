// Maybe using null or undefined as Nothing
// By default, Nothing covers both null and undefined for ergonomics.

export type Nothing = null | undefined;
export type Maybe<T> = T | Nothing;

// Constructors
export const just = <T>(value: T): NonNullable<T> => value!;
export const nothing = (): Nothing => undefined;
export const nothingNull = (): null => null;
export const nothingUndefined = (): undefined => undefined;

// Guards
export const isJust = <T>(m: Maybe<T>): m is NonNullable<T> => m != null; // not null/undefined
export const isNothing = <T>(m: Maybe<T>): m is Nothing => m == null; // null or undefined
export const isNull = <T>(m: Maybe<T>): m is null => m === null;
export const isUndefined = <T>(m: Maybe<T>): m is undefined => m === undefined;

// Conversions
export const fromNullable = <T>(m: T | null | undefined): Maybe<T> =>
  isNothing(m) ? nothing() : just(m);
export const fromPredicate = <T>(
  value: T,
  predicate: (value: T) => boolean,
): Maybe<T> => (predicate(value) ? value : nothing());
export const fromThrowable = <T>(fn: () => T): Maybe<T> => {
  try {
    return fn();
  } catch {
    return nothing();
  }
};
export const fromPromise = <T>(promise: Promise<T>): Promise<Maybe<T>> =>
  promise.then(just, () => nothing());

// Ops
export const map = <T, U>(m: Maybe<T>, fn: (v: T) => U): Maybe<U> =>
  isNothing(m) ? nothing() : just(fn(m));
export const flatMap = <T, U>(m: Maybe<T>, fn: (v: T) => Maybe<U>): Maybe<U> =>
  isNothing(m) ? nothing() : just(fn(m));
export const filter = <T>(
  m: Maybe<T>,
  predicate: (value: T) => boolean,
): Maybe<T> => (isJust(m) && predicate(m) ? just(m) : nothing());
export const fold = <T, U>(
  m: Maybe<T>,
  onNothing: () => U,
  onJust: (v: T) => U,
): U => (isNothing(m) ? onNothing() : onJust(m));
export const match = <T, U>(
  m: Maybe<T>,
  matcher: { some: (v: T) => U; nothing: () => U },
): U => (isNothing(m) ? matcher.nothing() : matcher.some(m));

// Extract
export const getOrElse = <T>(m: Maybe<T>, defaultValue: T): T =>
  isNothing(m) ? defaultValue : just(m);
export const getOrUndefined = <T>(m: Maybe<T>): T | undefined =>
  isNothing(m) ? undefined : just(m);
export const getOrNull = <T>(m: Maybe<T>): T | null =>
  isNothing(m) ? null : just(m);
export const getOrThrow = <T>(m: Maybe<T>): T => {
  if (isNothing(m)) throw new Error("Maybe is nothing");
  else return just(m);
};

// Combine
export const zip = <T, U>(a: Maybe<T>, b: Maybe<U>): Maybe<[T, U]> =>
  isJust(a) && isJust(b) ? just([a, b]) : nothing();
export const apply = <T, U>(
  fn: Maybe<(value: T) => U>,
  opt: Maybe<T>,
): Maybe<U> => (isJust(fn) && isJust(opt) ? just(fn(opt)) : nothing());
export const orElse = <T>(opt: Maybe<T>, other: Maybe<T>): Maybe<T> =>
  isNothing(opt) ? other : opt;
export const tap = <T>(m: Maybe<T>, fn: (v: T) => void): Maybe<T> => {
  if (isJust(m)) fn(m);
  return m;
};

export const Maybe = {
  // Constructors
  new: fromNullable,
  just,
  nothing,
  nothingNull,
  nothingUndefined,

  // Guards
  isJust,
  isNothing,
  isNull,
  isUndefined,

  // Conversions
  fromNullable,
  fromThrowable,
  fromPredicate,
  fromPromise,

  // Ops
  map,
  flatMap,
  filter,
  fold,
  match,

  // Extract
  getOrElse,
  getOrUndefined,
  getOrNull,
  getOrThrow,

  // Combine
  zip,
  apply,
  orElse,
  tap,
};

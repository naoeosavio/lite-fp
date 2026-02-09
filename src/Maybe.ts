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
export const isSome = <T>(m: Maybe<T>): m is T => m != null; // not null/undefined
export const isNothing = <T>(m: Maybe<T>): m is Nothing => m == null; // null or undefined
export const isNothingNull = <T>(m: Maybe<T>): m is NothingNull => m === null;
export const isNothingUndefined = <T>(m: Maybe<T>): m is NothingUndefined => m === undefined;

// Conversions
export const fromNullable = <T>(v: T | null | undefined): Maybe<T> => v;
export const toNullable = <T>(m: Maybe<T>): T | null => (m == null ? null : m);
export const toUndefined = <T>(m: Maybe<T>): T | undefined => (m == null ? undefined : m);

// Ops
export const map = <T, U>(m: Maybe<T>, fn: (v: T) => U): Maybe<U> =>
  m == null ? nothing() : fn(m);
export const flatMap = <T, U>(m: Maybe<T>, fn: (v: T) => Maybe<U>): Maybe<U> =>
  m == null ? nothing() : fn(m);
export const filter = <T>(m: Maybe<T>, predicate: (value: T) => boolean): Maybe<T> =>
  m != null && predicate(m) ? m : nothing();
export const match = <T, U>(
  m: Maybe<T>,
  matcher: { some: (v: T) => U; nothing: () => U },
): U => (m == null ? matcher.nothing() : matcher.some(m));

// Extract
export const getOrElse = <T>(m: Maybe<T>, d: T): T => (m == null ? d : m);
export const getOrUndefined = <T>(m: Maybe<T>): T | undefined => (m == null ? nothingUndefined() : m);
export const getOrThrow = <T>(m: Maybe<T>, error: Error): T => {
  if (m != null) return m;
  throw error;
};

// Conversions from effects
export const fromThrowable = <T>(fn: () => T): Maybe<T> => {
  try {
    return fn();
  } catch {
    return nothing();
  }
};
export const fromPromise = <T>(promise: Promise<T>): Promise<Maybe<T>> =>
  promise.then(v => v, () => nothing());

// Combine
export const zip = <T, U>(a: Maybe<T>, b: Maybe<U>): Maybe<[T, U]> =>
  a != null && b != null ? ([a, b] as [T, U]) : nothing();
export const apply = <T, U>(
  fn: Maybe<(value: T) => U>,
  opt: Maybe<T>,
): Maybe<U> => (fn != null && opt != null ? fn(opt) : nothing());
export const orElse = <T>(opt: Maybe<T>, other: Maybe<T>): Maybe<T> =>
  opt != null ? opt : other;

export const Maybe = {
  just,
  nothing,
  nothingNull,
  nothingUndefined,
  isSome,
  isNothing,
  isNothingNull,
  isNothingUndefined,
  fromNullable,
  toNullable,
  toUndefined,
  map,
  flatMap,
  filter,
  match,
  getOrElse,
  getOrUndefined,
  getOrThrow,
  fromThrowable,
  fromPromise,
  zip,
  apply,
  orElse,
};

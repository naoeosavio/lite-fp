// Maybe using null or undefined as None
// By default, None covers both null and undefined for ergonomics.

export type NoneNull = null;
export type NoneUndefined = undefined;
export type None = NoneNull | NoneUndefined;

export type Maybe<T> = T | None;

// Constructors
export const just = <T>(value: T): Maybe<T> => value;
export const none = (): None => undefined;
export const noneNull = (): NoneNull => null;
export const noneUndefined = (): NoneUndefined => undefined;

// Guards
export const isSome = <T>(m: Maybe<T>): m is T => m != null; // not null/undefined
export const isNone = <T>(m: Maybe<T>): m is None => m == null; // null or undefined
export const isNoneNull = <T>(m: Maybe<T>): m is NoneNull => m === null;
export const isNoneUndefined = <T>(m: Maybe<T>): m is NoneUndefined => m === undefined;

// Conversions
export const fromNullable = <T>(v: T | null | undefined): Maybe<T> => v;
export const toNullable = <T>(m: Maybe<T>): T | null => (m == null ? null : m);
export const toUndefined = <T>(m: Maybe<T>): T | undefined => (m == null ? undefined : m);

// Ops
export const map = <T, U>(m: Maybe<T>, fn: (v: T) => U): Maybe<U> =>
  m == null ? none() : fn(m);
export const flatMap = <T, U>(m: Maybe<T>, fn: (v: T) => Maybe<U>): Maybe<U> =>
  m == null ? none() : fn(m);
export const filter = <T>(m: Maybe<T>, predicate: (value: T) => boolean): Maybe<T> =>
  m != null && predicate(m) ? m : none();
export const match = <T, U>(
  m: Maybe<T>,
  matcher: { some: (v: T) => U; none: () => U },
): U => (m == null ? matcher.none() : matcher.some(m));

// Extract
export const getOrElse = <T>(m: Maybe<T>, d: T): T => (m == null ? d : m);
export const getOrUndefined = <T>(m: Maybe<T>): T | undefined => (m == null ? noneUndefined() : m);
export const getOrThrow = <T>(m: Maybe<T>, error: Error): T => {
  if (m != null) return m;
  throw error;
};

// Conversions from effects
export const fromThrowable = <T>(fn: () => T): Maybe<T> => {
  try {
    return fn();
  } catch {
    return none();
  }
};
export const fromPromise = <T>(promise: Promise<T>): Promise<Maybe<T>> =>
  promise.then(v => v, () => none());

// Combine
export const zip = <T, U>(a: Maybe<T>, b: Maybe<U>): Maybe<[T, U]> =>
  a != null && b != null ? ([a, b] as [T, U]) : none();
export const apply = <T, U>(
  fn: Maybe<(value: T) => U>,
  opt: Maybe<T>,
): Maybe<U> => (fn != null && opt != null ? fn(opt) : none());
export const orElse = <T>(opt: Maybe<T>, other: Maybe<T>): Maybe<T> =>
  opt != null ? opt : other;

export const Maybe = {
  just,
  none,
  noneNull,
  noneUndefined,
  isSome,
  isNone,
  isNoneNull,
  isNoneUndefined,
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

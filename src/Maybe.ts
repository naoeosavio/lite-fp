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
  m == null ? undefined : fn(m);
export const flatMap = <T, U>(m: Maybe<T>, fn: (v: T) => Maybe<U>): Maybe<U> =>
  m == null ? undefined : fn(m);
export const match = <T, U>(
  m: Maybe<T>,
  matcher: { some: (v: T) => U; none: () => U },
): U => (m == null ? matcher.none() : matcher.some(m));

// Extract
export const getOrElse = <T>(m: Maybe<T>, d: T): T => (m == null ? d : m);

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
  match,
  getOrElse,
};

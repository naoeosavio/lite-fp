export type None = { readonly $: "None" };
export type Some<T> = { readonly $: "Some"; readonly value: T };
export type Option<T> = None | Some<T>;

// Constructors
export const none = <T>(): Option<T> => ({ $: "None" });
export const some = <T>(value: T): Option<T> => ({ $: "Some", value });

// Guards
export const isSome = <T>(option: Option<T>): option is Some<T> =>
  option.$ === "Some";
export const isNone = <T>(option: Option<T>): option is None =>
  option.$ === "None";

// Conversions
export const fromNullable = <T>(value: T | null | undefined): Option<T> =>
  value == null ? none() : some(value);
export const fromPredicate = <T>(
  value: T,
  predicate: (value: T) => boolean,
): Option<T> => (predicate(value) ? some(value) : none());
export const fromThrowable = <T>(fn: () => T): Option<T> => {
  try {
    return some(fn());
  } catch {
    return none();
  }
};
export const fromPromise = <T>(promise: Promise<T>): Promise<Option<T>> =>
  promise.then(some, () => none());

// Ops
export const map = <T, U>(option: Option<T>, fn: (value: T) => U): Option<U> =>
  isSome(option) ? some(fn(unwrap(option))) : none();
export const flatMap = <T, U>(
  option: Option<T>,
  fn: (value: T) => Option<U>,
): Option<U> => (isSome(option) ? fn(unwrap(option)) : none());
export const filter = <T>(
  option: Option<T>,
  predicate: (value: T) => boolean,
): Option<T> => (isSome(option) && predicate(unwrap(option)) ? option : none());
export const match = <T, U>(
  option: Option<T>,
  matcher: { some: (value: T) => U; none: () => U },
): U => (isSome(option) ? matcher.some(unwrap(option)) : matcher.none());

// Extract
export const unwrap = <T>(option: Some<T>): T => option.value;
export const getOrElse = <T>(option: Option<T>, defaultValue: T): T =>
  isSome(option) ? unwrap(option) : defaultValue;
export const getOrUndefined = <T>(option: Option<T>): T | undefined =>
  isSome(option) ? unwrap(option) : undefined;
export const getOrThrow = <T>(option: Option<T>): T => {
  if (isSome(option)) return unwrap(option);
  throw new Error("Option is none");
};

// Combine
export const zip = <T, U>(a: Option<T>, b: Option<U>): Option<[T, U]> =>
  isSome(a) && isSome(b) ? some([unwrap(a), unwrap(b)]) : none();
export const apply = <T, U>(
  fn: Option<(value: T) => U>,
  opt: Option<T>,
): Option<U> =>
  isSome(fn) && isSome(opt) ? some(unwrap(fn)(unwrap(opt))) : none();
export const orElse = <T>(opt: Option<T>, other: Option<T>): Option<T> =>
  isSome(opt) ? opt : other;

// Backwards-compatible namespace-style object
export const Option = {
  none,
  some,
  new: fromNullable,
  isSome,
  isNone,
  fromNullable,
  fromPredicate,
  fromThrowable,
  fromPromise,
  map,
  flatMap,
  filter,
  match,
  unwrap,
  getOrElse,
  getOrUndefined,
  getOrThrow,
  zip,
  apply,
  orElse,
};

declare global {
  interface Array<T> {
    firstOption(): Option<T>;
  }
  interface Promise<T> {
    toOption(): Promise<Option<T>>;
  }
}

Array.prototype.firstOption = function <T>(this: T[]): Option<T> {
  return this[0] ? some(this[0]) : none();
};

Promise.prototype.toOption = function <T>(
  this: Promise<T>,
): Promise<Option<T>> {
  return fromPromise(this);
};

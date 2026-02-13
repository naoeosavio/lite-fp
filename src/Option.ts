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
  option.$ === "Some" ? some(fn(option.value)) : none();
export const flatMap = <T, U>(
  option: Option<T>,
  fn: (value: T) => Option<U>,
): Option<U> => (option.$ === "Some" ? fn(option.value) : none());
export const filter = <T>(
  option: Option<T>,
  predicate: (value: T) => boolean,
): Option<T> =>
  option.$ === "Some" && predicate(option.value) ? option : none();
export const match = <T, U>(
  option: Option<T>,
  matcher: { some: (value: T) => U; none: () => U },
): U => (option.$ === "Some" ? matcher.some(option.value) : matcher.none());

// Extract
export const get = <T>(option: Some<T>): T => option.value;
export const getOrElse = <T>(option: Option<T>, defaultValue: T): T =>
  option.$ === "Some" ? option.value : defaultValue;
export const getOrUndefined = <T>(option: Option<T>): T | undefined =>
  option.$ === "Some" ? option.value : undefined;
export const getOrThrow = <T>(option: Option<T>): T => {
  if (option.$ === "Some") return option.value;
  throw new Error("Option is none");
};

// Combine
export const zip = <T, U>(a: Option<T>, b: Option<U>): Option<[T, U]> =>
  a.$ === "Some" && b.$ === "Some" ? some([a.value, b.value]) : none();
export const apply = <T, U>(
  fn: Option<(value: T) => U>,
  opt: Option<T>,
): Option<U> =>
  fn.$ === "Some" && opt.$ === "Some" ? some(fn.value(opt.value)) : none();
export const orElse = <T>(opt: Option<T>, other: Option<T>): Option<T> =>
  opt.$ === "Some" ? opt : other;

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
  get,
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

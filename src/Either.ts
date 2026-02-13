export type Left<A> = { readonly $: "Left"; readonly value: A };
export type Right<B> = { readonly $: "Right"; readonly value: B };
export type Either<A, B> = Left<A> | Right<B>;

// Constructors
export const left = <A>(value: A): Left<A> => ({ $: "Left", value });
export const right = <B>(value: B): Right<B> => ({ $: "Right", value });

// Guards
export const isLeft = <A, B>(e: Either<A, B>): e is Left<A> => e.$ === "Left";
export const isRight = <A, B>(e: Either<A, B>): e is Right<B> =>
  e.$ === "Right";

// Conversions
export const fromNullable = <A, B>(
  value: B | null | undefined,
  error: A,
): Either<A, B> => (value == null ? left(error) : right(value));
export const fromThrowable = <A, B>(
  fn: () => B,
  onError: (e: unknown) => A,
): Either<A, B> => {
  try {
    return right(fn());
  } catch (e) {
    return left(onError(e));
  }
};
export const fromPromise = async <A, B>(
  promise: Promise<B>,
  onError: (e: unknown) => A,
): Promise<Either<A, B>> => {
  try {
    const value = await promise;
    return right(value);
  } catch (e) {
    return left(onError(e));
  }
};

// Ops
export const map = <A, B, C>(e: Either<A, B>, fn: (r: B) => C): Either<A, C> =>
  isRight(e) ? right(fn(getRight(e))) : e;
export const mapLeft = <A, B, C>(
  e: Either<A, B>,
  fn: (l: A) => C,
): Either<C, B> => (isLeft(e) ? left(fn(getLeft(e))) : e);
export const bimap = <A, B, C, D>(
  e: Either<A, B>,
  fl: (l: A) => C,
  fr: (r: B) => D,
): Either<C, D> => (isLeft(e) ? left(fl(getLeft(e))) : right(fr(getRight(e))));
export const flatMap = <A, B, C>(
  e: Either<A, B>,
  fn: (value: B) => Either<A, C>,
): Either<A, C> => (isRight(e) ? fn(getRight(e)) : e);
export const chain = <A, B, C>(
  e: Either<A, B>,
  fn: (r: B) => Either<A, C>,
): Either<A, C> => (isRight(e) ? fn(getRight(e)) : e);
export const fold = <A, B, C>(
  e: Either<A, B>,
  onLeft: (l: A) => C,
  onRight: (r: B) => C,
): C => (isLeft(e) ? onLeft(getLeft(e)) : onRight(getRight(e)));
export const match = <A, B, C>(
  e: Either<A, B>,
  matcher: { right: (value: B) => C; left: (value: A) => C },
): C => (isRight(e) ? matcher.right(getRight(e)) : matcher.left(getLeft(e)));
export const swap = <A, B>(e: Either<A, B>): Either<B, A> =>
  isRight(e) ? left(getRight(e)) : right(getLeft(e));

// Extract
export const getLeft = <A>(e: Left<A>): A => e.value;
export const getRight = <B>(e: Right<B>): B => e.value;
export const getOrElse = <A, B>(e: Either<A, B>, defaultValue: B): B =>
  isRight(e) ? getRight(e) : defaultValue;
export const getOrUndefined = <A, B>(e: Either<A, B>): B | undefined =>
  isRight(e) ? getRight(e) : undefined;
export const getOrThrow = <A, B>(e: Either<A, B>): B => {
  if (isRight(e)) return getRight(e);
  throw getLeft(e);
};

// Combine
export const zip = <E, A, B>(
  a: Either<E, A>,
  b: Either<E, B>,
): Either<E, [A, B]> => {
  if (isLeft(a)) return a;
  if (isLeft(b)) return b;
  return right<[A, B]>([getRight(a), getRight(b)]);
};
export const apply = <E, A, B>(
  fn: Either<E, (value: A) => B>,
  arg: Either<E, A>,
): Either<E, B> => {
  if (isLeft(fn)) return fn;
  if (isLeft(arg)) return arg;
  return right(getRight(fn)(getRight(arg)));
};
export const tap = <A, B>(e: Either<A, B>, f: (r: B) => void): Either<A, B> => {
  if (isRight(e)) f(getRight(e));
  return e;
};
export const tapLeft = <A, B>(
  e: Either<A, B>,
  f: (l: A) => void,
): Either<A, B> => {
  if (isLeft(e)) f(getLeft(e));
  return e;
};

export const Either = {
  // Constructors
  left,
  right,
  new: fromNullable,

  // Guards
  isLeft,
  isRight,

  // Conversions
  fromNullable,
  fromThrowable,
  fromPromise,

  // Ops
  map,
  mapLeft,
  bimap,
  flatMap,
  chain,
  fold,
  match,
  swap,

  // Extract
  getLeft,
  getRight,
  getOrElse,
  getOrUndefined,
  getOrThrow,

  // Combine
  zip,
  apply,
  tap,
  tapLeft,
};

declare global {
  interface Promise<T> {
    toEither<A>(onError: (e: unknown) => A): Promise<Either<A, T>>;
  }
}

Promise.prototype.toEither = async function <T, L = unknown>(
  this: Promise<T>,
  onError: (e: unknown) => L,
): Promise<Either<L, T>> {
  try {
    const v = await this;
    return right<T>(v);
  } catch (e_1) {
    return left<L>(onError(e_1));
  }
};

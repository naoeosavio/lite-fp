export type Left<A> = { readonly $: "Left"; readonly value: A };
export type Right<B> = { readonly $: "Right"; readonly value: B };
export type Either<A, B> = Left<A> | Right<B>;

// Standalone constructors and ops (module-free style)
export const left = <A>(value: A): Left<A> => ({ $: "Left", value });
export const right = <B>(value: B): Right<B> => ({ $: "Right", value });

export const isLeft = <A, B>(e: Either<A, B>): e is Left<A> => e.$ === "Left";
export const isRight = <A, B>(e: Either<A, B>): e is Right<B> =>
  e.$ === "Right";

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

export const map = <A, B, C>(e: Either<A, B>, fn: (r: B) => C): Either<A, C> =>
  e.$ === "Right" ? right(fn(e.value)) : e;
export const mapLeft = <A, B, C>(
  e: Either<A, B>,
  fn: (l: A) => C,
): Either<C, B> => (e.$ === "Left" ? left(fn(e.value)) : e);
export const bimap = <A, B, C, D>(
  e: Either<A, B>,
  fl: (l: A) => C,
  fr: (r: B) => D,
): Either<C, D> => (e.$ === "Left" ? left(fl(e.value)) : right(fr(e.value)));
export const flatMap = <A, B, C>(
  e: Either<A, B>,
  fn: (value: B) => Either<A, C>,
): Either<A, C> => (e.$ === "Right" ? fn(e.value) : e);
export const chain = <A, B, C>(
  e: Either<A, B>,
  fn: (r: B) => Either<A, C>,
): Either<A, C> => (e.$ === "Right" ? fn(e.value) : e);
export const fold = <A, B, C>(
  e: Either<A, B>,
  onLeft: (l: A) => C,
  onRight: (r: B) => C,
): C => (e.$ === "Left" ? onLeft(e.value) : onRight(e.value));
export const match = <A, B, C>(
  e: Either<A, B>,
  matcher: { right: (value: B) => C; left: (value: A) => C },
): C => (e.$ === "Right" ? matcher.right(e.value) : matcher.left(e.value));
export const swap = <A, B>(e: Either<A, B>): Either<B, A> =>
  e.$ === "Right" ? left(e.value) : right(e.value);

export const getOrElse = <A, B>(e: Either<A, B>, defaultValue: B): B =>
  e.$ === "Right" ? e.value : defaultValue;

export const zip = <E, A, B>(
  a: Either<E, A>,
  b: Either<E, B>,
): Either<E, [A, B]> => {
  if (a.$ === "Left") return a;
  if (b.$ === "Left") return b;
  return right<[A, B]>([a.value, b.value]);
};
export const apply = <E, A, B>(
  fn: Either<E, (value: A) => B>,
  arg: Either<E, A>,
): Either<E, B> => {
  if (fn.$ === "Left") return fn;
  if (arg.$ === "Left") return arg;
  return right(fn.value(arg.value));
};
export const tap = <A, B>(e: Either<A, B>, f: (r: B) => void): Either<A, B> => {
  if (e.$ === "Right") f(e.value);
  return e;
};
export const tapLeft = <A, B>(
  e: Either<A, B>,
  f: (l: A) => void,
): Either<A, B> => {
  if (e.$ === "Left") f(e.value);
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
  getOrElse,

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

// standalone left/right already exported above

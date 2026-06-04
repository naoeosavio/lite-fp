export interface Left<A> {
  readonly $: "Left";
  readonly value: A;
}
export interface Right<B> {
  readonly $: "Right";
  readonly value: B;
}
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
export const fromPromise = <A, B>(
  promise: Promise<B>,
  onError: (e: unknown) => A,
): Promise<Either<A, B>> => promise.then(right, (e) => left(onError(e)));

export const fromPromiseCallback = <A, B>(
  promise: Promise<B>,
  onError: (e: unknown) => A,
  callback: (result: Either<A, B>) => void,
): void => {
  promise.then(
    (value) => callback(right(value)),
    (error) => callback(left(onError(error))),
  );
};

export const flatMapCallback = <A, B, C>(
  e: Either<A, B>,
  fn: (value: B) => Promise<Either<A, C>>,
  callback: (result: Either<A, C>) => void,
): void => {
  if (isLeft(e)) {
    callback(e);
  } else {
    fn(rgt(e)).then(callback);
  }
};

export const toPromise = <A, B>(e: Either<A, B>): Promise<B> =>
  isRight(e) ? Promise.resolve(rgt(e)) : Promise.reject(lft(e));

// Ops
export const map = <A, B, C>(e: Either<A, B>, fn: (r: B) => C): Either<A, C> =>
  isRight(e) ? right(fn(rgt(e))) : e;
export const mapLeft = <A, B, C>(
  e: Either<A, B>,
  fn: (l: A) => C,
): Either<C, B> => (isLeft(e) ? left(fn(lft(e))) : e);
export const bimap = <A, B, C, D>(
  e: Either<A, B>,
  fl: (l: A) => C,
  fr: (r: B) => D,
): Either<C, D> => (isRight(e) ? right(fr(rgt(e))) : left(fl(lft(e))));
export const flatMap = <A, B, C>(
  e: Either<A, B>,
  fn: (value: B) => Either<A, C>,
): Either<A, C> => (isRight(e) ? fn(rgt(e)) : e);
export const filter = <A, B>(
  e: Either<A, B>,
  predicate: (value: B) => boolean,
  onFalse: A,
): Either<A, B> => (isRight(e) ? (predicate(rgt(e)) ? e : left(onFalse)) : e);
export const fold = <A, B, C>(
  e: Either<A, B>,
  onLeft: (l: A) => C,
  onRight: (r: B) => C,
): C => (isRight(e) ? onRight(rgt(e)) : onLeft(lft(e)));
export const match = <A, B, C>(
  e: Either<A, B>,
  matcher: { right: (value: B) => C; left: (value: A) => C },
): C => (isRight(e) ? matcher.right(rgt(e)) : matcher.left(lft(e)));
export const recover = <A, B>(
  e: Either<A, B>,
  fn: (value: A) => B,
): Either<A, B> => (isLeft(e) ? right(fn(lft(e))) : e);
export const swap = <A, B>(e: Either<A, B>): Either<B, A> =>
  isRight(e) ? left(rgt(e)) : right(lft(e));

// Extract
export const lft = <A>(e: Left<A>): A => e.value;
export const rgt = <B>(e: Right<B>): B => e.value;
export const getOrElse = <A, B>(e: Either<A, B>, defaultValue: B): B =>
  isRight(e) ? rgt(e) : defaultValue;
export const getOrNull = <A, B>(e: Either<A, B>): B | null =>
  isRight(e) ? rgt(e) : null;
export const getOrUndefined = <A, B>(e: Either<A, B>): B | undefined =>
  isRight(e) ? rgt(e) : undefined;
export const getOrThrow = <A, B>(e: Either<A, B>): B => {
  if (isRight(e)) return rgt(e);
  const value = lft(e);
  throw value instanceof Error ? value : new Error(String(value));
};

// Combine
export const zip = <E, A, B>(
  a: Either<E, A>,
  b: Either<E, B>,
): Either<E, [A, B]> => {
  if (isLeft(a)) return a;
  if (isLeft(b)) return b;
  return right<[A, B]>([rgt(a), rgt(b)]);
};
export const apply = <E, A, B>(
  fn: Either<E, (value: A) => B>,
  arg: Either<E, A>,
): Either<E, B> => {
  if (isLeft(fn)) return fn;
  if (isLeft(arg)) return arg;
  return right(rgt(fn)(rgt(arg)));
};
export const orElse = <E, A, B>(
  a: Either<E, A>,
  b: Either<E, B>,
): Either<E, A | B> => (isRight(a) ? a : b);
export const tap = <A, B>(e: Either<A, B>, f: (r: B) => void): Either<A, B> => {
  if (isRight(e)) f(rgt(e));
  return e;
};
export const tapLeft = <A, B>(
  e: Either<A, B>,
  f: (l: A) => void,
): Either<A, B> => {
  if (isLeft(e)) f(lft(e));
  return e;
};

// Collection
export const all = <A, B>(eithers: Either<A, B>[]): Either<A, B[]> => {
  const values: B[] = [];
  for (const e of eithers) {
    if (isLeft(e)) return e;
    values.push(rgt(e));
  }
  return right(values);
};
export const collect = all;

export const flatten = <A, B>(e: Either<A, Either<A, B>>): Either<A, B> =>
  isRight(e) ? rgt(e) : e;

export const partition = <A, B>(
  eithers: Either<A, B>[],
): { right: B[]; left: A[] } => {
  const rightArr: B[] = [];
  const leftArr: A[] = [];
  for (const e of eithers) {
    if (isRight(e)) rightArr.push(rgt(e));
    else leftArr.push(lft(e));
  }
  return { right: rightArr, left: leftArr };
};

export const Either = {
  // Constructors
  new: fromNullable,
  left,
  right,

  // Guards
  isLeft,
  isRight,

  // Conversions
  fromNullable,
  fromThrowable,
  fromPromise,
  fromPromiseCallback,
  toPromise,

  // Ops
  map,
  mapLeft,
  bimap,
  flatMap,
  filter,
  chain: flatMap,
  fold,
  match,
  swap,

  // Callback
  flatMapCallback,

  // Extract
  lft,
  rgt,
  getOrElse,
  getOrNull,
  getOrUndefined,
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
  tapLeft,
};

declare global {
  interface Promise<T> {
    toEither<A>(onError: (e: unknown) => A): Promise<Either<A, T>>;
  }
}

if (!("toEither" in Promise.prototype)) {
  Object.defineProperty(Promise.prototype, "toEither", {
    value: function <T, L = unknown>(
      this: Promise<T>,
      onError: (e: unknown) => L,
    ): Promise<Either<L, T>> {
      return fromPromise(this, onError);
    },
    writable: true,
    configurable: true,
  });
}

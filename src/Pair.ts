export type Pair<A, B> = readonly [A, B];

// Standalone fns
export const fst = <A, B>(p: Pair<A, B>): A => p[0];
export const snd = <A, B>(p: Pair<A, B>): B => p[1];
export const make = <A, B>(a: A, b: B): Pair<A, B> => [a, b];
export const pair = make;

export const fromArray = <A, B>([a, b]: [A, B]): Pair<A, B> => [a, b];
export const fromObject = <A, B>(obj: { fst: A; snd: B }): Pair<A, B> => [
  obj.fst,
  obj.snd,
];
export const curry =
  <A>(a: A) =>
  <B>(b: B): Pair<A, B> => [a, b];

export const mapFirst = <A, B, C>(p: Pair<A, B>, fn: (a: A) => C): Pair<C, B> =>
  make(fn(p[0]), p[1]);
export const mapSecond = <A, B, C>(
  p: Pair<A, B>,
  fn: (b: B) => C,
): Pair<A, C> => make(p[0], fn(p[1]));
export const map = <A, B, C, D>(
  p: Pair<A, B>,
  fnA: (a: A) => C,
  fnB: (b: B) => D,
): Pair<C, D> => make(fnA(p[0]), fnB(p[1]));

export const swap = <A, B>(p: Pair<A, B>): Pair<B, A> => make(p[1], p[0]);

export const apply = <A, B, C>(p: Pair<(a: A) => B, C>, value: A): Pair<B, C> =>
  make(p[0](value), p[1]);
export const apply2 = <A, B, C>(
  fnPair: Pair<(a: A) => B, (b: B) => C>,
  vPair: Pair<A, B>,
): Pair<A, C> => make(vPair[0], fnPair[1](vPair[1]));

export const reduce = <A, B, C>(p: Pair<A, B>, fn: (a: A, b: B) => C): C =>
  fn(p[0], p[1]);
export const toArray = <A, B>(p: Pair<A, B>): [A, B] => [p[0], p[1]];
export const toObject = <A, B>(p: Pair<A, B>): { fst: A; snd: B } => ({
  fst: p[0],
  snd: p[1],
});

export const eq = <A, B>(p1: Pair<A, B>, p2: Pair<A, B>): boolean =>
  p1[0] === p2[0] && p1[1] === p2[1];
export const equals = <A, B>(
  p1: Pair<A, B>,
  p2: Pair<A, B>,
  eqA: (a1: A, a2: A) => boolean,
  eqB: (b1: B, b2: B) => boolean,
): boolean => eqA(p1[0], p2[0]) && eqB(p1[1], p2[1]);

export const zip = <A, B, C, D>(
  p1: Pair<A, B>,
  p2: Pair<C, D>,
): Pair<Pair<A, C>, Pair<B, D>> => make([p1[0], p2[0]], [p1[1], p2[1]]);

// Backwards-compatible namespace-style object
export const Pair = {
  fst,
  snd,
  new: make,
  fromArray,
  fromObject,
  curry,
  mapFirst,
  mapSecond,
  map,
  swap,
  apply,
  apply2,
  reduce,
  toArray,
  toObject,
  eq,
  equals,
  zip,
};

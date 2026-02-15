export type Pair<A, B> = readonly [A, B];

// Constructors
export const make = <A, B>(a: A, b: B): Pair<A, B> => [a, b];
export const pair = make;
export const curry =
  <A>(a: A) =>
  <B>(b: B): Pair<A, B> => [a, b];

// Conversions
export const fromArray = <A, B>([a, b]: [A, B]): Pair<A, B> => make(a, b);
export const fromObject = <A, B>(obj: { fst: A; snd: B }): Pair<A, B> =>
  make(obj.fst, obj.snd);
export const toArray = <A, B>(p: Pair<A, B>): [A, B] => [fst(p), snd(p)];
export const toObject = <A, B>(p: Pair<A, B>): { fst: A; snd: B } => ({
  fst: fst(p),
  snd: snd(p),
});

// Ops
export const mapFirst = <A, B, C>(p: Pair<A, B>, fn: (a: A) => C): Pair<C, B> =>
  make(fn(fst(p)), snd(p));
export const mapSecond = <A, B, C>(
  p: Pair<A, B>,
  fn: (b: B) => C,
): Pair<A, C> => make(fst(p), fn(snd(p)));
export const map = <A, B, C, D>(
  p: Pair<A, B>,
  fnA: (a: A) => C,
  fnB: (b: B) => D,
): Pair<C, D> => make(fnA(fst(p)), fnB(snd(p)));
export const swap = <A, B>(p: Pair<A, B>): Pair<B, A> => make(snd(p), fst(p));
export const fold = <A, B, C>(
  p: Pair<A, B>,
  fn: (first: A, second: B) => C,
): C => fn(fst(p), snd(p));
export const match = <A, B, C>(
  p: Pair<A, B>,
  matcher: { new: (first: A, second: B) => C },
): C => matcher.new(fst(p), snd(p));
export const eq = <A, B>(p1: Pair<A, B>, p2: Pair<A, B>): boolean =>
  fst(p1) === fst(p2) && snd(p1) === snd(p2);
export const eql = <A, B>(
  p1: Pair<A, B>,
  p2: Pair<A, B>,
  eqA: (a1: A, a2: A) => boolean,
  eqB: (b1: B, b2: B) => boolean,
): boolean => eqA(fst(p1), fst(p2)) && eqB(snd(p1), snd(p2));

// Extract
export const fst = <A, B>(p: Pair<A, B>): A => p[0];
export const snd = <A, B>(p: Pair<A, B>): B => p[1];

// Combine
export const app = <A, B, C>(p: Pair<(a: A) => B, C>, value: A): Pair<B, C> =>
  make(fst(p)(value), snd(p));
export const apply = <A, B, C>(
  fnPair: Pair<(a: A) => B, (b: B) => C>,
  vPair: Pair<A, B>,
): Pair<A, C> => make(fst(vPair), snd(fnPair)(snd(vPair)));
export const zip = <A, B, C, D>(
  p1: Pair<A, B>,
  p2: Pair<C, D>,
): Pair<Pair<A, C>, Pair<B, D>> => make([fst(p1), fst(p2)], [snd(p1), snd(p2)]);

// Backwards-compatible namespace-style object
export const Pair = {
  // Constructors
  new: make,
  curry,

  // Conversions
  fromArray,
  fromObject,
  toArray,
  toObject,

  // Ops
  mapFirst,
  mapSecond,
  map,
  swap,
  fold,
  match,
  eq,
  eql,

  // Extract
  fst,
  snd,

  // Combine
  app,
  apply,
  zip,
};

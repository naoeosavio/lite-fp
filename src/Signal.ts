// Signal — reactive value with change propagation
//
// A Signal holds a mutable value and notifies watchers on change.
// The interface exposes only the primitive: `read`, `write`, `watch`.
// All derived operations (`map`, `update`, `zip`, `fold`, etc.) are
// standalone functions that compose on top of these three primitives.

export interface Signal<T> {
  readonly read: T;
  write(v: T): void;
  watch(fn: (v: T) => void): () => void;
}

// ── Constructor ────────────────────────────────────────────────────

export const signal = <T>(initialValue: T): Signal<T> => {
  let value = initialValue;
  const listeners = new Set<(value: T) => void>();

  return {
    get read(): T {
      return value;
    },

    write(next: T): void {
      if (Object.is(value, next)) return;
      value = next;
      for (const fn of listeners) fn(value);
    },

    watch(fn: (value: T) => void): () => void {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
};

// ── Convenience aliases for read / write / watch ───────────────────

/** Read the current value of a signal. */
export const get = <T>(s: Signal<T>): T => s.read;

/** Set a new value. No-op if Object.is-equal to current. */
export const set = <T>(s: Signal<T>, value: T): void => s.write(value);

/** Subscribe to changes. Returns unsubscribe function. */
export const sub = <T>(s: Signal<T>, fn: (value: T) => void): (() => void) =>
  s.watch(fn);

// ── Operations ─────────────────────────────────────────────────────

/** Update the current value via a transformation function. */
export const update = <T>(s: Signal<T>, fn: (value: T) => T): void =>
  s.write(fn(s.read));

/** Derive a new signal that transforms the source signal's value. */
export const map = <T, U>(s: Signal<T>, fn: (value: T) => U): Signal<U> => {
  const derived = signal(fn(s.read));
  s.watch((v) => derived.write(fn(v)));
  return derived;
};

/**
 * Derive a signal that depends on another signal dynamically.
 * Each time the source changes, the derived signal switches to the
 * new inner signal produced by `fn`.
 */
export const flatMap = <T, U>(
  s: Signal<T>,
  fn: (value: T) => Signal<U>,
): Signal<U> => {
  let inner = fn(s.read);
  let unsub = inner.watch((v) => derived.write(v));
  const derived = signal<U>(inner.read);

  s.watch((v) => {
    unsub();
    inner = fn(v);
    unsub = inner.watch((iv) => derived.write(iv));
    derived.write(inner.read);
  });

  return derived;
};

// ── Filter ─────────────────────────────────────────────────────────

/**
 * Create a signal that only updates when the predicate is satisfied.
 * The returned signal's value is the last value that passed the predicate.
 */
export const filter = <T>(
  s: Signal<T>,
  predicate: (value: T) => boolean,
  initial?: T,
): Signal<T> => {
  const current = s.read;
  const derived = signal<T>(
    predicate(current) ? current : (initial ?? current),
  );
  s.watch((v) => {
    if (predicate(v)) derived.write(v);
  });
  return derived;
};

// ── Combine ────────────────────────────────────────────────────────

/** Combine two signals into a signal of tuples. Updates when either source changes. */
export const zip = <T, U>(a: Signal<T>, b: Signal<U>): Signal<[T, U]> => {
  const derived = signal<[T, U]>([a.read, b.read]);
  a.watch((va) => derived.write([va, b.read]));
  b.watch((vb) => derived.write([a.read, vb]));
  return derived;
};

/**
 * Merge an array of signals into a single signal of arrays.
 * Updates when any source signal changes.
 */
export const merge = <T extends readonly Signal<unknown>[]>(
  signals: [...T],
): Signal<{ [K in keyof T]: T[K] extends Signal<infer V> ? V : never }> => {
  const values: unknown[] = signals.map((s) => s.read);
  const derived = signal(values);

  for (let i = 0; i < signals.length; i++) {
    signals[i].watch((v: unknown) => {
      const next = [...derived.read];
      next[i] = v;
      derived.write(next);
    });
  }

  return derived as Signal<{
    [K in keyof T]: T[K] extends Signal<infer V> ? V : never;
  }>;
};

// ── Side effects ───────────────────────────────────────────────────

/** Run `fn` on the current value and on every change. Returns an unsubscribe function. */
export const tap = <T>(s: Signal<T>, fn: (value: T) => void): (() => void) => {
  fn(s.read);
  return s.watch(fn);
};

// ── Accumulate ─────────────────────────────────────────────────────

/** Accumulate values over time, like reduce over a stream of changes. */
export const fold = <T, U>(
  s: Signal<T>,
  fn: (accumulator: U, value: T) => U,
  initial: U,
): Signal<U> => {
  let acc = initial;
  const derived = signal(initial);
  s.watch((v) => {
    acc = fn(acc, v);
    derived.write(acc);
  });
  return derived;
};

// ── Async ──────────────────────────────────────────────────────────

/**
 * Create a signal that starts with `initial` and updates to the
 * resolved value when the promise settles.
 */
export const fromPromise = <T>(promise: Promise<T>, initial: T): Signal<T> => {
  const s = signal(initial);
  promise.then(
    (value) => s.write(value),
    () => {
      /* signal keeps initial value on rejection */
    },
  );
  return s;
};

// ── History ────────────────────────────────────────────────────────

/** Return a signal that accumulates the value history as an array. */
export const history = <T>(s: Signal<T>, maxLength = Infinity): Signal<T[]> => {
  const derived = signal<T[]>([s.read]);
  s.watch((v) => {
    const prev = derived.read;
    const next = [...prev, v];
    derived.write(
      next.length > maxLength ? next.slice(next.length - maxLength) : next,
    );
  });
  return derived;
};

// ── Namespace ──────────────────────────────────────────────────────

export const Signal = {
  // Constructor
  of: signal,
  signal,

  // Core
  get,
  set,
  sub,
  subscribe: sub,
  update,

  // Derive
  map,
  flatMap,
  filter,

  // Combine
  zip,
  merge,

  // Side effects
  tap,
  fold,

  // Async
  fromPromise,

  // History
  history,
};

// Signal — reactive value with change propagation
//
//   Signal<T> — read + write + watch (the mutable primitive)
//
// Two derivation styles:
//   Eager — `map`, `filter`, `zip`, `merge`, `fold`, `flatMap`, `history`.
//   Creates subscriptions, stores derived state. Derived lives as long
//   as the source — no dispose needed.
//
//   Lazy — `mapLazy`, `filterLazy`, `zipLazy`, `mergeLazy`, `flatMapLazy`.
//   No internal state, no implicit subscriptions. Computes on `.read`.
//   `write` is a no-op. `.watch()` is opt-in and returns cleanup.
//
export interface Signal<T> {
  readonly read: T;
  write(value: T): void;
  watch(callback: (value: T) => void): () => void;
}

// ── Constructor ────────────────────────────────────────────────────

/**
 * Create a Signal — the mutable primitive.
 * `watch(cb)` does NOT fire immediately. Use `signalReactive` for that.
 */
export const signal = <T>(initial: T): Signal<T> => {
  let value = initial;
  const listeners = new Set<(value: T) => void>();

  return {
    get read(): T {
      return value;
    },

    write(next: T): void {
      if (Object.is(value, next)) return;
      value = next;
      for (const listener of listeners) listener(value);
    },

    watch(callback: (value: T) => void): () => void {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
  };
};

// ── Reactive variant ───────────────────────────────────────────────

/**
 * Create a reactive Signal — `watch(cb)` fires `cb(value)` immediately,
 * then on every change. Otherwise identical to `signal`.
 */
export const signalReactive = <T>(initial: T): Signal<T> => {
  const s = signal(initial);

  return {
    get read(): T {
      return s.read;
    },

    write: s.write,

    watch(callback: (value: T) => void): () => void {
      callback(s.read);
      return s.watch(callback);
    },
  };
};

// ── Convenience aliases ────────────────────────────────────────────

/** Read the current value of a signal. */
export const read = <T>(s: Signal<T>): T => s.read;

/** Set a new value. No-op if Object.is-equal to current. */
export const write = <T>(s: Signal<T>, value: T): void => s.write(value);

/** Subscribe to changes. Does NOT fire immediately. Returns unsubscribe. */
export const watch = <T>(s: Signal<T>, fn: (value: T) => void): (() => void) =>
  s.watch(fn);

/**
 * Subscribe to changes AND fire immediately with the current value.
 * Equivalent to `signalReactive` behaviour on any signal.
 */
export const watchImmediate = <T>(
  s: Signal<T>,
  fn: (value: T) => void,
): (() => void) => {
  fn(s.read);
  return s.watch(fn);
};

// ── Guards ─────────────────────────────────────────────────────────

/** Type guard: returns true if `v` implements the Signal interface. */
export const isSignal = <T>(v: unknown): v is Signal<T> =>
  typeof v === "object" &&
  v !== null &&
  "read" in v &&
  "write" in v &&
  "watch" in v;

// ── Operations ─────────────────────────────────────────────────────

/** Update via a transformation function. */
export const update = <T>(s: Signal<T>, fn: (value: T) => T): void =>
  s.write(fn(s.read));

/** Toggle a boolean signal. */
export const toggle = (s: Signal<boolean>): void => s.write(!s.read);

/** Reset a signal to a default value. */
export const reset = <T>(s: Signal<T>, value: T): void => s.write(value);

// ═══════════════════════════════════════════════════════════════════
// EAGER derivation
// ───────────────────────────────────────────────────────────────────
// Creates subscriptions, stores derived state.
// Derived lives as long as the source — no dispose needed.

/** Eager single-source derivation. Returns a writable signal. */
export const map = <T, U>(s: Signal<T>, fn: (value: T) => U): Signal<U> => {
  const derived = signal(fn(s.read));
  s.watch((v) => derived.write(fn(v)));
  return derived;
};

/** Eager dynamic switching between inner signals. */
export const flatMap = <T, U>(
  s: Signal<T>,
  fn: (value: T) => Signal<U>,
): Signal<U> => {
  let inner = fn(s.read);
  let unsubInner = inner.watch((v) => derived.write(v));
  const derived = signal<U>(inner.read);

  s.watch((v) => {
    unsubInner();
    inner = fn(v);
    unsubInner = inner.watch((iv) => derived.write(iv));
    derived.write(inner.read);
  });

  return derived;
};

/** Eager filter. Only propagates values that pass the predicate. */
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

/** Eager combine of two signals into a tuple signal. */
export const zip = <T, U>(a: Signal<T>, b: Signal<U>): Signal<[T, U]> => {
  const derived = signal<[T, U]>([a.read, b.read]);
  a.watch((va) => derived.write([va, b.read]));
  b.watch((vb) => derived.write([a.read, vb]));
  return derived;
};

/** Eager merge of N (heterogeneous) signals into a tuple signal. */
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

/** Eager accumulation over changes (like reduce over a stream). */
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

/** Eager value history as an array signal. */
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

// ═══════════════════════════════════════════════════════════════════
// EAGER reactive derivation
// ───────────────────────────────────────────────────────────────────
// Like normal eager derivations, but use `signalReactive` internally.
// `watch(cb)` on the derived signal fires immediately.

/** Reactive eager map. `watch` fires immediately with current derived value. */
export const mapReactive = <T, U>(
  s: Signal<T>,
  fn: (value: T) => U,
): Signal<U> => {
  const derived = signalReactive(fn(s.read));
  s.watch((v) => derived.write(fn(v)));
  return derived;
};

/** Reactive eager flatMap. `watch` fires immediately. */
export const flatMapReactive = <T, U>(
  s: Signal<T>,
  fn: (value: T) => Signal<U>,
): Signal<U> => {
  let inner = fn(s.read);
  let unsubInner = inner.watch((v) => derived.write(v));
  const derived = signalReactive<U>(inner.read);

  s.watch((v) => {
    unsubInner();
    inner = fn(v);
    unsubInner = inner.watch((iv) => derived.write(iv));
    derived.write(inner.read);
  });

  return derived;
};

/** Reactive eager filter. `watch` fires immediately. */
export const filterReactive = <T>(
  s: Signal<T>,
  predicate: (value: T) => boolean,
  initial?: T,
): Signal<T> => {
  const current = s.read;
  const derived = signalReactive<T>(
    predicate(current) ? current : (initial ?? current),
  );
  s.watch((v) => {
    if (predicate(v)) derived.write(v);
  });
  return derived;
};

/** Reactive eager zip. `watch` fires immediately. */
export const zipReactive = <T, U>(
  a: Signal<T>,
  b: Signal<U>,
): Signal<[T, U]> => {
  const derived = signalReactive<[T, U]>([a.read, b.read]);
  a.watch((va) => derived.write([va, b.read]));
  b.watch((vb) => derived.write([a.read, vb]));
  return derived;
};

/** Reactive eager merge. `watch` fires immediately. */
export const mergeReactive = <T extends readonly Signal<unknown>[]>(
  signals: [...T],
): Signal<{ [K in keyof T]: T[K] extends Signal<infer V> ? V : never }> => {
  const values: unknown[] = signals.map((s) => s.read);
  const derived = signalReactive(values);

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

/** Reactive eager fold. `watch` fires immediately. */
export const foldReactive = <T, U>(
  s: Signal<T>,
  fn: (accumulator: U, value: T) => U,
  initial: U,
): Signal<U> => {
  let acc = initial;
  const derived = signalReactive(initial);
  s.watch((v) => {
    acc = fn(acc, v);
    derived.write(acc);
  });
  return derived;
};

/** Reactive eager history. `watch` fires immediately. */
export const historyReactive = <T>(
  s: Signal<T>,
  maxLength = Infinity,
): Signal<T[]> => {
  const derived = signalReactive<T[]>([s.read]);
  s.watch((v) => {
    const prev = derived.read;
    const next = [...prev, v];
    derived.write(
      next.length > maxLength ? next.slice(next.length - maxLength) : next,
    );
  });
  return derived;
};

// ── Side effects ───────────────────────────────────────────────────

/**
 * Run `fn` on every change. Also calls `fn(s.read)` immediately.
 * Returns an unsubscribe function.
 */
export const tap = <T>(s: Signal<T>, fn: (value: T) => void): (() => void) => {
  fn(s.read);
  return s.watch(fn);
};

/**
 * Run `fn` on every change, without firing immediately.
 * Returns an unsubscribe function.
 */
export const tapWatch = <T>(
  s: Signal<T>,
  fn: (value: T) => void,
): (() => void) => s.watch(fn);

// ── Conversions ────────────────────────────────────────────────────

/**
 * Create a Promise that resolves with the next value of the signal.
 */
export const toPromise = <T>(s: Signal<T>): Promise<T> =>
  new Promise<T>((resolve) => {
    const unsub = s.watch((v) => {
      resolve(v);
      unsub();
    });
  });

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

// ── Namespace ──────────────────────────────────────────────────────

export const Signal = {
  // Constructors
  of: signal,
  signal,
  reactive: signalReactive,

  // Guards
  isSignal,

  // Conversions
  fromPromise,
  toPromise,

  // Operations
  read,
  write,
  watch,
  watchImmediate,
  get: read,
  set: write,
  sub: watch,
  subscribe: watch,
  update,
  toggle,
  reset,
  map,
  flatMap,
  filter,
  fold,
  history,
  mapReactive,
  flatMapReactive,
  filterReactive,
  foldReactive,
  historyReactive,

  // Combine
  zip,
  merge,
  zipReactive,
  mergeReactive,
  tap,
  tapWatch,
};

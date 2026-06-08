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

/** Remove a specific listener previously added with `watch`. */
export const unwatch = <T>(s: Signal<T>, fn: (value: T) => void): void => {
  s.watch(fn)();
};

/** Listen to the next change only — fires once, then auto-unsubscribes. */
export const once = <T>(s: Signal<T>, fn: (value: T) => void): void => {
  const unsub = s.watch((v) => {
    fn(v);
    unsub();
  });
};

/** Watch with a predicate — only fires when `predicate(value)` is true. */
export const when = <T>(
  s: Signal<T>,
  predicate: (value: T) => boolean,
  fn: (value: T) => void,
): (() => void) =>
  s.watch((v) => {
    if (predicate(v)) fn(v);
  });

/** Lazy boolean negation. Returns `Signal<boolean>` that inverts the source. */
export const not = (s: Signal<boolean>): Signal<boolean> =>
  mapLazy(s, (v) => !v);

/**
 * Create a Signal that accepts `write` only **once**.
 * Subsequent writes are silently ignored.
 */
export const onceSignal = <T>(initial: T): Signal<T> => {
  const raw = signal(initial);
  let sealed = false;

  return {
    get read(): T {
      return raw.read;
    },

    watch: raw.watch.bind(raw),

    write(value: T): void {
      if (!sealed) {
        sealed = true;
        raw.write(value);
      }
    },
  };
};

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

// ── Extract ────────────────────────────────────────────────────────

/**
 * Read the signal value, returning `fallback` if it is `null` or `undefined`.
 */
export const getOr = <T>(s: Signal<T>, fallback: T): T => {
  const v = s.read;
  return v != null ? v : fallback;
};

/** Read the signal value, returning `null` if it is `null` or `undefined`. */
export const getOrNull = <T>(s: Signal<T>): T | null => s.read ?? null;

/** Read the signal value, returning `undefined` if it is `null` or `undefined`. */
export const getOrUndefined = <T>(s: Signal<T>): T | undefined =>
  s.read ?? undefined;

// ── Combine ────────────────────────────────────────────────────────

/**
 * If the first signal's value is `null` or `undefined`, use the second.
 * Returns a derived signal.
 */
export const orElse = <T>(a: Signal<T>, b: Signal<T>): Signal<T> => {
  const derived = signal(getOr(a, b.read));
  a.watch((va) => derived.write(va != null ? va : b.read));
  b.watch((vb) => {
    if (a.read == null) derived.write(vb);
  });
  return derived;
};

/**
 * Combine homogeneous signals into a `Signal<T[]>`.
 * Updates when any source changes.
 */
export const combine = <T>(signals: Signal<T>[]): Signal<T[]> => {
  const derived = signal(signals.map((s) => s.read));

  for (let i = 0; i < signals.length; i++) {
    signals[i].watch((v) => {
      const next = [...derived.read];
      next[i] = v;
      derived.write(next);
    });
  }

  return derived;
};

/**
 * Applicative: apply a signal of functions to a signal of values.
 * Updates when either signal changes.
 */
export const apply = <T, U>(
  fn: Signal<(value: T) => U>,
  arg: Signal<T>,
): Signal<U> => {
  const derived = signal(fn.read(arg.read));
  fn.watch((f) => derived.write(f(arg.read)));
  arg.watch((v) => derived.write(fn.read(v)));
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

// ── Utilities ──────────────────────────────────────────────────────

/**
 * Create a derived signal that tracks the previous value.
 * Starts with `initial` as the previous value.
 */
export const previous = <T>(s: Signal<T>, initial: T): Signal<T> => {
  let prev = initial;
  const derived = signal(initial);
  s.watch((v) => {
    derived.write(prev);
    prev = v;
  });
  return derived;
};

/**
 * Create a derived signal that only emits when the value is distinct
 * from the previous one. Uses `Object.is` by default, or a custom
 * comparator.
 */
export const distinct = <T>(
  s: Signal<T>,
  eq?: (a: T, b: T) => boolean,
): Signal<T> => {
  const isEq = eq ?? Object.is;
  const derived = signal(s.read);
  s.watch((v) => {
    if (!isEq(derived.read, v)) derived.write(v);
  });
  return derived;
};

// ═══════════════════════════════════════════════════════════════════
// LAZY derivation
// ───────────────────────────────────────────────────────────────────
// No internal state, no implicit subscriptions. Computes on `.read`.
// `write` is a no-op. `.watch()` is opt-in and returns cleanup.

/**
 * Lazy single-source projection. No state, no subscription.
 * `read` calls `fn(source.read)` on every access. `write` is a no-op.
 */
export const mapLazy = <T, U>(
  s: Signal<T>,
  fn: (value: T) => U,
): Signal<U> => ({
  get read(): U {
    return fn(s.read);
  },

  write(_value: U): void {
    // no-op: value is derived from source
  },

  watch(cb: (value: U) => void): () => void {
    return s.watch((v) => cb(fn(v)));
  },
});

/** Alias for `mapLazy`. */
export const derive = mapLazy;

/**
 * Lazy dynamic switching between inner signals. No stored state.
 * `read` reads through to the current inner signal.
 */
export const flatMapLazy = <T, U>(
  s: Signal<T>,
  fn: (value: T) => Signal<U>,
): Signal<U> => ({
  get read(): U {
    return fn(s.read).read;
  },

  write(_value: U): void {
    // no-op
  },

  watch(cb: (value: U) => void): () => void {
    let inner = fn(s.read);
    let unsubInner = inner.watch(cb);

    const unsubSource = s.watch((v) => {
      unsubInner();
      inner = fn(v);
      unsubInner = inner.watch(cb);
      cb(inner.read);
    });

    return () => {
      unsubInner();
      unsubSource();
    };
  },
});

/**
 * Lazy filter. `read` returns the source value if it passes the predicate,
 * otherwise the `fallback` value. `watch` only fires when predicate passes.
 */
export const filterLazy = <T>(
  s: Signal<T>,
  predicate: (value: T) => boolean,
  fallback: T,
): Signal<T> => ({
  get read(): T {
    const v = s.read;
    return predicate(v) ? v : fallback;
  },

  write(_value: T): void {
    // no-op
  },

  watch(cb: (value: T) => void): () => void {
    return s.watch((v) => {
      if (predicate(v)) cb(v);
    });
  },
});

/**
 * Lazy combine of two signals into a tuple signal. No stored state.
 */
export const zipLazy = <T, U>(a: Signal<T>, b: Signal<U>): Signal<[T, U]> => ({
  get read(): [T, U] {
    return [a.read, b.read];
  },

  write(_value: [T, U]): void {
    // no-op
  },

  watch(cb: (value: [T, U]) => void): () => void {
    const fire = () => cb([a.read, b.read]);
    const unsubA = a.watch(fire);
    const unsubB = b.watch(fire);
    return () => {
      unsubA();
      unsubB();
    };
  },
});

/**
 * Lazy merge of N signals into an array signal. No stored state.
 */
export const mergeLazy = <T extends readonly Signal<unknown>[]>(
  signals: [...T],
): Signal<{ [K in keyof T]: T[K] extends Signal<infer V> ? V : never }> => {
  const readAll = () => signals.map((s) => s.read);

  return {
    get read() {
      return readAll();
    },

    write(_value: unknown[]): void {
      // no-op
    },

    watch(cb: (value: unknown[]) => void): () => void {
      const unsubs = signals.map((s) => s.watch(() => cb(readAll())));
      return () => {
        for (const u of unsubs) u();
      };
    },
  } as Signal<{
    [K in keyof T]: T[K] extends Signal<infer V> ? V : never;
  }>;
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
  unwatch,
  once,
  when,
  not,
  onceSignal,
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
  mapLazy,
  derive,
  flatMapLazy,
  filterLazy,

  // Extract
  getOr,
  getOrNull,
  getOrUndefined,

  // Combine
  zip,
  merge,
  combine,
  zipReactive,
  mergeReactive,
  zipLazy,
  mergeLazy,
  apply,
  orElse,
  tap,
  tapWatch,

  // Utilities
  previous,
  distinct,
};

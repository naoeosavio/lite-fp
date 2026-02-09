# lite-fp

Tiny, zero‑dependency FP helpers for TypeScript.

- Algebraic data types: `Option`, `Either`, `Result`, `Maybe`
- Product types: `Pair`
- Small, predictable API with discriminated unions
- ESM and CJS builds, first‑class TypeScript types

## Install

```sh
npm i lite-fp
# or
pnpm add lite-fp
```

## Import

```ts
// ESM
import {
  Option,
  Either,
  Result,
  Pair,
  some,
  none,
  right,
  left,
} from "lite-fp";

// CJS
const {
  Option,
  Either,
  Result,
  Pair,
  some,
  none,
  right,
  left,
} = require("lite-fp");
```

## Quick Start

### Option

```ts
import { Option, some, none } from "lite-fp";

const o1 = Option.new("hello"); // Some("hello")
const o2 = Option.new(null); // None

const upper = Option.map(o1, s => s.toUpperCase()); // Some("HELLO")

const value = Option.getOrElse(o2, "fallback"); // "fallback"

```

### Maybe (T | null | undefined)

```ts
import { Maybe } from "lite-fp";

const m1 = Maybe.new(42); // 42
const m2 = Maybe.new(null); // undefined (None)

const doubled = Maybe.map(m1, x => x * 2); // 84
const value = Maybe.getOrElse(m2, 0); // 0

if (Maybe.isSome(m1)) {
  // m1 is number here
}
```

### Either (A | B)

```ts
import { Either, left, right } from "lite-fp";

type Err = { message: string };

const parseJson = (s: string) =>
  Either.fromThrowable(
    () => JSON.parse(s),
    e => ({ message: String(e) }) as Err,
  );

const e1 = parseJson('{"a":1}'); // Right({ a: 1 })
const e2 = parseJson("invalid"); // Left({ message: "..." })

const msg = Either.fold(
  e2,
  l => `err: ${l.message}`,
  r => `ok: ${Object.keys(r).length}`,
); // => "err: ..."
```

Promise helper

```ts
// Adds Promise.prototype.toEither(onError)
const user = await fetch("/api/user")
  .then(r => r.json())
  .toEither(e => new Error(String(e))); // Either<Error, User>
```

### Result (Done | Fail)

```ts
import { Result } from "lite-fp";

const r1 = Result.new("data", "nope"); // Done("data")
const r2 = await Result.fromPromise(
  Promise.reject("x"),
  e => new Error(String(e)),
);

const safe = Result.recover(r2, () => "default"); // Done("default")
```

 
### Pair 

```ts
import { Pair, pair } from "lite-fp";

const p = pair(1, "a"); // Pair<number, string>
const p2 = Pair.map(
  p,
  x => x + 1,
  s => s.toUpperCase(),
); // [2, "A"]

```

## API Overview

- Option
  - Constructors: `none`, `some`, `new`, `fromNullable`, `fromPredicate`, `fromThrowable`, `fromPromise`
  - Type guards: `isSome`, `isNone`
  - Ops: `map`, `flatMap`, `filter`, `match`,  `getOrElse`, `getOrUndefined`, `getOrThrow`
  - Combine: `zip`, `apply`, `orElse`

- Either
  - Constructors: `left`, `right`, `new`, `fromNullable`, `fromThrowable`, `fromPromise`
  - Type guards: `isLeft`, `isRight`
  - Ops: `map`, `mapLeft`, `bimap`, `flatMap`, `chain`, `fold`, `match`, `swap`, `getOrElse`, `zip`, `apply`, `tap`, `tapLeft`

- Result
  - Constructors: `done`, `fail`, `new`, `fromNullable`, `fromThrowable`, `fromPromise`
  - Type guards: `isDone`, `isFail`
  - Ops: `map`, `mapError`, `flatMap`, `match`, `recover`, `getOrElse`, `getOrThrow`, `zip`, `apply`

- Maybe (T | null | undefined)
  - Constructors: `new`, `just`, `nothing`/`nothingNull`/`nothingUndefined`, `fromNullable`, `fromPredicate`, `fromThrowable`, `fromPromise`
  - Type guards: `isSome`, `isNothing`
  - Ops: `map`, `flatMap`, `filter`, `match`, `zip`, `apply`, `orElse`
  - Extract: `getOrElse`, `getOrUndefined`, `getOrThrow`

- Pair 
  - `pair`, and utilities to map, zip, convert to/from arrays/objects.

See `src/` for the full, well‑typed surface.

## Differences: Result/Either vs Maybe/Option

- Either vs Result
  - Both are discriminated unions with rich operations.
  - Either represents two generic branches (Left/Right) and is often used for domain errors (Left) vs success (Right).
  - Result represents success (`Done`) or failure (`Fail`) explicitly and includes helpers like `recover` and `getOrUndefined`.
  - Choose based on semantics and style; the APIs are similar.

- Maybe vs Option
  - Maybe is `T | null | undefined` (lightweight and idiomatic in JS). No runtime tag; use `== null` or the provided guards to narrow.
  - Option is a discriminated union (`{ $: "Some" } | { $: "None" }`) with stable guards (`isSome`, `isNone`) and utility functions.
  - Use Maybe when interoperating with APIs that naturally return `null/undefined`; use Option when you want an explicit ADT and consistent operations.

## Notes

- Prototype additions
  - `Promise.prototype.toEither(onError)` is provided when `Either` is imported.
  - `Promise.prototype.toResult(onError)` is provided when `Result` is imported.
  - `Array.prototype.firstOption()` is provided when `Option` is imported.
  - No runtime dependencies. Fully typed. Tree‑shakeable.

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

Distributed under the MIT License. See the [LICENSE](LICENSE) file for more details.

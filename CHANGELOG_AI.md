# Changelog

## v0.8.0 — 2026-07-27

### Features
- Configure package subpath exports and TypeScript declarations for optimized tree-shaking

### Refactors
- Update type guards and streamline `Maybe` tap implementation
- Extract global prototype augmentations into a dedicated `extensions.ts` module

### Tests
- Add comprehensive test suites for functional programming primitives, monads, and prototype extensions
- Introduce a lightweight, zero-dependency test runner and assertion utility framework
- Include test execution in the CI pipeline

---

## v0.7.0 — 2026-06-03

Breaking Changes
- **`fromPromiseSettled` is no longer exported from the `Either` and `Result` namespaces** – it remains available as a top-level function only.
- **Removed the `mapErr` and `tapErr` aliases** for `Result`; use `mapFail` and `tapFail` instead.

Features
- Added **collection operations** for arrays of `Either` and `Result`: `all`/`collect`, `flatten`, and `partition`.
- Broadened module exports to include previously internal utility functions: `mapLeft`, `tapLeft`, `mapFail`, `tapFail`, `nothingNull`, `nothingUndefined`, and others.
- Introduced **callback-based async conversions** `fromPromiseCallback` and `flatMapCallback` for `Either` and `Result`, enabling fire-once flows without persistent subscriptions.
- Added `flatMap` as an alias for `chain` in `Either` and `Result`.

Fixes
- **Prototype safety**: `Promise.prototype.toEither`, `Promise.prototype.toOption`, `Promise.prototype.toResult`, and `Array.prototype.firstOption` now use `Object.defineProperty` with existence checks to avoid conflicts with polyfills or other libraries.
- **`Maybe.fromNullable`** now correctly returns `nothing()` for `null` or `undefined` inputs and `just(value)` for all other values (using a `== null` check).
- **Error wrapping**: `Either.getOrThrow` and `Result.getOrThrow` now wrap non‑Error thrown values in `Error` instances for consistent error handling.

---

## [0.6.0] - 2026-05-28

### Features

- Introduce `Option`, `Either`, `Result`, and `Pair` algebraic data types with constructors, guards, and a comprehensive set of operations.
- Add `Maybe` type with constructors, guards, conversions, and operations including `filter`, `getOrNull`, `getOrUndefined`, `getOrThrow`, `tap`, `fromPredicate`, and `fold`.
- Add `fold`, `getOrNull`, and `tap` functions to `Option`.
- Add `bimap`, `fold`, `chain`, `getOrNull`, `orElse`, `filter`, `tap`, and `tapError` to `Result`.
- Add `getLeft`, `getRight`, `getOrUndefined`, `getOrThrow`, `filter`, `getOrNull`, and `orElse` to `Either`.
- Add `fold` and `match` aliases to `Pair` for destructuring.
- Add `val` and `err` accessor functions to `Result`, with aliases `OK`, `Err`, `isOk`, and `isErr`.
- Add `.new` aliases for `fromNullable` constructors in all modules.
- Add `Promise.prototype.toOption` and `Promise.prototype.toEither` extension methods.
- Add a benchmark script for evaluating tag representation performance.

### Fixes

- Export `Maybe` module and previously missing guards/accessors from the main index (`isLeft`, `isRight`, `getLeft`, `getRight`, `isJust`, `isNothing`, `isNone`, `isSome`, `unwrap`, `fst`, `snd`, `isDone`, `isErr`, `isFail`, `isOk`, `Ok`, `Err`, `val`, `err`).

### Refactors

- Simplify `Nothing` type in Maybe and rename `isNothingNull`/`isNothingUndefined` to `isNull`/`isUndefined`.
- Reorganize exports and module structures across all types for logical grouping and maintainability.
- Rename `getLeft`/`getRight` to `lft`/`rgt` in Either for brevity.
- Rename `apply` to `app`, `apply2` to `apply`, and `equals` to `eql` in Pair for consistency.
- Use guard functions (`isLeft`/`isRight`, `isJust`/`isNothing`, etc.) throughout modules to improve type safety.
- Convert module exports to individual function exports for tree-shaking, while keeping backward-compatible namespaces.
- Simplify internal implementations in Result, Option, and other modules.
- Update internal field names in Result to `v`/`e` for conciseness.
- Move `filter` to the Ops section in Result.
- Update `Promise.prototype.toEither` to use `fromPromise` internally.
- Update `Array.prototype.firstOption` to use standalone functions.

### Documentation

- Add `Maybe` documentation to the README, remove outdated `Triple` references, and clarify type differences.
- Add repository metadata, contributing guidelines, and MIT license.

### Chores

- Update dependencies (esbuild, tsup) and introduce Biome in place of Prettier.
- Adjust TypeScript target and module settings to ES6/ES2020.
- Update package configuration with keywords and improved exports.
- Add a benchmark script for internal performance tracking.

### Breaking Changes

- **Package rename**: `tiny-fp` is now `lite-fp`.
- **Removal of `Triple`**: The `Triple` algebraic data type has been removed in its entirety.
- **`Option`**: Rename `get` to `unwrap`.
- **`Maybe`**: Rename `isSome` to `isJust`; remove `unwrap` export (use `getOrThrow` or `getOrUndefined` instead); rename constructor from `None` to `Nothing`.
- **`Either`**: Rename `getLeft`/`getRight` to `lft`/`rgt`; `Either.zip` now returns a tuple `[A, B]` instead of a `Pair<A, B>`.
- **`Result`**: Rename `new` to `make` (and later removed `make` constructors; use `.new` aliases or direct construction); remove `toOption`; remove `unwrap`; modify `getOrThrow` to throw a generic `Error` without a callback; rename constructor aliases: `done` → `OK`, `fail` → `Err`, `isDone` → `isOk`, `isFail` → `isErr`; `Result.zip` returns a tuple instead of a `Pair`.
- **`Pair`**: Rename `apply` to `app`, `apply2` to `apply`, `equals` to `eql`; remove `traverseOption` and `traverseResult` functions.
- **Module exports**: Remove namespace aliases (`OptionNS`, `EitherNS`, etc.); use direct function imports instead.
- **`Promise.prototype.toResult`**: Now requires an `onError` parameter.

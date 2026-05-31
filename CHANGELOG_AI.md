# Changelog

## Unreleased - 2026-05-28

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

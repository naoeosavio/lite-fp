type TestFn = () => void | Promise<void>;

interface TestCase {
  name: string;
  fn: TestFn;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface Suite {
  name: string;
  tests: TestCase[];
  children: Suite[];
  beforeEachFns: TestFn[];
}

const rootSuites: Suite[] = [];
let currentSuite: Suite | null = null;

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
  );
}

export function describe(name: string, fn: () => void): void {
  const suite: Suite = {
    name,
    tests: [],
    children: [],
    beforeEachFns: [],
  };
  const parent = currentSuite;
  if (parent) {
    parent.children.push(suite);
  } else {
    rootSuites.push(suite);
  }
  currentSuite = suite;
  fn();
  currentSuite = parent;
}

export function test(name: string, fn: TestFn): void {
  const target = currentSuite;
  if (!target) {
    rootSuites.push({
      name: "",
      tests: [{ name, fn }],
      children: [],
      beforeEachFns: [],
    });
    return;
  }
  target.tests.push({ name, fn });
}

export function beforeEach(fn: TestFn): void {
  if (currentSuite) {
    currentSuite.beforeEachFns.push(fn);
  }
}

function indent(level: number): string {
  return "  ".repeat(level);
}

async function runSuite(
  suite: Suite,
  depth: number,
): Promise<{ passed: number; failed: number; results: TestResult[] }> {
  let passed = 0;
  let failed = 0;
  const results: TestResult[] = [];

  if (suite.name) {
    console.log(`\n${indent(depth)}${CYAN}${suite.name}${RESET}`);
  }

  for (const child of suite.children) {
    const childResults = await runSuite(child, depth + 1);
    passed += childResults.passed;
    failed += childResults.failed;
    results.push(...childResults.results);
  }

  for (const testCase of suite.tests) {
    const result: TestResult = { name: testCase.name, passed: true };

    try {
      for (const before of suite.beforeEachFns) {
        await before();
      }
      await testCase.fn();
    } catch (e) {
      result.passed = false;
      result.error = e instanceof Error ? e.message : String(e);
    }

    const status = result.passed
      ? `${GREEN}✓${RESET}`
      : `${RED}✗${RESET}`;
    const errMsg = result.error ? `\n${indent(depth + 1)}${RED}  → ${result.error}${RESET}` : "";
    console.log(
      `${indent(depth + 1)}${status} ${DIM}${result.name}${RESET}${errMsg}`,
    );

    if (result.passed) passed++;
    else failed++;

    results.push(result);
  }

  return { passed, failed, results };
}

export async function run(): Promise<void> {
  console.log(`\n${YELLOW}=== lite-fp test suite ===${RESET}\n`);

  const start = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of rootSuites) {
    const { passed, failed } = await runSuite(suite, 0);
    totalPassed += passed;
    totalFailed += failed;
  }

  const elapsed = Date.now() - start;
  const total = totalPassed + totalFailed;

  console.log(
    `\n${YELLOW}${total} tests${RESET} | ${GREEN}${totalPassed} passed${RESET} | ${RED}${totalFailed} failed${RESET} | ${DIM}${elapsed}ms${RESET}\n`,
  );

  if (totalFailed > 0) {
    process.exit(1);
  }
}

// ── Matchers ──────────────────────────────────────────────────────

class Expectation<T> {
  constructor(
    private actual: T,
    private negated = false,
  ) {}

  private assert(condition: boolean, message: string): void {
    const ok = this.negated ? !condition : condition;
    if (!ok) {
      const prefix = this.negated ? "Expected not" : "Expected";
      throw new Error(`${prefix} ${message}`);
    }
  }

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.negated);
  }

  toBe(expected: T): void {
    this.assert(this.actual === expected, `${inspect(this.actual)} to be ${inspect(expected)}`);
  }

  toEqual(expected: T): void {
    this.assert(deepEqual(this.actual, expected), `${inspect(this.actual)} to equal ${inspect(expected)}`);
  }

  toBeTruthy(): void {
    this.assert(!!this.actual, `${inspect(this.actual)} to be truthy`);
  }

  toBeFalsy(): void {
    this.assert(!this.actual, `${inspect(this.actual)} to be falsy`);
  }

  toBeNull(): void {
    this.assert(this.actual === null, `${inspect(this.actual)} to be null`);
  }

  toBeUndefined(): void {
    this.assert(this.actual === undefined, `${inspect(this.actual)} to be undefined`);
  }

  toBeTypeOf(type: string): void {
    this.assert(typeof this.actual === type, `${inspect(this.actual)} to be typeof ${type}`);
  }

  toContain(item: unknown): void {
    if (Array.isArray(this.actual)) {
      this.assert(
        (this.actual as unknown[]).includes(item),
        `array to contain ${inspect(item)}`,
      );
    } else if (typeof this.actual === "string") {
      this.assert(
        (this.actual as string).includes(String(item)),
        `string "${this.actual}" to contain "${String(item)}"`,
      );
    } else {
      throw new Error(`toContain only works with arrays and strings, got ${typeof this.actual}`);
    }
  }

  toThrow(messageOrType?: string | (new (...args: unknown[]) => Error)): void {
    if (typeof this.actual !== "function") {
      throw new Error(`Expected a function but got ${typeof this.actual}`);
    }
    try {
      (this.actual as () => unknown)();
    } catch (e) {
      const thrown = this.negated
        ? "not to throw but it did"
        : this.checkThrowError(e, messageOrType);
      if (thrown) throw new Error(thrown);
      return;
    }
    this.assert(false, "function to throw but it did not");
  }

  private checkThrowError(
    e: unknown,
    messageOrType?: string | (new (...args: unknown[]) => Error),
  ): string | null {
    if (messageOrType === undefined) return null;

    if (typeof messageOrType === "string") {
      if (e instanceof Error && e.message === messageOrType) return null;
      return `function to throw with message "${messageOrType}" but got "${e instanceof Error ? e.message : String(e)}"`;
    }

    if (e instanceof (messageOrType as new (...args: unknown[]) => Error)) return null;
    return `function to throw instance of ${(messageOrType as new (...args: unknown[]) => Error).name} but got ${(e as Error)?.constructor?.name ?? String(e)}`;
  }

  toReturn(): void {
    if (typeof this.actual !== "function") {
      throw new Error(`Expected a function but got ${typeof this.actual}`);
    }
    try {
      (this.actual as () => unknown)();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Expected function to return without throwing but it threw: ${msg}`);
    }
  }

  toHaveLength(length: number): void {
    if (!("length" in (this.actual as object))) {
      throw new Error(`Expected value with .length but got ${typeof this.actual}`);
    }
    const actualLen = (this.actual as { length: number }).length;
    this.assert(actualLen === length, `length to be ${length} but got ${actualLen}`);
  }

  toBeInstanceOf(type: new (...args: unknown[]) => unknown): void {
    this.assert(
      this.actual instanceof type,
      `${inspect(this.actual)} to be instance of ${type.name}`,
    );
  }
}

function inspect(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

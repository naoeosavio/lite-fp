export type TestFn = () => void | Promise<void>;

type TestCase = { name: string; fn: TestFn };

const cases: TestCase[] = [];

export const describe = (name: string, fn: () => void) => {
  console.log(`\n-- ${name} --`);
  fn();
};

export const it = (name: string, fn: TestFn) => {
  cases.push({ name, fn });
};

export const assert = {
  equal: (actual: any, expected: any, message: string = `Expected ${expected}, got ${actual}`) => {
    if (actual !== expected) {
      throw new Error(message);
    }
  },
  notEqual: (actual: any, expected: any, message: string = "Values should differ") => {
    if (actual === expected) {
      throw new Error(message);
    }
  },
  ok: (condition: boolean, message: string = "Assertion failed") => {
    if (!condition) {
      throw new Error(message);
    }
  },
  deepEqual: (actual: any, expected: any, message: string = "Objects not deeply equal") => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message);
    }
  },
  throws: (fn: () => void, expected: string = "Function should throw") => {
    try {
      fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== expected) {
        throw new Error(`Expected error message "${expected}", got "${msg}"`);
      }
      return;
    }
    throw new Error(expected);
  },
};

export async function run_all_tests(): Promise<void> {
  let success = 0;
  let failed = 0;

  for (const test of cases) {
    try {
      await test.fn();
      success++;
      console.log(`  \x1b[32m✓\x1b[0m ${test.name}`);
    } catch (e: any) {
      failed++;
      console.log(`  \x1b[31m✗\x1b[0m ${test.name}`);
      console.error(`    ${e?.message ?? e}`);
    }
  }

  if (failed > 0) {
    console.log(`\n\x1b[31m${failed} of ${cases.length} tests failed.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n\x1b[32mAll ${success} tests passed.\x1b[0m`);
}

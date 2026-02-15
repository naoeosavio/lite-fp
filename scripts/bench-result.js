import { left, right} from "../dist/index.js";

/* Quick micro-benchmark: tag check + object creation
   Schemes:
   1) String tag: { $: 'Done'|'Fail' }
   2) Boolean tag (always present): { done: true|false }
   3) Optional boolean on Fail only: Done has { done: true }, Fail omits 'done'
*/
const ITER = Number(process.env.ITER || 100_000_000);

const bench = (name, fn) => {
  // Warmup
  fn();
  const t0 = process.hrtime.bigint();
  const res = fn();
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;
  const ops = Math.round(ITER / (Number(t1 - t0) / 1e9));
  console.log(`${name.padEnd(32)} (sum=${res})\n ${ms.toFixed(2)} ms ${ops.toLocaleString().padStart(15)} ops/s`); 
};

// 1) String tag
const runStr = () => {
  let acc = 0;
  for (let i = 0; i < ITER; i++) {
    const r = (i & 1) === 0 ? right(i) : left(i);
    if (r.$ === 'Right') acc += r.value;
  }
  return acc;
};

// 2) Boolean tag (always present)

const doneBool = (v) => ({ $: true, v });
const failBool = (e) => ({ $: false, e });
const runBool = () => {
  let acc = 0;
  for (let i = 0; i < ITER; i++) {
    const r = (i & 1) === 0 ? doneBool(i) : failBool(i);
    if (r.$) acc += r.v;
  }
  return acc;
};

// 3) Optional boolean on Fail (proposed)
const isDone = (s) => 'v' in s;
const doneOpt = (v) => ({ v });
const failOpt = (e) => ({ e }); // no 'done' property
console.log(failOpt({v: "error"}));
console.log(isDone(failOpt({v: "error"})));
const runOpt = () => {
  let acc = 0;
  for (let i = 0; i < ITER; i++) {
    const r = (i & 1) === 0 ? doneOpt(i) : failOpt(i);
    if (isDone(r)) acc += r.v;
  }
  return acc;
};

// 4) bit obj 
const isDoneBitObj = (o) => o.$ === 1;
const doneBitObj = (v) => ({ $: 1, v });
const failBitObj = (e) => ({ $: 0, e });
const runBitObj = () => {
  let acc = 0;
  for (let i = 0; i < ITER; i++) {
    const r = (i & 1) === 0 ? doneBitObj(i) : failBitObj(i);
    if (isDoneBitObj(r)) acc += r.v;
  }
  return acc;
};

// 5) bit array \
const isDoneBitArray = (a) => a[0] === 1;
const doneBitArray = (v) => [1, v];
const failBitArray = (e) => [0, e];
const runBitArray = () => {
  let acc = 0;
  for (let i = 0; i < ITER; i++) {
    const r = (i & 1) === 0 ? doneBitArray(i) : failBitArray(i);
    if (isDoneBitArray(r)) acc += r[1];
  }
  return acc;
};


console.log(`Node ${process.version}, ITER=${ITER.toLocaleString()}`);
bench('string tag  ($ === "Done")', runStr);
bench('bool tag    (done === true)', runBool);
bench('optional    (v in r)', runOpt);
bench('bitobj     (done === 1)', runBitObj);
bench('bitarry     (done === 1)', runBitArray);


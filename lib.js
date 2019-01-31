const Y = f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)));

const I = x => x;
const B = f => g => x => f(g(x));
const C = f => x => y => f(y)(x);
const K = x => y => x;
const W = f => x => f(x)(x);

const u = true;

const _thunk = thunk => ({ _tag: 'Thunk', thunk, forced: false, val: null });
const f = t => {
  if (!t.forced) {
    t.forced = true;
    t.val = t.thunk();
  }
  return t.val;
};
const g = x => t => _thunk(() => x(f(t)));

const s = x => x + 1n;
const n = z => s => n => n === 0n ? f(z) : s(n - 1n);
const i = z => s => n => {
  let c = 0n;
  let x = f(z);
  while (c < n) {
    x = s(x);
    c++;
  }
  return x;
};
const r = z => s => n => {
  let c = 0n;
  let x = f(z);
  while (c < n) {
    x = s(c)(x);
    c++;
  }
  return x;
};

const a = x => y => x + y;
const b = x => y => x > y ? x - y : 0;
const m = x => y => x * y;
const d = x => y => x / y;

const P = x => y => [x, y];
const F = p => p[0];
const S = p => p[1];

const L = x => ({ _tag: 'L', val: x });
const R = x => ({ _tag: 'R', val: x });
const M = l => r => x => x._tag === 'L' ? l(x.val) : r(x.val);

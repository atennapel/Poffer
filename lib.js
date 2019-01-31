const A = f => x => f(x);
const B = f => g => x => f(g(x));
const C = f => x => y => f(y)(x);
const D = f => g => x => y => f(g(x)(y));
const E = f => g => x => y => z => f(g(x)(y)(z));
const F = f => g => h => x => f(g(x))(h(x));
const G = f => g => h => x => y => f(g(x)(y))(h(x)(y));
const H = f => g => h => x => y => z => f(g(x)(y)(z))(h(x)(y)(z));
const I = x => x;
const K = x => y => x;
const L = f => g => h => x => y => f(g(x))(h(y));
const M = f => g => h => i => x => y => z => f(g(x))(h(y))(i(z));
const R = x => y => y;
const S = f => g => x => f(x)(g(x));
const T = x => f => f(x);
const W = f => x => f(x)(x);
const Y = f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)));

const u = { _tag: 'Unit' };
const t = true;
const f = false;

const _thunk = thunk => ({ _tag: 'Thunk', thunk, forced: false, val: null });
const x = t => {
  if (!t.forced) {
    t.forced = true;
    t.val = t.thunk();
  }
  return t.val;
};
const y = _thunk;
const z = q => t => _thunk(() => q(x(t)));

const m$s = x => x + 1n;
const m$i = z => s => n => {
  let c = 0n;
  let q = x(z);
  while (c < n) {
    q = s(x);
    c++;
  }
  return q;
};
const m$r = z => s => n => {
  let c = 0n;
  let q = x(z);
  while (c < n) {
    q = s(c)(q);
    c++;
  }
  return q;
};
const m$a = x => y => x + y;
const m$b = x => y => x > y ? x - y : 0;
const m$m = x => y => x * y;
const m$d = x => y => x / y;

const p = x => y => [x, y];
const l = x => ({ _tag: 'L', val: x });
const r = x => ({ _tag: 'R', val: x });

const q$u = t => () => x(t);
const q$v = () => { throw new Error('Void') };
const q$n = z => s => n => n === 0n ? x(z) : s(n - 1n);
const q$p = f => p => f(p[0])(p[1]);
const q$s = l => r => x => x._tag === 'L' ? l(x.val) : r(x.val);
const q$b = fa => fb => q => q ? x(fa) : x(fb);

const n = () => [];
const a = x => a => { a.push(x); return a };
const o = a => a.length === 0 ? [a, L(u)] : [a, R(a.pop())];

const t$u = { _tag: 'Type', name: 'Unit' };
const t$v = { _tag: 'Type', name: 'Void' };
const t$n = { _tag: 'Type', name: 'Nat' };
const t$b = { _tag: 'Type', name: 'Bool' };
const t$f = x => y => ({ _tag: 'Type', name: '->', args: [x, y] });
const t$p = x => y => ({ _tag: 'Type', name: '*', args: [x, y] });
const t$s = x => y => ({ _tag: 'Type', name: '+', args: [x, y] });
const t$t = x => ({ _tag: 'Type', name: 'Thunk', args: [x] });
const t$m = x => ({ _tag: 'Type', name: 'MutArray', args: [x] });
const t$r = x => ({ _tag: 'Type', name: 'Ref', args: [x] });
const t$T = x =>
  typeof x === 'bigint' ? R(t$n) :
  typeof x === 'boolean' ? R(t$b) :
  x._tag === 'Unit' ? R(t$u) :
  L(u);

const v = x => ({ _tag: 'Ref', val: x });
const g = x => [x, x.val];
const s = x => r => { r.val = x; return r };

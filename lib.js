const I = x => x;
const B = f => g => x => f(g(x));
const C = f => x => y => f(y)(x);
const F = f => g => h => x => f(g(x))(h(x));
const K = x => y => x;
const S = f => g => x => f(x)(g(x));
const W = f => x => f(x)(x);
const Y = f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)));

const u = { _tag: 'Unit' };

const _thunk = thunk => ({ _tag: 'Thunk', thunk, forced: false, val: null });
const f = t => {
  if (!t.forced) {
    t.forced = true;
    t.val = t.thunk();
  }
  return t.val;
};
const z = x => t => _thunk(() => x(f(t)));

const m$s = x => x + 1n;
const m$i = z => s => n => {
  let c = 0n;
  let x = f(z);
  while (c < n) {
    x = s(x);
    c++;
  }
  return x;
};
const m$r = z => s => n => {
  let c = 0n;
  let x = f(z);
  while (c < n) {
    x = s(c)(x);
    c++;
  }
  return x;
};
const m$a = x => y => x + y;
const m$b = x => y => x > y ? x - y : 0;
const m$m = x => y => x * y;
const m$d = x => y => x / y;

const P = x => y => [x, y];
const L = x => ({ _tag: 'L', val: x });
const R = x => ({ _tag: 'R', val: x });

const q$u = t => () => f(t);
const q$v = () => { throw new Error('Void') };
const q$n = z => s => n => n === 0n ? f(z) : s(n - 1n);
const q$p = f => p => f(p[0])(p[1]);
const q$s = l => r => x => x._tag === 'L' ? l(x.val) : r(x.val);

const N = () => [];
const A = x => a => { a.push(x); return u };
const O = a => a.length === 0 ? L(u) : R(a.pop());

const t$u = { _tag: 'Type', name: 'Unit' };
const t$v = { _tag: 'Type', name: 'Void' };
const t$n = { _tag: 'Type', name: 'Nat' };
const t$f = x => y => ({ _tag: 'Type', name: '->', args: [x, y] });
const t$p = x => y => ({ _tag: 'Type', name: '*', args: [x, y] });
const t$s = x => y => ({ _tag: 'Type', name: '+', args: [x, y] });
const t$t = x => ({ _tag: 'Type', name: 'Thunk', args: [x] });
const t$m = x => ({ _tag: 'Type', name: 'MutArray', args: [x] });
const t$r = x => ({ _tag: 'Type', name: 'Ref', args: [x] });
const t$T = x =>
  typeof x === 'bigint' ? R(t$n) :
  x._tag === 'Unit' ? R(t$u) :
  L(u);

const r = x => ({ _tag: 'Ref', val: x });
const g = x => x.val;
const s = x => r => { r.val = x; return u };

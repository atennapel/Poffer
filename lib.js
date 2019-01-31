const Y = f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)));

const I = x => x;
const B = f => g => x => f(g(x));
const C = f => x => y => f(y)(x);
const K = x => y => x;
const W = f => x => f(x)(x);

const u = true;
const i = x => x + 1n;
const j = x => x - 1n;

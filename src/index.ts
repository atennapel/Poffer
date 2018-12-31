// util
const impossible = (msg: string = '') => {
  throw new Error(`impossible${msg ? `: ${msg}` : ''}`);
};

// names
type Id = number;
let id = 0;
const freshId = () => id++;
const resetId = () => { id = 0 };

type Name = string;

// types
type Type = TConst | TVar | TMeta | TFun;

interface TConst {
  readonly tag: 'TConst';
  readonly name: Name;
}
const TConst = (name: Name): TConst => ({ tag: 'TConst', name });
const isTConst = (type: Type): type is TConst => type.tag === 'TConst';

interface TVar {
  readonly tag: 'TVar';
  readonly name: Id;
}
const TVar = (name: Id): TVar => ({ tag: 'TVar', name });
const isTVar = (type: Type): type is TVar => type.tag === 'TVar';

interface TMeta {
  readonly tag: 'TMeta';
  readonly name: Id;
  type: Type | null;
}
const TMeta = (name: Id, type: Type | null): TMeta => ({ tag: 'TMeta', name, type });
const isTMeta = (type: Type): type is TMeta => type.tag === 'TMeta';
const freshTMeta = (): TMeta => TMeta(freshId(), null);

interface TFun {
  readonly tag: 'TFun';
  readonly left: Type;
  readonly right: Type;
}
const TFun = (left: Type, right: Type): TFun => ({ tag: 'TFun', left, right });
const isTFun = (type: Type): type is TFun => type.tag === 'TFun';

const showType = (type: Type): string => {
  if (isTConst(type)) return `${type.name}`;
  if (isTVar(type)) return `'${type.name}`;
  if (isTMeta(type)) return `?${type.name}`;
  if (isTFun(type)) return `(${showType(type.left)} -> ${showType(type.right)})`;
  return impossible('showType');
};

// exprs
type Expr = Var | Abs | App;

interface Var {
  readonly tag: 'Var';
  readonly name: Name;
}
const Var = (name: Name): Var => ({ tag: 'Var', name });
const isVar = (expr: Expr): expr is Var => expr.tag === 'Var';

interface Abs {
  readonly tag: 'Abs';
  readonly arg: Name;
  readonly body: Expr;
}
const Abs = (arg: Name, body: Expr): Abs => ({ tag: 'Abs', arg, body });
const isAbs = (expr: Expr): expr is Abs => expr.tag === 'Abs';

interface App {
  readonly tag: 'App';
  readonly left: Expr;
  readonly right: Expr;
}
const App = (left: Expr, right: Expr): App => ({ tag: 'App', left, right });
const isApp = (expr: Expr): expr is App => expr.tag === 'App';

const showExpr = (expr: Expr): string => {
  if (isVar(expr)) return `${expr.name}`;
  if (isAbs(expr)) return `(\\${expr.arg} -> ${showExpr(expr.body)})`;
  if (isApp(expr)) return `(${showExpr(expr.left)} ${showExpr(expr.right)})`;
  return impossible('showExpr');
};

// unification
const prune = (type: Type): Type => {
  if (isTMeta(type)) {
    if (!type.type) return type;
    const ty = prune(type.type);
    type.type = ty;
    return ty;
  }
  if (isTFun(type)) return TFun(prune(type.left), prune(type.right));
  return type;
};

const occurs = (tv: Id, type: Type): boolean => {
  if (isTMeta(type)) return type.name === tv;
  if (isTFun(type)) return occurs(tv, type.left) || occurs(tv, type.right);
  return false;
};

const bind = (tv: TMeta, type: Type): void => {
  if (isTMeta(type) && type.name === tv.name) return;
  if (occurs(tv.name, type))
    throw new TypeError(`occurs check failed: ${showType(tv)} in ${showType(type)}`);
  tv.type = type;
};

const unify = (a_: Type, b_: Type): void => {
  const a = prune(a_);
  const b = prune(b_);
  if (a === b) return;
  if (isTMeta(a)) return bind(a, b);
  if (isTMeta(b)) return bind(b, a);
  if (isTVar(a) && isTVar(b) && a.name === b.name) return;
  if (isTConst(a) && isTConst(b) && a.name === b.name) return;
  if (isTFun(a) && isTFun(b)) {
    unify(a.left, b.left);
    unify(a.right, b.right);
    return;
  }
  throw new TypeError(`cannot unify ${showType(a)} ~ ${showType(b)}`);
};

// inference
type Env = { [key: string]: Type };

const showEnv = (env: Env): string => {
  const r = [];
  for (let k in env) r.push(`${k} : ${showType(env[k])}`);
  return `{${r.join(', ')}}`;
};

const inst = (type: Type, map: { [key: string]: Type } = {}): Type => {
  if (isTVar(type)) return map[type.name] || (map[type.name] = freshTMeta());
  if (isTFun(type)) return TFun(inst(type.left, map), inst(type.right, map));
  return type;
};

const genTop = (type: Type): Type => {
  if (isTMeta(type)) return TVar(type.name);
  if (isTFun(type)) return TFun(genTop(type.left), genTop(type.right));
  return type;
};

const infer = (env: Env, expr: Expr): Type => {
  if (isVar(expr)) {
    if (!env[expr.name]) throw new TypeError(`undefined var ${expr.name}`);
    return inst(env[expr.name]);
  }
  if (isAbs(expr)) {
    const tv = freshTMeta();
    const old: Type | null = env[expr.arg] || null;
    env[expr.arg] = tv;
    const ty = infer(env, expr.body);
    if (old) env[expr.arg] = old;
    else delete env[expr.arg];
    return TFun(tv, ty);
  }
  if (isApp(expr)) {
    const tl = infer(env, expr.left);
    const tr = infer(env, expr.right);
    const tv = freshTMeta();
    unify(tl, TFun(tr, tv));
    return tv;
  }
  return impossible('infer');
};

const inferTop = (env: Env, expr: Expr): Type => {
  resetId();
  return genTop(prune(infer(env, expr)));
};

const inferDefs = (ds: Defs, env: Env = {}): Env => {
  const main = ds.findIndex(([x, _]) => x === 'main');
  if (main === -1) throw new TypeError('no main function');
  for (let i = 0, l = ds.length; i < l; i++) {
    const d = ds[i];
    const ty = inferTop(env, d[1]);
    env[d[0]] = ty;
  }
  unify(env.main, TFun(freshTMeta(), freshTMeta()));
  return env;
};

// reduction
let varId = 0;
const freshVarId = () => varId++;
const resetVarId = () => { varId = 0 };
const freshVar = (name: Name): Name => `${name.split('$')[0]}\$${freshVarId()}`;

type Inlines = { [key: string]: Expr };

type Free = { [key: string]: true };
const free = (expr: Expr, map: Free = {}): Free => {
  if (isVar(expr)) { map[expr.name] = true; return map }
  if (isAbs(expr)) {
    free(expr.body, map);
    delete map[expr.arg];
    return map;
  }
  if (isApp(expr)) {
    free(expr.left, map);
    free(expr.left, map);
    return map;
  }
  return impossible('free');
};

const occursVar = (vr: Name, expr: Expr): boolean => {
  if (isVar(expr)) return expr.name === vr;
  if (isAbs(expr)) return expr.arg === vr ? false : occursVar(vr, expr.body);
  if (isApp(expr)) return occursVar(vr, expr.left) || occursVar(vr, expr.right);
  return impossible('occursVar');
};

const subst = (name: Name, val: Expr, expr: Expr, fr: Free = {}): Expr => {
  if (isVar(expr)) return expr.name === name ? val : expr;
  if (isAbs(expr)) {
    if (expr.arg === name) return expr;
    if (fr[expr.arg] && occursVar(name, expr.body)) {
      const v = freshVar(expr.arg);
      return Abs(v, subst(name, val, subst(expr.arg, Var(v), expr.body)));
    }
    return Abs(expr.arg, subst(name, val, expr.body));
  }
  if (isApp(expr)) return App(subst(name, val, expr.left), subst(name, val, expr.right));
  return impossible('subst');
};

const reduce = (defs: Inlines, expr: Expr): Expr => {
  // console.log(`reduce ${showExpr(expr)}`);
  if (isVar(expr)) return defs[expr.name] || expr;
  if (isAbs(expr)) return Abs(expr.arg, reduce(defs, expr.body));
  if (isApp(expr)) {
    const left = reduce(defs, expr.left);
    const right = reduce(defs, expr.right);
    if (isAbs(left)) {
      const fr = free(expr.right);
      return reduce(defs, subst(left.arg, right, left.body, fr));
    } else return App(left, right);
  }
  return impossible('reduce');
};

const reduceDefs = (inlines: Inlines, ds: Defs): Defs =>
  ds.map(([x, e]) => [x, reduce(inlines, e)] as [Name, Expr]);

// compiler
const compile = (expr: Expr): string => {
  if (isVar(expr)) return expr.name;
  if (isAbs(expr)) return `(${expr.arg} => ${compile(expr.body)})`;
  if (isApp(expr)) return `${compile(expr.left)}(${compile(expr.right)})`;
  return impossible('compile');
};

const compileDefs = (ds: Defs): string =>
  ds.map(([name, ex]) => `const ${name} = ${compile(ex)}`).join(';\n') + ';\nmain();\n';

// parsing
type Defs = [Name, Expr][];

const showDefs = (ds: Defs): string =>
  ds.map(([x, e]) => `${x} = ${showExpr(e)}`).join('; ');

type Token = TkSymbol | TkParens;

interface TkSymbol {
  readonly tag: 'TkSymbol';
  readonly val: Name;
}
const TkSymbol = (val: Name): TkSymbol => ({ tag: 'TkSymbol', val });
const isTkSymbol = (token: Token): token is TkSymbol => token.tag === 'TkSymbol';

interface TkParens {
  readonly tag: 'TkParens';
  readonly val: Token[];
}
const TkParens = (val: Token[]): TkParens => ({ tag: 'TkParens', val });
const isTkParens = (token: Token): token is TkParens => token.tag === 'TkParens';

const showToken = (tk: Token): string => {
  if (isTkSymbol(tk)) return tk.val;
  if (isTkParens(tk)) return `(${showTokens(tk.val)})`;
  return impossible('showToken');
};
const showTokens = (tk: Token[]): string => tk.map(showToken).join(' ');

type Bracket = '(' | ')';
const matchingBracket = (c: Bracket): Bracket => {
  if(c === '(') return ')';
  if(c === ')') return '(';
  throw new SyntaxError(`invalid bracket: ${c}`);
}

const START = 0;
const SYMBOL = 1;
const tokenize = (s: string): Token[] => {
  let state = START;
  let t = '';
  let r: Token[] = [], p: Token[][] = [], b: Bracket[] = [];
  for (let i = 0; i <= s.length; i++) {
    const c = s[i] || ' ';
    const next = s[i + 1] || ' ';
    if (state === START) {
      if (c === '-' && next === '>') r.push(TkSymbol('->')), i++;
      else if (c === '\\') r.push(TkSymbol(c));
      else if (c === '=') r.push(TkSymbol(c));
      else if (c === ';') r.push(TkSymbol(c));
      else if (/[a-z]/i.test(c)) t += c, state = SYMBOL;
      else if(c === '(') b.push(c), p.push(r), r = [];
      else if(c === ')') {
        if(b.length === 0) throw new SyntaxError(`unmatched bracket: ${c}`);
        const br = b.pop() as Bracket;
        if(matchingBracket(br) !== c) throw new SyntaxError(`unmatched bracket: ${br} and ${c}`);
        const a: Token[] = p.pop() as Token[];
        a.push(TkParens(r));
        r = a;
      } else if(/\s+/.test(c)) continue;
      else throw new SyntaxError(`invalid char: ${c}`);
    } else if (state === SYMBOL) {
      if(!/[a-z0-9]/i.test(c)) r.push(TkSymbol(t)), t = '', i--, state = START;
      else t += c;
    }
  }
  if (b.length > 0) throw new SyntaxError(`unclosed brackets: ${b.join(' ')}`);
  if (state !== START) throw new SyntaxError(`invalid parsing end state: ${state}`);
  return r;
};

const indexOfToken = (ts: Token[], fn: (tk: Token) => boolean): number => {
  for (let i = 0, l = ts.length; i < l; i++) if (fn(ts[i])) return i;
  return -1;
};

const exprs = (tk: Token[]): Expr => {
  if (tk.length === 0) return Abs('x', Var('x'));
  if (tk.length === 1) return expr(tk[0]);
  const absi = indexOfToken(tk, t => isTkSymbol(t) && t.val === '\\');
  if (absi > -1) {
    const arri = indexOfToken(tk, t => isTkSymbol(t) && t.val === '->');
    if (arri === -1) throw new SyntaxError('-> missing after \\');
    if (arri <= absi) throw new SyntaxError('-> before \\');
    if (arri === absi + 1) throw new SyntaxError('\\ without args');
    const args = tk.slice(absi + 1, arri);
    const argsnames: Name[] = [];
    for (let i = 0, l = args.length; i < l; i++) {
      const c = args[i];
      if (isTkParens(c)) throw new SyntaxError(`invalid arg to \\: ${showToken(c)}`);
      if (isTkSymbol(c)) {
        if (/[a-z][a-z0-9]*/i.test(c.val)) {
          argsnames.push(c.val);
          continue;
        }
        throw new SyntaxError(`invalid arg to \\: ${showToken(c)}`);
      }
      impossible('abs args');
    }
    const body = exprs(tk.slice(arri + 1));
    const abs = argsnames.reduceRight((x, y) => Abs(y, x), body);
    if (absi === 0) return abs;
    const prefix = exprs(tk.slice(0, absi));
    return App(prefix, abs);
  }
  return tk.map(expr).reduce(App);
};

const expr = (tk: Token): Expr => {
  if(isTkSymbol(tk)) {
    if (/[a-z][a-z0-9]*/i.test(tk.val)) return Var(tk.val);
    throw new SyntaxError(`invalid var: ${tk.val}`);
  }
  if (isTkParens(tk)) return exprs(tk.val);
  return impossible('expr');
};

const defs = (tk: Token[]): Defs => {
  const ix = indexOfToken(tk, t => isTkSymbol(t) && t.val === '=');
  if (ix === -1) throw new SyntaxError('no defs found');
  const ie = indexOfToken(tk, t => isTkSymbol(t) && t.val === ';');
  if (ie !== -1 && ie < ix) throw new SyntaxError('; before =');
  const args = tk.slice(0, ix);
  const argsnames: Name[] = [];
  for (let i = 0, l = args.length; i < l; i++) {
    const c = args[i];
    if (isTkParens(c)) throw new SyntaxError(`invalid arg to =: ${showToken(c)}`);
    if (isTkSymbol(c)) {
      if (/[a-z][a-z0-9]*/i.test(c.val)) {
        argsnames.push(c.val);
        continue;
      }
      throw new SyntaxError(`invalid arg to =: ${showToken(c)}`);
    }
    impossible('= args');
  }
  if (argsnames.length < 1) throw new SyntaxError('no name before =');
  const body = expr(TkParens(tk.slice(ix + 1, ie === -1 ? undefined : ie)));
  const defex: [Name, Expr] = argsnames.length === 1 ?
    [argsnames[0], body] :
    [argsnames[0], argsnames.slice(1).reduceRight((x, y) => Abs(y, x), body)];
  const rec = ie === -1 || ie === tk.length - 1 ? [] : defs(tk.slice(ie + 1));
  return [defex].concat(rec);
};

const parse = (s: string): Expr => expr(TkParens(tokenize(s)));
const parseDefs = (s: string): Defs => defs(tokenize(s));

// testing
const fs = require('fs');
const file = process.argv[2];
const file2 = process.argv[3];
if (!file) console.log('no file given');
else if(!file2) console.log('no output file given');
else {
  const program = fs.readFileSync(file, 'utf8');
  try {
    const expr = parseDefs(program);
    const inlines: Inlines = {};
    for (let i = 0, l = expr.length; i < l; i++) {
      const c = expr[i];
      inlines[c[0]] = c[1];
    }
    inferDefs(expr, {});
    const red = reduceDefs(inlines, expr);
    const comp = compileDefs(red);
    fs.writeFileSync(file2, comp);
  } catch(err) {
    console.log(`${err}`);
  }
}

/*
const Bool = TConst('Bool');
const env: Env = {
  True: Bool,
  I: TFun(TVar(0), TVar(0)),
  K: TFun(TVar(0), TFun(TVar(1), TVar(0))),
  S: TFun(TFun(TVar(0), TFun(TVar(1), TVar(2))), TFun(TFun(TVar(0), TVar(1)), TFun(TVar(0), TVar(2)))),
};
const inlines: Inlines = {
  I: Abs('x', Var('x')),
  K: Abs('x', Abs('y', Var('x'))),
  S: Abs('x', Abs('y', Abs('z', App(App(Var('x'), Var('z')), App(Var('y'), Var('z')))))),
};
const program = 'f x = x; g = True';
try {
  const expr = parseDefs(program);
  console.log(showDefs(expr));
  const nenv = inferDefs(expr, env);
  console.log(showEnv(nenv));
  const red = reduceDefs(inlines, expr);
  console.log(showDefs(red));
  const comp = compileDefs(red);
  console.log(comp);
  const ev = eval(comp);
  console.log(ev);
} catch(err) {
  console.log(`${err}`);
}
*/

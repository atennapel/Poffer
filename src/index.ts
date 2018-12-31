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
  if (isAbs(expr)) return `(\\${expr.arg}. ${showExpr(expr.body)})`;
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
    throw new TypeError(`occurs check failed: '${tv} in ${showType(type)}`);
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
}

// reduction
type Defs = { [key: string]: Expr };

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

const subst = (name: Name, val: Expr, expr: Expr, fr: Free = {}): Expr => {
  if (isVar(expr)) return expr.name === name ? val : expr;
  if (isAbs(expr)) {
    if (expr.arg === name) return expr;
    return Abs(expr.arg, subst(name, val, expr.body));
  }
  if (isApp(expr)) return App(subst(name, val, expr.left), subst(name, val, expr.right));
  return impossible('subst');
};

const reduce = (defs: Defs, expr: Expr): Expr => {
  console.log(`reduce ${showExpr(expr)}`);
  if (isVar(expr)) return defs[expr.name] || expr;
  if (isAbs(expr)) return Abs(expr.arg, reduce(defs, expr.body));
  if (isApp(expr)) {
    const left = reduce(defs, expr.left);
    if (isAbs(left)) {
      const fr = free(expr.right);
      return reduce(defs, subst(left.arg, expr.right, left.body, fr));
    } else return expr;
  }
  return impossible('reduce');
};

// testing
const Bool = TConst('Bool');
const env: Env = {
  True: Bool,
  id: TFun(TVar(0), TVar(0)),
};
const defs: Defs = {
  id: Abs('x', Var('x')),
};
const expr = App(Abs('y', Abs('True', Var('y'))), Abs('z', Var('True')));
console.log(showExpr(expr));
const ty = inferTop(env, expr);
console.log(showType(ty));
const red = reduce(defs, expr);
console.log(showExpr(red));

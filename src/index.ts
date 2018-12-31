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
type Type = TVar | TFun;

interface TVar {
  readonly tag: 'TVar';
  readonly name: Id;
  type: Type | null;
}
const TVar = (name: Id, type: Type | null): Type => ({ tag: 'TVar', name, type });
const isTVar = (type: Type): type is TVar => type.tag === 'TVar';
const freshTVar = () => TVar(freshId(), null);

interface TFun {
  readonly tag: 'TFun';
  readonly left: Type;
  readonly right: Type;
}
const TFun = (left: Type, right: Type): Type => ({ tag: 'TFun', left, right });
const isTFun = (type: Type): type is TFun => type.tag === 'TFun';

const showType = (type: Type): string => {
  if (isTVar(type)) return `'${type.name}`;
  if (isTFun(type)) return `(${showType(type.left)} -> ${showType(type.right)})`;
  return impossible('showType');
};

// exprs
type Expr = Var | Abs | App;

interface Var {
  readonly tag: 'Var';
  readonly name: Name;
}
const Var = (name: Name): Expr => ({ tag: 'Var', name });
const isVar = (expr: Expr): expr is Var => expr.tag === 'Var';

interface Abs {
  readonly tag: 'Abs';
  readonly arg: Name;
  readonly body: Expr;
}
const Abs = (arg: Name, body: Expr): Expr => ({ tag: 'Abs', arg, body });
const isAbs = (expr: Expr): expr is Abs => expr.tag === 'Abs';

interface App {
  readonly tag: 'App';
  readonly left: Expr;
  readonly right: Expr;
}
const App = (left: Expr, right: Expr): Expr => ({ tag: 'App', left, right });
const isApp = (expr: Expr): expr is App => expr.tag === 'App';

const showExpr = (expr: Expr): string => {
  if (isVar(expr)) return `${expr.name}`;
  if (isAbs(expr)) return `(\\${expr.arg}. ${showExpr(expr.body)})`;
  if (isApp(expr)) return `(${showExpr(expr.left)} ${showExpr(expr.right)})`;
  return impossible('showExpr');
};

// unification
const prune = (type: Type): Type => {
  if (isTVar(type)) {
    if (!type.type) return type;
    const ty = prune(type.type);
    type.type = ty;
    return ty;
  }
  if (isTFun(type)) return TFun(prune(type.left), prune(type.right));
  return impossible('prune');
};

const occurs = (tv: Id, type: Type): boolean => {
  if (isTVar(type)) return type.name === tv;
  if (isTFun(type)) return occurs(tv, type.left) || occurs(tv, type.right);
  return impossible('occurs');
};

const bind = (tv: TVar, type: Type): void => {
  if (isTVar(type) && type.name === tv.name) return;
  if (occurs(tv.name, type))
    throw new TypeError(`occurs check failed: '${tv} in ${showType(type)}`);
  tv.type = type;
};

const unify = (a_: Type, b_: Type): void => {
  const a = prune(a_);
  const b = prune(b_);
};

console.log('test');

import { Type, TMeta, showTy, Forall, FreeMeta, freeForall, Subst, freshMeta, substMeta, freeTy, TFun } from './types';
import { Name } from './Name';
import { Expr } from './exprs';
import { Env, freeEnv, extend } from './Env';

export const isError = <T>(val: string | T): val is string => typeof val === 'string';

// unification
const prune = (ty: Type): Type => {
  switch (ty.tag) {
    case 'TVar': return ty;
    case 'TMeta': return ty.type ? ty.type = prune(ty.type) : ty;
    case 'TFun': return TFun(prune(ty.left), prune(ty.right));
  }
};
const occurs = (a: Name, ty: Type): boolean => {
  switch (ty.tag) {
    case 'TVar': return false;
    case 'TMeta': return ty.name === a;
    case 'TFun': return occurs(a, ty.left) || occurs(a, ty.right);
  }
};
const bind = (a: TMeta, b: Type): string | null => {
  if (b.tag === 'TMeta' && a.name === b.name) return null;
  if (occurs(a.name, b)) return `${a.name} occurs in ${showTy(b)}`;
  a.type = b;
  return null;
};
const unify_ = (a: Type, b: Type): string | null => {
  if (a.tag === 'TMeta') return bind(a, b);
  if (b.tag === 'TMeta') return bind(b, a);
  if (a.tag === 'TVar' && b.tag === 'TVar' && a.name === b.name) return null;
  if (a.tag === 'TFun' && b.tag === 'TFun') {
    const ret = unify_(a.left, b.left);
    if (isError(ret)) return ret;
    return unify(a.right, b.right);
  }
  return `cannot unify ${showTy(a)} ~ ${showTy(b)}`;
};
const unify = (a: Type, b: Type): string | null => unify_(prune(a), prune(b));

// inference
const instantiate = (ty: Forall): Type => {
  const args = ty.args;
  const map: Subst = {};
  for (let i = 0; i < args.length; i++) map[args[i]] = freshMeta(args[i]);
  return substMeta(ty.type, map);
};

const generalize = (env: Env, ty: Type): Forall => {
  const free = freeEnv(env);
  const freeT = freeTy(ty);
  const args: Name[] = [];
  for (let k in freeT) if (!free[k]) args.push(k);
  return Forall(args, ty);
};

const infer_ = (env: Env, expr: Expr): string | Type => {
  switch (expr.tag) {
    case 'Var': return env[expr.name] ? instantiate(env[expr.name]): `undefined var ${expr.name}`;
    case 'Abs':
      const tm = freshMeta(expr.arg);
      const ret = infer(extend(env, expr.arg, Forall([], tm)), expr.body);
      if (isError(ret)) return ret;
      return TFun(tm, ret);
    case 'App':
      const left = infer_(env, expr.left);
      if (isError(left)) return left;
      const right = infer_(env, expr.right);
      if (isError(right)) return right;
      const tmr = freshMeta();
      const ret1 = unify(left, TFun(right, tmr));
      if (isError(ret1)) return ret1;
      return tmr;
    case 'Let':
      const val = infer(env, expr.val);
      if (isError(val)) return val;
      return infer(extend(env, expr.name, generalize(env, val)), expr.body);
  }
};
const infer = (env: Env, expr: Expr): string | Type => {
  const ret = infer_(env, expr);
  if (isError(ret)) return ret;
  return prune(ret);
};

export const inferGen = (env: Env, expr: Expr): string | Forall => {
  const ret = infer(env, expr);
  if (isError(ret)) return ret;
  return generalize({}, ret);
};

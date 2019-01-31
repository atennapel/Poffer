import { Env, kType, tfun, kConstraint, tnat } from "./env";
import { Type, TMeta, isTVar, isTApp, isTMeta, TApp, freshTMeta, TVar, pruneType, Qual, showType, freeTMeta, resetTypeId } from "./types";
import { Expr, isVar, isApp, isNatLit, isThunk } from "./exprs";
import { tyerr, impossible } from "./util";
import { unifyType, unifyKind, checkKind } from "./unification";
import { solve } from "./solver";
import { resetKindId } from "./kinds";

const inst = (type: Type, map: Map<number, TMeta>): Type => {
  if (isTVar(type)) {
    const m = map.get(type.id);
    if (!m) {
      const m = freshTMeta(type.kind);
      map.set(type.id, m);
      return m;
    }
    return m;
  }
  if (isTApp(type)) return TApp(inst(type.left, map), inst(type.right, map));
  return type;
};
const instQual = (qual: Qual): [Type[], Type] => {
  const map = new Map<number, TMeta>();
  const cs = qual.constraints.map(c => {
    checkKind(c, kConstraint);
    return inst(c, map)
  });
  const ty = inst(qual.type, map);
  return [cs, ty];
};

const gen = (type: Type): Type => {
  if (isTMeta(type)) return TVar(type.id, type.kind);
  if (isTApp(type)) return TApp(gen(type.left), gen(type.right));
  return type;
};
const genQual = (cs: Type[], type: Type): Qual =>
  Qual(cs.map(gen), gen(type));

const combine = (c1: Type[], c2: Type[]): Type[] =>
  c1.concat(c2).map(pruneType);

const synth = (env: Env, expr: Expr): [Type[], Type] => {
  if (isVar(expr)) {
    const ty = env[expr.name];
    if (!ty) return tyerr(`undefined var ${expr.name}`);
    return instQual(ty);
  }
  if (isApp(expr)) {
    const [cs1, ta] = synth(env, expr.left);
    const [cs2, tb] = synth(env, expr.right);
    const tr = freshTMeta(kType);
    unifyType(ta, tfun(tb, tr));
    return [combine(cs1, cs2), pruneType(tr)];
  }
  if (isNatLit(expr)) return [[], tnat];
  if (isThunk(expr)) {
    const [cs, ty] = synth(env, expr.expr);
    return [cs, tfun(freshTMeta(kType), ty)];
  }
  return impossible('synth');
};

export const infer = (env: Env, expr: Expr): Qual => {
  resetKindId();
  resetTypeId();
  const [cs, ty] = synth(env, expr);
  const free = freeTMeta(ty);
  return genQual(solve(free, cs), ty);
};

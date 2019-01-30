import { Env, kType, tfun } from "./env";
import { Type, TMeta, isTVar, isTApp, isTMeta, TApp, freshTMeta, TVar, pruneType } from "./types";
import { Expr, isVar, isApp } from "./exprs";
import { tyerr, impossible } from "./util";
import { unifyType } from "./unification";

const inst = (type: Type, map: Map<number, TMeta> = new Map()): Type => {
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

const gen = (type: Type): Type => {
  if (isTMeta(type)) return TVar(type.id, type.kind);
  if (isTApp(type)) return TApp(gen(type.left), gen(type.right));
  return type;
};

const synth = (env: Env, expr: Expr): Type => {
  if (isVar(expr)) {
    const ty = env[expr.name];
    if (!ty) return tyerr(`undefined var ${expr.name}`);
    return inst(ty);
  }
  if (isApp(expr)) {
    const ta = synth(env, expr.left);
    const tb = synth(env, expr.right);
    const tr = freshTMeta(kType);
    unifyType(ta, tfun(tb, tr));
    return pruneType(tr);
  }
  return impossible('synth');
}

export const infer = (env: Env, expr: Expr): Type =>
  gen(pruneType(synth(env, expr)));

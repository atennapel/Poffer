import { KCon, KFun, Kind } from "./kinds";
import { TCon, Type, TApp, TVar, Qual, tapp, isTApp } from "./types";

export const kType = KCon('Type');
export const kConstraint = KCon('Constraint');

export interface TFunLike {
  readonly left: TApp & { left: typeof tFun };
  readonly right: Type;
}
export const tFun = TCon('->', KFun(kType, KFun(kType, kType)));
export const tfun = (...ts: Type[]) => ts.reduceRight((x, y) => TApp(TApp(tFun, y), x));
export const isTFun = (type: Type): type is TApp & TFunLike =>
  isTApp(type) && isTApp(type.left) && type.left.left === tFun;

export const tnat = TCon('Nat', kType);
export const tunit = TCon('Unit', kType);
export const tvoid = TCon('Void', kType);

export const tthunk = TCon('Thunk', KFun(kType, kType));

export const tpair = TCon('*', KFun(kType, KFun(kType, kType)));
export const tsum = TCon('+', KFun(kType, KFun(kType, kType)));

export const tmutarray = TCon('MutArray', KFun(kType, kType));
export const tref = TCon('Ref', KFun(kType, kType));

export const ttype = TCon('Type', KFun(kType, kType));

export const cDup = TCon('Dup', KFun(kType, kConstraint));
export const cDrop = TCon('Drop', KFun(kType, kConstraint));

export type Env = { [key: string]: Qual };
export const tv = (id: number, kind: Kind = kType) => TVar(id, kind);
export const initialEnv: Env = {
  I: Qual([], tfun(tv(0), tv(0))),
  B: Qual([], tfun(tfun(tv(1), tv(2)), tfun(tv(0), tv(1)), tv(0), tv(2))),
  C: Qual([], tfun(tfun(tv(0), tv(1), tv(2)), tv(1), tv(0), tv(2))),
  F: Qual([tapp(cDup, tv(0))], tfun(tfun(tv(1), tv(2), tv(3)), tfun(tv(0), tv(1)), tfun(tv(0), tv(2)), tv(0), tv(3))),
  K: Qual([tapp(cDrop, tv(1))], tfun(tv(0), tv(1), tv(0))),
  S: Qual([tapp(cDup, tv(0))], tfun(tfun(tv(0), tv(1), tv(2)), tfun(tv(0), tv(1)), tv(0), tv(2))),
  W: Qual([tapp(cDup, tv(0))], tfun(tfun(tv(0), tv(0), tv(1)), tv(0), tv(1))),

  Y: Qual([], tfun(tfun(tv(0), tv(0)), tv(0))),

  u: Qual([], tunit),

  f: Qual([], tfun(tapp(tthunk, tv(0)), tv(0))),
  z: Qual([], tfun(tfun(tv(0), tv(1)), tapp(tthunk, tv(0)), tapp(tthunk, tv(1)))),

  P: Qual([], tfun(tv(0), tv(1), tapp(tpair, tv(0), tv(1)))),
  L: Qual([], tfun(tv(0), tapp(tsum, tv(0), tv(1)))),
  R: Qual([], tfun(tv(1), tapp(tsum, tv(0), tv(1)))),

  N: Qual([], tfun(tapp(ttype, tv(0)), tapp(tmutarray, tv(0)))),
  A: Qual([], tfun(tv(0), tapp(tmutarray, tv(0)), tunit)),
  O: Qual([], tfun(tapp(tmutarray, tv(0)), tapp(tsum, tunit, tv(0)))),

  r: Qual([], tfun(tv(0), tapp(tref, tv(0)))),
  g: Qual([], tfun(tapp(tref, tv(0)), tv(0))),
  s: Qual([], tfun(tv(0), tapp(tref, tv(0)), tunit)),

  '?u': Qual([], tfun(tapp(tthunk, tv(0)), tunit, tv(0))),
  '?v': Qual([], tfun(tvoid, tv(0))),
  '?n': Qual([], tfun(tapp(tthunk, tv(0)), tfun(tnat, tv(0)), tnat, tv(0))),
  '?p': Qual([], tfun(tfun(tv(0), tv(1), tv(2)), tapp(tpair, tv(0), tv(1)), tv(2))),
  '?s': Qual([], tfun(tfun(tv(0), tv(2)), tfun(tv(1), tv(2)), tapp(tsum, tv(0), tv(1)), tv(2))),

  '#s': Qual([], tfun(tnat, tnat)),
  '#i': Qual([], tfun(tapp(tthunk, tv(0)), tfun(tv(0), tv(0)), tnat, tv(0))),
  '#r': Qual([], tfun(tapp(tthunk, tv(0)), tfun(tnat, tv(0), tv(0)), tnat, tv(0))),
  '#a': Qual([], tfun(tnat, tnat, tnat)),
  '#b': Qual([], tfun(tnat, tnat, tnat)),
  '#m': Qual([], tfun(tnat, tnat, tnat)),
  '#d': Qual([], tfun(tnat, tnat, tnat)),

  '%u': Qual([], tapp(ttype, tunit)),
  '%v': Qual([], tapp(ttype, tvoid)),
  '%n': Qual([], tapp(ttype, tnat)),
  '%p': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tv(1)), tapp(ttype, tapp(tpair, tv(0), tv(1))))),
  '%f': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tv(1)), tapp(ttype, tapp(tFun, tv(0), tv(1))))),
  '%s': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tv(1)), tapp(ttype, tapp(tsum, tv(0), tv(1))))),
  '%t': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tapp(tthunk, tv(0))))),
  '%m': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tapp(tmutarray, tv(0))))),
  '%r': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tapp(tref, tv(0))))),
  '%T': Qual([], tfun(tv(0), tapp(tsum, tunit, tapp(ttype, tv(0))))),
};

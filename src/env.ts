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
export const tbool = TCon('Bool', kType);
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
  A: Qual([], tfun(tfun(tv(0), tv(1)), tv(0), tv(1))),
  B: Qual([], tfun(tfun(tv(1), tv(2)), tfun(tv(0), tv(1)), tv(0), tv(2))),
  C: Qual([], tfun(tfun(tv(0), tv(1), tv(2)), tv(1), tv(0), tv(2))),
  D: Qual([], tfun(tfun(tv(2), tv(3)), tfun(tv(0), tv(1), tv(2)), tv(0), tv(1), tv(3))),
  E: Qual([], tfun(tfun(tv(3), tv(4)), tfun(tv(0), tv(1), tv(2), tv(3)), tv(0), tv(1), tv(2), tv(4))),
  F: Qual([tapp(cDup, tv(0))], tfun(tfun(tv(1), tv(2), tv(3)), tfun(tv(0), tv(1)), tfun(tv(0), tv(2)), tv(0), tv(3))),
  G: Qual([tapp(cDup, tv(0)), tapp(cDup, tv(1))], tfun(tfun(tv(2), tv(3), tv(4)), tfun(tv(0), tv(1), tv(2)), tfun(tv(0), tv(1), tv(3)), tv(0), tv(1), tv(4))),
  H: Qual([tapp(cDup, tv(0)), tapp(cDup, tv(1)), tapp(cDup, tv(2))],
    tfun(
      tfun(tv(3), tv(4), tv(5), tv(6)),
      tfun(tv(0), tv(1), tv(2), tv(3)),
      tfun(tv(0), tv(1), tv(2), tv(4)),
      tfun(tv(0), tv(1), tv(2), tv(5)),
      tv(0),
      tv(1),
      tv(2),
      tv(6))),
  I: Qual([], tfun(tv(0), tv(0))),
  K: Qual([tapp(cDrop, tv(1))], tfun(tv(0), tv(1), tv(0))),
  L: Qual([], tfun(tfun(tv(2), tv(3), tv(4)), tfun(tv(0), tv(2)), tfun(tv(1), tv(3)), tv(0), tv(1), tv(4))),
  M: Qual([], tfun(tfun(tv(3), tv(4), tv(5), tv(6)), tfun(tv(0), tv(3)), tfun(tv(1), tv(4)), tfun(tv(2), tv(5)), tv(0), tv(1), tv(2), tv(6))),
  R: Qual([tapp(cDrop, tv(0))], tfun(tv(0), tv(1), tv(1))),
  S: Qual([tapp(cDup, tv(0))], tfun(tfun(tv(0), tv(1), tv(2)), tfun(tv(0), tv(1)), tv(0), tv(2))),
  T: Qual([], tfun(tv(0), tfun(tv(0), tv(1)), tv(1))),
  W: Qual([tapp(cDup, tv(0))], tfun(tfun(tv(0), tv(0), tv(1)), tv(0), tv(1))),
  Y: Qual([], tfun(tfun(tv(0), tv(0)), tv(0))),

  u: Qual([], tunit),

  t: Qual([], tbool),
  f: Qual([], tbool),

  x: Qual([], tfun(tapp(tthunk, tv(0)), tv(0))),
  y: Qual([], tfun(tfun(tunit, tv(0)), tapp(tthunk, tv(0)))),
  z: Qual([], tfun(tfun(tv(0), tv(1)), tapp(tthunk, tv(0)), tapp(tthunk, tv(1)))),

  p: Qual([], tfun(tv(0), tv(1), tapp(tpair, tv(0), tv(1)))),
  l: Qual([], tfun(tv(0), tapp(tsum, tv(0), tv(1)))),
  r: Qual([], tfun(tv(1), tapp(tsum, tv(0), tv(1)))),

  n: Qual([], tfun(tapp(ttype, tv(0)), tapp(tmutarray, tv(0)))),
  a: Qual([], tfun(tv(0), tapp(tmutarray, tv(0)), tapp(tmutarray, tv(0)))),
  o: Qual([], tfun(tapp(tmutarray, tv(0)), tapp(tpair, tapp(tmutarray, tv(0)), tapp(tsum, tunit, tv(0))))),

  v: Qual([], tfun(tv(0), tapp(tref, tv(0)))),
  g: Qual([], tfun(tapp(tref, tv(0)), tapp(tpair, tapp(tref, tv(0)), tv(0)))),
  s: Qual([], tfun(tv(0), tapp(tref, tv(0)), tapp(tref, tv(0)))),

  '?u': Qual([], tfun(tapp(tthunk, tv(0)), tunit, tv(0))),
  '?v': Qual([], tfun(tvoid, tv(0))),
  '?n': Qual([], tfun(tapp(tthunk, tv(0)), tfun(tnat, tv(0)), tnat, tv(0))),
  '?b': Qual([], tfun(tapp(tthunk, tv(0)), tapp(tthunk, tv(0)), tbool, tv(0))),
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
  '%b': Qual([], tapp(ttype, tbool)),
  '%p': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tv(1)), tapp(ttype, tapp(tpair, tv(0), tv(1))))),
  '%f': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tv(1)), tapp(ttype, tapp(tFun, tv(0), tv(1))))),
  '%s': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tv(1)), tapp(ttype, tapp(tsum, tv(0), tv(1))))),
  '%t': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tapp(tthunk, tv(0))))),
  '%m': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tapp(tmutarray, tv(0))))),
  '%r': Qual([], tfun(tapp(ttype, tv(0)), tapp(ttype, tapp(tref, tv(0))))),
  '%T': Qual([], tfun(tv(0), tapp(tsum, tunit, tapp(ttype, tv(0))))),
};

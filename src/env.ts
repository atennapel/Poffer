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

export const tthunk = TCon('Thunk', KFun(kType, kType));

export const tpair = TCon('*', KFun(kType, KFun(kType, kType)));
export const tsum = TCon('+', KFun(kType, KFun(kType, kType)));

export const cDup = TCon('Dup', KFun(kType, kConstraint));
export const cDrop = TCon('Drop', KFun(kType, kConstraint));

export type Env = { [key: string]: Qual };
export const tv = (id: number, kind: Kind = kType) => TVar(id, kind);
export const initialEnv: Env = {
  I: Qual([], tfun(tv(0), tv(0))),
  B: Qual([], tfun(tfun(tv(1), tv(2)), tfun(tv(0), tv(1)), tv(0), tv(2))),
  C: Qual([], tfun(tfun(tv(0), tv(1), tv(2)), tv(1), tv(0), tv(2))),
  K: Qual([tapp(cDrop, tv(1))], tfun(tv(0), tv(1), tv(0))),
  W: Qual([tapp(cDup, tv(0))], tfun(tfun(tv(0), tv(0), tv(1)), tv(0), tv(1))),

  Y: Qual([], tfun(tfun(tv(0), tv(0)), tv(0))),

  u: Qual([], tunit),

  f: Qual([], tfun(tapp(tthunk, tv(0)), tv(0))),

  s: Qual([], tfun(tnat, tnat)),
  n: Qual([], tfun(tapp(tthunk, tv(0)), tfun(tnat, tv(0)), tnat, tv(0))),
  i: Qual([], tfun(tapp(tthunk, tv(0)), tfun(tv(0), tv(0)), tnat, tv(0))),
  r: Qual([], tfun(tapp(tthunk, tv(0)), tfun(tnat, tv(0), tv(0)), tnat, tv(0))),

  P: Qual([], tfun(tv(0), tv(1), tapp(tpair, tv(0), tv(1)))),
  F: Qual([], tfun(tapp(tpair, tv(0), tv(1)), tv(0))),
  S: Qual([], tfun(tapp(tpair, tv(0), tv(1)), tv(1))),

  L: Qual([], tfun(tv(0), tapp(tsum, tv(0), tv(1)))),
  R: Qual([], tfun(tv(1), tapp(tsum, tv(0), tv(1)))),
  M: Qual([], tfun(tfun(tv(0), tv(2)), tfun(tv(1), tv(2)), tapp(tsum, tv(0), tv(1)), tv(2))),
};

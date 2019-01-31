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
  i: Qual([], tfun(tnat, tnat)),
  j: Qual([], tfun(tnat, tnat)),
};

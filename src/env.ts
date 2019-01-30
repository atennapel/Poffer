import { KCon, KFun, Kind } from "./kinds";
import { TCon, Type, TApp, TVar } from "./types";

export const kType = KCon('Type');
export const tFun = TCon('->', KFun(kType, KFun(kType, kType)));
export const tfun = (...ts: Type[]) => ts.reduceRight((x, y) => TApp(TApp(tFun, y), x));

export const tv = (id: number, kind: Kind = kType) => TVar(id, kind);

export type Env = { [key: string]: Type };

export const initialEnv: Env = {
  I: tfun(tv(0), tv(0)),
  B: tfun(tfun(tv(1), tv(2)), tfun(tv(0), tv(1)), tv(0), tv(2)),
  C: tfun(tfun(tv(0), tv(1), tv(2)), tv(1), tv(0), tv(2)),
  K: tfun(tv(0), tv(1), tv(0)),
  W: tfun(tfun(tv(0), tv(0), tv(1)), tv(0), tv(1)),
};

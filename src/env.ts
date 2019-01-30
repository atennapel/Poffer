import { KCon, KFun, Kind } from "./kinds";
import { TCon, Type, TApp, TVar } from "./types";

export const kType = KCon('Type');
export const tFun = TCon('->', KFun(kType, KFun(kType, kType)));
export const tfun = (a: Type, b: Type) => TApp(TApp(tFun, a), b);

export const tv = (id: number, kind: Kind = kType) => TVar(id, kind);

export type Env = { [key: string]: Type };

export const initialEnv: Env = {
  I: tfun(tv(0), tv(0)),
};

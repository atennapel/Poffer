import { impossible } from "./util";
import { Kind } from "./kinds";

export type Type
  = TCon
  | TVar
  | TMeta
  | TApp;

export interface TCon {
  readonly tag: 'TCon';
  readonly name: string;
  readonly kind: Kind;
}
export const TCon = (name: string, kind: Kind): TCon => ({ tag: 'TCon', name, kind });
export const isTCon = (type: Type): type is TCon => type.tag === 'TCon';

export interface TVar {
  readonly tag: 'TVar';
  readonly id: number;
  readonly kind: Kind;
}
export const TVar = (id: number, kind: Kind): TVar => ({ tag: 'TVar', id, kind });
export const isTVar = (type: Type): type is TVar => type.tag === 'TVar';

export interface TMeta {
  readonly tag: 'TMeta';
  readonly id: number;
  readonly kind: Kind;
  type: Type | null;
}
export const TMeta = (id: number, kind: Kind): TMeta => ({ tag: 'TMeta', id, kind, type: null });
export const isTMeta = (type: Type): type is TMeta => type.tag === 'TMeta';

let typeId = 0;
export const resetTypeId = () => { typeId = 0 };
export const freshTMeta = (kind: Kind) => TMeta(typeId++, kind);

export interface TApp {
  readonly tag: 'TApp';
  readonly left: Type;
  readonly right: Type;
}
export const TApp = (left: Type, right: Type): TApp => ({ tag: 'TApp', left, right });
export const isTApp = (type: Type): type is TApp => type.tag === 'TApp';

export const showType = (type: Type): string => {
  if (isTCon(type)) return type.name;
  if (isTVar(type)) return `'${type.id}`;
  if (isTMeta(type)) return `?${type.id}`;
  if (isTApp(type)) return `(${showType(type.left)} ${showType(type.right)})`;
  return impossible('showType');
};

export const pruneType = (type: Type): Type => {
  if (isTMeta(type)) {
    if (!type.type) return type;
    const t = pruneType(type.type);
    type.type = t;
    return t;
  }
  if (isTApp(type)) return TApp(pruneType(type.left), pruneType(type.right));
  return type;
};

export const containsTMeta = (type: Type, m: TMeta): boolean => {
  if (type === m) return true;
  if (isTApp(type)) return containsTMeta(type.left, m) || containsTMeta(type.right, m);
  return false;
};

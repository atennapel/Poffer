import { impossible } from "./util";

export type Kind = KCon | KMeta | KFun;

export interface KCon {
  readonly tag: 'KCon';
  readonly name: string;
}
export const KCon = (name: string): KCon => ({ tag: 'KCon', name });
export const isKCon = (kind: Kind): kind is KCon => kind.tag === 'KCon';

export interface KMeta {
  readonly tag: 'KMeta';
  readonly id: number;
  kind: Kind | null;
}
export const KMeta = (id: number): KMeta => ({ tag: 'KMeta', id, kind: null });
export const isKMeta = (kind: Kind): kind is KMeta => kind.tag === 'KMeta';

let kindId = 0;
export const resetKindId = () => { kindId = 0 };
export const freshKMeta = () => KMeta(kindId++);

export interface KFun {
  readonly tag: 'KFun';
  readonly left: Kind;
  readonly right: Kind;
}
export const KFun = (left: Kind, right: Kind): KFun => ({ tag: 'KFun', left, right });
export const isKFun = (kind: Kind): kind is KFun => kind.tag === 'KFun';

export const showKind = (kind: Kind): string => {
  if (isKCon(kind)) return kind.name;
  if (isKMeta(kind)) return `?${kind.id}`;
  if (isKFun(kind)) return `(${showKind(kind.left)} -> ${showKind(kind.right)})`;
  return impossible('showKind');
};

export const pruneKind = (kind: Kind): Kind => {
  if (isKMeta(kind)) {
    if (!kind.kind) return kind;
    const k = pruneKind(kind.kind);
    kind.kind = k;
    return k;
  }
  if (isKFun(kind)) return KFun(pruneKind(kind.left), pruneKind(kind.right));
  return kind;
};

export const containsKMeta = (kind: Kind, m: KMeta): boolean => {
  if (kind === m) return true;
  if (isKFun(kind)) return containsKMeta(kind.left, m) || containsKMeta(kind.right, m);
  return false;
};

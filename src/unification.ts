import { Type, pruneType, isTCon, isTVar, isTApp, showType, isTMeta, TMeta, containsTMeta } from "./types";
import { tyerr } from "./util";
import { Kind, pruneKind, isKMeta, isKCon, KMeta, containsKMeta, showKind, isKFun, freshKMeta, KFun } from "./kinds";

const bindKind = (a: KMeta, b: Kind): void => {
  if (isKMeta(b) && b.id === a.id) return;
  if (containsKMeta(b, a)) return tyerr(`infinite kind: ${showKind(a)} in ${showKind(b)}`);
  a.kind = b;
};

export const unifyKind = (a_: Kind, b_: Kind): void => {
  const a = pruneKind(a_);
  const b = pruneKind(b_);
  if (a === b) return;
  if (isKMeta(a)) return bindKind(a, b);
  if (isKMeta(b)) return bindKind(b, a);
  if (isKCon(a) && isKCon(b) && a.name === b.name) return;
  if (isKFun(a) && isKFun(b)) {
    unifyKind(a.left, b.left);
    unifyKind(a.right, b.right);
    return;
  }
  return tyerr(`cannot unify kinds ${showKind(a)} ~ ${showKind(b)}`);
};

const synthKind = (type: Type): Kind => {
  if (isTApp(type)) {
    const ka = synthKind(type.left);
    const kb = synthKind(type.right);
    const kr = freshKMeta();
    unifyKind(ka, KFun(kb, kr));
    return pruneKind(kr);
  }
  return type.kind;
};

const bindType = (a: TMeta, b: Type): void => {
  if (isTMeta(b) && b.id === a.id) return;
  if (containsTMeta(b, a)) return tyerr(`infinite type: ${showType(a)} in ${showType(b)}`);
  a.type = b;
};

export const unifyType = (a_: Type, b_: Type): void => {
  const a = pruneType(a_);
  const b = pruneType(b_);
  if (a === b) return;
  unifyKind(synthKind(a), synthKind(b));
  if (isTMeta(a)) return bindType(a, b);
  if (isTMeta(b)) return bindType(b, a);
  if (isTCon(a) && isTCon(b) && a.name === b.name) return;
  if (isTVar(a) && isTVar(b) && a.id === b.id) return;
  if (isTApp(a) && isTApp(b)) {
    unifyType(a.left, b.left);
    unifyType(a.right, b.right);
    return;
  }
  return tyerr(`cannot unify types ${showType(a)} ~ ${showType(b)}`);
};

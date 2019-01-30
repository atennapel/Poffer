import { Type, pruneType, isTCon, isTVar, isTApp, showType, isTMeta, TMeta, containsTMeta } from "./types";
import { tyerr } from "./util";

const bind = (a: TMeta, b: Type): void => {
  if (isTMeta(b) && b.id === a.id) return;
  if (containsTMeta(b, a)) return tyerr(`infinite type: ${showType(a)} in ${showType(b)}`);
  a.type = b;
};

const unify = (a_: Type, b_: Type): void => {
  const a = pruneType(a_);
  const b = pruneType(b_);
  if (a === b) return;
  if (isTMeta(a)) return bind(a, b);
  if (isTMeta(b)) return bind(b, a);
  if (isTCon(a) && isTCon(b) && a.name === b.name) return;
  if (isTVar(a) && isTVar(b) && a.id === b.id) return;
  if (isTApp(a) && isTApp(b)) {
    unify(a.left, b.left);
    unify(a.right, b.right);
    return;
  }
  return tyerr(`cannot unify ${showType(a)} ~ ${showType(b)}`);
};

import { Type, showType, pruneType, isTApp, flattenTApp, isTCon, isTMeta, tapp, tapps, isTVar, Free } from "./types";
import { tyerr } from "./util";
import { cDup, cDrop, isTFun, tunit, tnat, tthunk } from "./env";

const handleDup = (free: Free, type: Type): Type[] => {
  if (isTMeta(type)) return free.has(type) ? [tapp(cDup, type)] : [];
  if (isTCon(type)) {
    if (type === tnat) return [];
    if (type === tunit) return [];
    if (type === tthunk) return [];
    return tyerr(`${showType(type)} cannot be duplicated`);
  }
  if (isTFun(type)) return handleDup(free, type.right);
  if (isTApp(type))
    return handleDup(free, type.left).concat(handleDup(free, type.right));
  return tyerr(`${showType(type)} cannot be duplicated`);
};
const handleDrop = (free: Free, type: Type): Type[] => {
  if (isTMeta(type)) return free.has(type) ? [tapp(cDrop, type)] : [];
  if (isTCon(type)) {
    if (type === tnat) return [];
    if (type === tunit) return [];
    if (type === tthunk) return [];
    return tyerr(`${showType(type)} cannot be dropped`);
  }
  if (isTFun(type)) return handleDup(free, type.right);
  if (isTApp(type))
    return handleDup(free, type.left).concat(handleDup(free, type.right));
  return tyerr(`${showType(type)} cannot be dropped`);
};

type Solvers = { [key: string]: (free: Free, args: Type[]) => Type[] };
const solvers: Solvers = {
  Dup: (free, args) => handleDup(free, args[0]),
  Drop: (free, args) => handleDrop(free, args[0]),
};

const solveOne = (free: Free, cs: Type): Type[] => {
  if (!isTApp(cs)) return tyerr(`invalid constraint: ${showType(cs)}`);
  const f = flattenTApp(cs);
  if (!isTCon(f[0])) return tyerr(`invalid constraint head: ${showType(f[0])}`);
  const cname = f[0].name;
  if (!solvers[cname]) return tyerr(`undefined constraint: ${cname}`);
  return solvers[cname](free, f[1]);
};

export const solve = (free: Free, cs: Type[]): Type[] => {
  const remaining: Type[] = [];
  for (let i = 0, l = cs.length; i < l; i++) {
    const ret = solveOne(free, pruneType(cs[i]));
    for (let j = 0, k = ret.length; j < k; j++)
      remaining.push(ret[j]);
  }
  return remaining.map(pruneType);
};

import { Type, showType, pruneType, isTApp, flattenTApp, isTCon, isTMeta, tapp, tapps } from "./types";
import { tyerr } from "./util";

const solvers: { [key: string]: (args: Type[]) => Type[] | null } = {
  Dup: args => {
    if (args.length !== 1)
      return tyerr(`Dup expects exactly 1 argument but got ${args.length}: ${args.map(showType).join(', ')}`);
    const type = args[0];
    if (isTMeta(type)) return [type];
    if (isTCon(type) && type.name === 'Nat') return null;
    return tyerr(`${showType(type)} cannot be duplicated`);
  },
  Drop: args => {
    if (args.length !== 1)
      return tyerr(`Drop expects exactly 1 argument but got ${args.length}: ${args.map(showType).join(', ')}`);
    const type = args[0];
    if (isTMeta(type)) return [type];
    if (isTCon(type) && type.name === 'Nat') return null;
    return tyerr(`${showType(type)} cannot be dropped`);
  },
};

const solveOne = (cs: Type): Type | null => {
  if (!isTApp(cs)) return tyerr(`invalid constraint: ${showType(cs)}`);
  const f = flattenTApp(cs);
  if (!isTCon(f[0])) return tyerr(`invalid constraint head: ${showType(f[0])}`);
  const cname = f[0].name;
  if (!solvers[cname]) return tyerr(`undefined constraint: ${cname}`);
  const res = solvers[cname](f[1]);
  if (!res) return null;
  return tapps(f[0], res);
};

export const solve = (cs: Type[]): Type[] => {
  const remaining: Type[] = [];
  for (let i = 0, l = cs.length; i < l; i++) {
    const ret = solveOne(pruneType(cs[i]));
    if (ret) remaining.push(ret);
  }
  return remaining.map(pruneType);
};

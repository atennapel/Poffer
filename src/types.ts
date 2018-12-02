import { Name, fresh, namePart } from './Name';

export type Type = TVar | TMeta | TFun;

export interface TVar { tag: 'TVar'; name: Name }
export const TVar = (name: Name): TVar => ({ tag: 'TVar', name });

export interface TMeta { tag: 'TMeta'; name: Name; type: Type | null }
export const TMeta = (name: Name, type?: Type): TMeta => ({ tag: 'TMeta', name, type: type || null });
export const freshMeta = (name?: Name) => TMeta(fresh(name));

export interface TFun { tag: 'TFun'; left: Type; right: Type }
export const TFun = (left: Type, right: Type): TFun => ({ tag: 'TFun', left, right });

export const flattenTFun = (ty: Type): Type[] => {
  const r: Type[] = [];
  let c = ty;
  while (c.tag === 'TFun') {
    r.push(c.left);
    c = c.right;
  }
  r.push(c);
  return r;
};

export const showTy = (ty: Type): string => {
  switch (ty.tag) {
    case 'TVar': return ty.name;
    case 'TMeta': return `^${ty.name}`;
    case 'TFun': return `(${showTy(ty.left)} -> ${showTy(ty.right)})`;
  }
};

export type FreeMeta = { [key: string]: boolean };
export const freeTy = (ty: Type, free: FreeMeta = {}): FreeMeta => {
  switch (ty.tag) {
    case 'TVar': return free;
    case 'TMeta': free[ty.name] = true; return free;
    case 'TFun': return freeTy(ty.right, freeTy(ty.left, free));
  }
};

export type Subst = { [key: string]: Type };
export const substMeta = (ty: Type, map: Subst): Type => {
  switch (ty.tag) {
    case 'TVar': return ty;
    case 'TMeta': return map[ty.name] || ty;
    case 'TFun': return TFun(substMeta(ty.left, map), substMeta(ty.right, map));
  }
};

export const prettyTy = (ty: Type): string => {
  switch (ty.tag) {
    case 'TVar': return ty.name;
    case 'TMeta': return `^${ty.name}`;
    case 'TFun': return flattenTFun(ty)
      .map(t => t.tag === 'TFun' ? `(${prettyTy(t)})` : prettyTy(t))
      .join(' -> ');
  }
};

// forall
export interface Forall { tag: 'Forall'; args: Name[]; type: Type }
export const Forall = (args: Name[], type: Type): Forall => ({ tag: 'Forall', args, type });

export const showForall = (ty: Forall) =>
  ty.args.length === 0 ? showTy(ty.type) : `forall ${ty.args.join(' ')}. ${showTy(ty.type)}`;

export const freeForall = (ty: Forall, free: FreeMeta = {}): FreeMeta => {
  const fr = freeTy(ty.type, free);
  for (let i = 0; i < ty.args.length; i++) fr[ty.args[i]] = false;
  return fr;
};

export const simplifyNames = (ns: Name[]): Name[] => {
  const map: { [key: string]: number } = {};
  const ret: Name[] = [];
  for (let i = 0; i < ns.length; i++) {
    let n = namePart(ns[i]);
    if (n === '_') n = 't';
    if (!map[n]) {
      map[n] = 1;
      ret.push(n);
    } else {
      const ind = map[n]++;
      ret.push(`${n}${ind - 1}`);
    }
  }
  return ret;
};
export const prettyForall = (ty: Forall) => {
  const args = ty.args;
  if (args.length === 0) return prettyTy(ty.type);
  const sargs = simplifyNames(args);
  const map: Subst = {};
  for (let i = 0; i < args.length; i++) map[args[i]] = TVar(sargs[i]);
  return `forall ${sargs.join(' ')}. ${prettyTy(substMeta(ty.type, map))}`;
};

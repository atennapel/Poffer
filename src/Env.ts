import { Forall, FreeMeta, freeForall } from './types';
import { Name } from './Name';

export type Env = { [key: string]: Forall };
export const extend = (env: Env, name: Name, type: Forall): Env => {
  const nenv: Env = Object.create(env);
  nenv[name] = type;
  return nenv;
};

export const freeEnv = (env: Env, free: FreeMeta = {}): FreeMeta => {
  let fr = free;
  for (let k in env) fr = freeForall(env[k], fr);
  return fr;
};

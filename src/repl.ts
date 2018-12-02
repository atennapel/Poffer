import { Env } from './Env';
import { Forall, TVar, showForall, prettyForall } from './types';
import { inferGen } from './inference';
import { isError } from 'util';
import { compile } from './compile';
import parse from './parser';
import { showExpr } from './exprs';

export const _env: Env = {
  Unit: Forall([], TVar('Unit')),
  True: Forall([], TVar('Bool')),
  False: Forall([], TVar('Bool')),
};

function _show(x: any): string {
  if (typeof x === 'function') return '[Fn]';
  if (x._tag) return x._tag;
  return '' + x;
}

let _ctx = _env;
export default function _run(i: string, cb: (output: string, err?: boolean) => void): void {
  try {
    console.log(i);
    const p = parse(i);
    console.log(showExpr(p));
    const result = inferGen(_ctx, p);
    if (isError(result)) throw result;
    else {
      const ty = result as Forall;
      console.log(showForall(ty));
      const c = compile(p);
      console.log(c);
      const res = eval(c);
      cb(`${_show(res)} : ${prettyForall(ty)}`);
    }
  } catch(e) {
    console.log(e);
    cb(''+e, true);
  }
}

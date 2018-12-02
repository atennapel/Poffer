import { Env } from './Env';
import { Forall, TVar, showForall, prettyForall, TFun, TMeta } from './types';
import { inferGen, inferDefs } from './inference';
import { isError } from 'util';
import { compile, compileDefs } from './compile';
import parse from './parser';
import { showExpr } from './exprs';
import { combinators } from './combinators';

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
export function _startup(cb: (output: string, err?: boolean) => void): void {
  const res = inferDefs(_ctx, combinators);
  if (typeof res === 'string') return cb(`type error in combinators: ${res}`, true);
  _ctx = res;
  try {
    const c = `(function() {${compileDefs(combinators)}})()`;
    eval(c);
    return cb('combinators loaded');
  } catch (err) {
    return cb(''+err, true);
  }
}
export function _run(i: string, cb: (output: string, err?: boolean) => void): void {
  try {
    console.log(i);
    const p = parse(i);
    console.log(showExpr(p));
    const result = inferGen(_ctx, p);
    if (typeof result === 'string') throw result;
    else {
      const ty = result;
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

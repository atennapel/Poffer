import { Env } from './Env';
import { Forall, TVar, showForall, prettyForall, TFun, TMeta } from './types';
import { inferGen, inferDefs } from './inference';
import { isError } from 'util';
import { compile, compileDefs } from './compile';
import parse from './parser';
import { showExpr } from './exprs';
import { combinators } from './combinators';

export const _env: Env = {
  Y: Forall(['t'], TFun(TFun(TMeta('t'), TMeta('t')), TMeta('t'))),

  caseVoid: Forall(['t'], TFun(TVar('Void'), TMeta('t'))),

  Unit: Forall([], TVar('Unit')),
  caseUnit: Forall(['t'], TFun(TMeta('t'), TFun(TVar('Unit'), TMeta('t')))),

  True: Forall([], TVar('Bool')),
  False: Forall([], TVar('Bool')),
  caseBool: Forall(['t'], TFun(TMeta('t'), TFun(TMeta('t'), TFun(TVar('Bool'), TMeta('t'))))),

  Zero: Forall([], TVar('Nat')),
  Succ: Forall([], TFun(TVar('Nat'), TVar('Nat'))),
  caseNat: Forall(['t'], TFun(TMeta('t'), TFun(TFun(TVar('Nat'), TMeta('t')), TFun(TVar('Nat'), TMeta('t'))))),
};

function _show(x: any): string {
  if (typeof x === 'function') return '[Fn]';
  if (x._tag) {
    if (x._tag === 'Zero') return '0';
    if (x._tag === 'Succ') {
      let n = 0;
      let c = x;
      while(c._tag === 'Succ') { n++; c = c.val }
      return `${n}`;
    }
    return x.val ? `(${x._tag} ${_show(x.val)})` : x._tag;
  }
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

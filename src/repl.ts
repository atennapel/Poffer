import { Env, initialEnv } from "./env";
import { parse } from "./parser";
import { showExpr } from "./exprs";
import { infer } from "./inference";
import { showQual } from "./types";
import { compile } from "./compiler";

const _env: Env = initialEnv;

function _show(x: any): string {
  if (typeof x === 'string') return JSON.stringify(x);
  if (typeof x === 'function') return '[Function]';
  if (typeof x._tag === 'string') {
    if (x._tag === 'Thunk') {
      if (x.forced) return `Thunk(${_show(x.val)})`;
      return `Thunk(...)`;
    }
    if (x._tag === 'Type') {
      if (!x.args || x.args.length === 0) return x.name;
      const sargs = x.args.map(_show);
      if (/[^a-z]/i.test(x.name) && sargs.length >= 2)
        return `(${sargs[0]} ${x.name} ${sargs.slice(1).join(' ')})`;
      return `(${x.name} ${sargs.join(' ')})`;
    }
    return typeof x.val === 'undefined' ? x._tag :
      Array.isArray(x.val) ? `(${x._tag} ${x.val.map(_show).join(' ')})` :
      `(${x._tag} ${_show(x.val)})`;
  }
  if (typeof x === 'object' && x._rec) {
    const r = [];
    for (let k in x) if (k[0] !== '_') r.push(`${k}: ${_show(x[k])}`);
    return `{${r.join(', ')}}`;
  }
  if (Array.isArray(x)) return `[${x.map(_show).join(' ')}]`;
  return '' + x;
}

export default function _run(_i: string, cb: (output: string, err?: boolean) => void): void {
  try {
    console.log(_i);
    const _p = parse(_i);
    console.log(showExpr(_p));
    let time = Date.now();
    const result = infer(_env, _p);
    console.log(`${Date.now() - time}ms`);
    console.log(`${showQual(result)}`);
    const _c = compile(_p);
    console.log(_c);
    time = Date.now();
    const res = eval(_c);
    console.log(`${Date.now() - time}ms`);
    cb(`${_show(res)} : ${showQual(result)}`);
  } catch(e) {
    console.log(e);
    cb(''+e, true);
  }
}

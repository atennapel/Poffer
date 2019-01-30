import { showType, TCon, tapp, Type, showQual, Qual, freshTMeta } from "./types";
import { tfun, tv, initialEnv, kType, Env } from "./env";
import { Var, app, showExpr } from "./exprs";
import { infer } from "./inference";
import { KFun } from "./kinds";

const $ = Var;
const tnat = TCon('Nat', kType);
const tList = TCon('List', KFun(kType, kType));
const tlist = (t: Type) => tapp(tList, t);

const env: Env = Object.assign({}, initialEnv, {
  singleton: Qual([], tfun(tv(0), tlist(tv(0)))),
  Z: Qual([], tnat),
  S: Qual([], tfun(tnat, tnat)),
} as Env);
const expr = app($('K'), $('Z'), $('Z'));
console.log(showExpr(expr));
const microtime = require('microtime');
try {
  let time = microtime.now();
  const type = infer(env, expr);
  time = microtime.now() - time;
  console.log(showQual(type));
  console.log(`${time}us`);
} catch(err) {
  console.log('' + err);
}

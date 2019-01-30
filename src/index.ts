import { showType, TCon, tapp, Type } from "./types";
import { tfun, tv, initialEnv, kType } from "./env";
import { Var, app, showExpr } from "./exprs";
import { infer } from "./inference";
import { KFun } from "./kinds";

const $ = Var;
const tnat = TCon('Nat', kType);
const tList = TCon('List', KFun(kType, kType));
const tlist = (t: Type) => tapp(tList, t);

const env = Object.assign({}, initialEnv, {
  singleton: tfun(tv(0), tlist(tv(0))),
  Z: tnat,
  S: tfun(tnat, tnat),
});
const expr = app($('singleton'), $('Z'));
console.log(showExpr(expr));
const microtime = require('microtime');
try {
  let time = microtime.now();
  const type = infer(env, expr);
  time = microtime.now() - time;
  console.log(showType(type));
  console.log(`${time}us`);
} catch(err) {
  console.log('' + err);
}

import { showQual } from "./types";
import { initialEnv, Env } from "./env";
import { showExpr } from "./exprs";
import { infer } from "./inference";
import { parse } from "./parser";
import { compile } from "./compiler";

const lib = require('fs').readFileSync('lib.js', 'utf8');

const env: Env = initialEnv

const script = `i(i(i0))`;

try {
  const expr = parse(script);
  console.log(showExpr(expr));
  const microtime = require('microtime');
  let time = microtime.now();
  const type = infer(env, expr);
  time = microtime.now() - time;
  console.log(showQual(type));
  console.log(`${time}us`);
  const c = compile(expr);
  console.log(c);
  const e = eval(`(()=>{${lib};return(${c})})()`);
  console.log(e);
} catch(err) {
  console.log('' + err);
}

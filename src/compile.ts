import { Expr } from './exprs';
import { Defs } from './defs';

export const compile = (expr: Expr): string => {
  switch (expr.tag) {
    case 'Var': return expr.name;
    case 'Abs': return `(${expr.arg} => ${compile(expr.body)})`;
    case 'App': return `${compile(expr.left)}(${compile(expr.right)})`;
    case 'Let': return `(${expr.name} => ${compile(expr.body)})(${compile(expr.val)})`;
  }
};

export const compileDefs = (defs: Defs): string => {
  const r: string[] = [];
  for (let k in defs) {
    r.push(`window['${k}'] = ${compile(defs[k])}`);
  }
  return r.join(';') + ';';
}

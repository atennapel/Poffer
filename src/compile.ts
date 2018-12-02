import { Expr } from './exprs';

export const compile = (expr: Expr): string => {
  switch (expr.tag) {
    case 'Var': return expr.name;
    case 'Abs': return `(${expr.arg} => ${compile(expr.body)})`;
    case 'App': return `${compile(expr.left)}(${compile(expr.right)})`;
    case 'Let': return `(${expr.name} => ${compile(expr.body)})(${compile(expr.val)})`;
  }
};

import { Name } from './Name';

export type Expr = Var | Abs | App | Let;

export interface Var { tag: 'Var'; name: Name }
export const Var = (name: Name): Var => ({ tag: 'Var', name });

export interface Abs { tag: 'Abs'; arg: Name; body: Expr }
export const Abs = (arg: Name, body: Expr): Abs => ({ tag: 'Abs', arg, body });

export interface App { tag: 'App'; left: Expr; right: Expr }
export const App = (left: Expr, right: Expr): App => ({ tag: 'App', left, right });
export const appFrom = (es: Expr[]): Expr => es.reduce(App);

export interface Let { tag: 'Let'; name: Name; val: Expr; body: Expr }
export const Let = (name: Name, val: Expr, body: Expr): Let => ({ tag: 'Let', name, val, body });

export const showExpr = (expr: Expr): string => {
  switch (expr.tag) {
    case 'Var': return expr.name;
    case 'Abs': return `(\\${expr.arg} -> ${showExpr(expr.body)})`;
    case 'App': return `(${showExpr(expr.left)} ${showExpr(expr.right)})`;
    case 'Let': return `(let ${expr.name} = ${showExpr(expr.val)} in ${showExpr(expr.body)})`;
  }
};

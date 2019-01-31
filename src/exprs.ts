import { impossible } from "./util";

export type Expr = Var | App | NatLit | Thunk;

export interface Var {
  readonly tag: 'Var';
  readonly name: string;
}
export const Var = (name: string): Var => ({ tag: 'Var', name });
export const isVar = (expr: Expr): expr is Var => expr.tag === 'Var';

export interface App {
  readonly tag: 'App';
  readonly left: Expr;
  readonly right: Expr;
}
export const App = (left: Expr, right: Expr): App => ({ tag: 'App', left, right });
export const isApp = (expr: Expr): expr is App => expr.tag === 'App';
export const app = (...expr: Expr[]): Expr => expr.reduce(App);

export interface NatLit {
  readonly tag: 'NatLit';
  readonly val: string;
}
export const NatLit = (val: string): NatLit => ({ tag: 'NatLit', val });
export const isNatLit = (expr: Expr): expr is NatLit => expr.tag === 'NatLit';

export interface Thunk {
  readonly tag: 'Thunk';
  readonly expr: Expr;
}
export const Thunk = (expr: Expr): Thunk => ({ tag: 'Thunk', expr });
export const isThunk = (expr: Expr): expr is Thunk => expr.tag === 'Thunk';

export const showExpr = (expr: Expr): string => {
  if (isVar(expr)) return expr.name;
  if (isApp(expr)) return `(${showExpr(expr.left)} ${showExpr(expr.right)})`;
  if (isNatLit(expr)) return expr.val;
  if (isThunk(expr)) return `{${showExpr(expr.expr)}}`;
  return impossible('showExpr');
};

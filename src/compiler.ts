import { isVar, isApp, isNatLit, Expr, isThunk } from "./exprs";
import { impossible } from "./util";

export const compile = (expr: Expr): string => {
  if (isVar(expr)) return expr.name;
  if (isApp(expr)) return `${compile(expr.left)}(${compile(expr.right)})`;
  if (isNatLit(expr)) return `${expr.val}n`;
  if (isThunk(expr)) return `(_ => ${compile(expr.expr)})`;
  return impossible('compile');
};

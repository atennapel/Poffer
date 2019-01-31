import { isVar, isApp, isNatLit, Expr } from "./exprs";
import { impossible } from "./util";

export const compile = (expr: Expr): string => {
  if (isVar(expr)) return expr.name;
  if (isApp(expr)) return `${compile(expr.left)}(${compile(expr.right)})`;
  if (isNatLit(expr)) return `${expr.val}n`;
  return impossible('compile');
};

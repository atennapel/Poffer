import { isVar, isApp, isNatLit, Expr, isThunk } from "./exprs";
import { impossible } from "./util";

const sigilmarks: { [key: string]: string } = {
  '%': 't',
  '#': 'm',
  '?': 'q',
};

const compileName = (name: string): string => {
  const sigils = name.split(/[a-z]+/i)[0];
  if (!sigils) return name;
  const sgc = sigils.split('').map(c => sigilmarks[c] || '').join('');
  return `${sgc}\$${name.slice(sigils.length)}`;
};

export const compile = (expr: Expr): string => {
  if (isVar(expr)) return compileName(expr.name);
  if (isApp(expr)) return `${compile(expr.left)}(${compile(expr.right)})`;
  if (isNatLit(expr)) return `${expr.val}n`;
  if (isThunk(expr)) return `_thunk(() => ${compile(expr.expr)})`;
  return impossible('compile');
};

import { Env } from "./env";
import { Type } from "./types";
import { Expr } from "./exprs";
import { tyerr } from "./util";

const synth = (env: Env, expr: Expr): Type => {
  return tyerr('unimplemented');
}

export const infer = (env: Env, expr: Expr): Type => {
  return tyerr('unimplemented');
};

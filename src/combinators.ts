import { Defs } from './defs';
import { abs, Var, apps } from './exprs';

const $ = Var;

export const combinators: Defs = {
  A: abs(['f', 'x'], apps($('f'), $('x'))),
  B: abs(['f', 'g', 'x'], apps($('f'), apps($('g'), $('x')))),
  C: abs(['f', 'x', 'y'], apps($('f'), $('y'), $('x'))),
  D: abs(['f', 'g', 'x', 'y'], apps($('f'), apps($('g'), $('x'), $('y')))),
  F: abs(['f', 'g', 'h', 'x'], apps($('f'), apps($('g'), $('x')), apps($('h'), $('x')))),
  G: abs(['f', 'g', 'h', 'x', 'y'], apps($('f'), apps($('g'), $('x'), $('y')), apps($('h'), $('x'), $('y')))),
  I: abs(['x'], $('x')),
  K: abs(['x', 'y'], $('x')),
  L: abs(['x', 'y', 'z'], apps($('x'), apps($('y'), $('z')), $('z'))),
  P: abs(['f', 'g', 'x', 'y'], apps($('f'), apps($('g'), $('x')), apps($('g'), $('y')))),
  R: abs(['x', 'y'], $('y')),
  S: abs(['x', 'y', 'z'], apps($('x'), $('z'), apps($('y'), $('z')))),
  T: abs(['x', 'f'], apps($('f'), $('x'))),
  W: abs(['f', 'x'], apps($('f'), $('x'), $('x'))),
};

/* Combinators
A apply
B compose (fmap)
C flip
D compose2
E
F fork (\f g h x -> f (g x) (h x)) (fmap2)
G fork2 (\f g h x y -> f (g x y) (h x y))
H
I id
J
K const
L left-map-fork (\f g x -> f (g x) x) (bind, >>=)
M
N
O
P psi (\f g x -> f (g x) (g y))
Q
R right (\x y -> y)
S share-env (subst) (app, <*>)
T revapp
U
V
W double (\f x -> f x x)
X
Y fix (trampolined?)
Z memoized fix (trampolined?)
*/

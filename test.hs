I x = x;
K x y = x;
R x y = y;
S x y z = x z (y z);
W f x = f x x;
C f x y = f y x;
B f g x = f (g x);
F f g h x = f (g x) (h x);

Unit x = x;

True x y = x;
False x y = y;
cond c a b = c a b;
not b = cond b False True;
and a b = cond a b False;
or a b = cond a True b;

Z fz fs = fz ();
S n fz fs = fs n;
inc = S;
dec n = n Z I;

main x = dec (S Z);

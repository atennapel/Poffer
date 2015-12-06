var id = function(x) {return x};
var constant = function(x) {return function(y) {return x}};
var constantf = function(x) {return typeof x === 'function'? x: constant(x)};
var unit = {toString: function() {return 'Unit'}};
var app = function(x) {return function(f) {return constantf(f)(x)}};

var add = function(x) {return function(y) {return x + y}};
var mul = function(x) {return function(y) {return x * y}};
var div = function(x) {return function(y) {return x / y}};
var divisible = function(x) {return function(y) {return x % y === 0}};

var eq = function(x) {return function(y) {return x === y}};

var len = function(a) {return a.length};

var fold = foldl = function(f) {
	return function(v) {
		return function(a) {
			for(var i = 0, l = a.length, c = v, g = constantf(f); i < l; i++) c = g(c)(a[i]);
			return c;
		};
	};
};
var foldr = function(f) {
	return function(v) {
		return function(a) {
			for(var i = a.length - 1, c = v, g = constantf(f); i >= 0; i--) c = g(a[i])(c);
			return c;
		};
	};
};
var map = function(f) {
	return function(a) {
		for(var i = 0, l = a.length, r = [], g = constantf(f); i < l; i++) r.push(g(a[i]));
		return r;
	};
};
var filter = function(f) {
	return function(a) {
		for(var i = 0, l = a.length, r = [], g = constantf(f); i < l; i++) if(g(a[i])) r.push(a[i]);
		return r;
	};
};
var to = function(a) {
	return function(b) {
		for(var i = a, r = []; i <= b; i++) r.push(i);
		return r;
	};
};

var flip = function(f) {return function(x) {return function(y) {return constantf(f)(y)(x)}}};
var double = function(f) {return function(x) {return constantf(f)(x)(x)}};
var comp = function(f) {return function(g) {return function(x) {return constantf(g)(constantf(f)(x))}}};
var compA = fold(comp)(id);
var fork = function(f) {
	return function(g) {
		return function(h) {
			return function(x) {
				return constantf(g)(constantf(f)(x))(constantf(h)(x));
			};
		};
	};
};
var forkA = function(a) {
	if(a.length === 0) return id;
	if(a.length === 1) return double(constantf(a[0]));
	var b = map(constantf)(a.length % 2? a: a.concat(id));
	var c = fork(b[0])(b[1])(b[2]);
	for(var i = 3, l = b.length; i < l; i += 2) c = fork(c)(b[i])(b[i+1]);
	return c;
};
var cond = function(c) {
	return function(t) {
		return function(f) {
			return function(x) {
				return constantf(c)(x)? constantf(t)(x): constantf(f)(x);
			};
		};
	};
};
var condA = function(a) {
	if(a.length === 0) return id;
	if(a.length === 1) return constantf(a[0]);
	var b = map(constantf)(a.length % 2? a: a.concat(id));
	var l = b.length - 1;
	var c = cond(b[l - 2])(b[l - 1])(b[l]);
	for(var i = l - 3; i >= 0; i -= 2) c = cond(b[i-1])(b[i])(c);
	return c;
};

var count = compA([flip(cond)(constant(add(1))), app(constant(id)), flip(foldr)(0)]);


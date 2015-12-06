// HM
// @author: Albert ten Napel
// @todo: test Higher order kinds, row-polymorphism

// util
var terr = function(msg) {throw new TypeError(msg)};

// set
var Set = function(o) {this.o = o};
Set.prototype.toString = function() {return '{' + Object.keys(this.o).join(', ') + '}'};
Set.prototype.union = function(s) {
	var n = {};
	for(var k in this.o) n[k] = true;
	for(var k in s.o) n[k] = true;
	return new Set(n);
};
Set.prototype.difference = function(s) {
	var n = {};
	for(var k in this.o) n[k] = true;
	for(var k in s.o) n[k] = false;
	return new Set(n);
};
Set.prototype.has = function(k) {return this.o[k]};
Set.prototype.toMap = function(f) {
	var r = [];
	Object.keys(this.o).forEach(function(k) {
		var a = f(k);
		r.push(a[0], a[1]);
	});
	return Map.fromArray(r);
};

Set.empty = new Set({});
Set.of = function() {
	for(var i = 0, o = {}, l = arguments.length; i < l; i++) o[arguments[i]] = true;
	return new Set(o);
};
Set.flatten = function(a) {return a.reduce(function(a, b) {return a.union(b)}, Set.empty)};

// map
var Map = function(o) {this.o = o};
Map.prototype.toString = function() {
	var o = this.o;
	return '{' + Object.keys(o).map(function(k) {return k + ': ' + o[k]}).join(', ') + '}';
};
Map.prototype.keys = function() {return Object.keys(this.o)};
Map.prototype.vals = function() {
	var o = this.o;
	return Object.keys(o).map(function(k) {return o[k]});
};
Map.prototype.has = function(k) {return !!this.o[k]};
Map.prototype.get = function(k) {return this.o[k]};
Map.prototype.getOr = function(k, x) {return this.o[k] || x};
Map.prototype.map = function(f) {
	var n = {};
	for(var k in this.o) n[k] = f(this.o[k], k);
	return new Map(n);
};
Map.prototype.filter = function(f) {
	var n = {};
	for(var k in this.o) if(f(this.o[k], k)) n[k] = this.o[k];
	return new Map(n);
};
Map.prototype.union = function(o) {
	var n = {};
	for(var k in this.o) n[k] = this.o[k];
	for(var k in o.o) n[k] = o.o[k];
	return new Map(n);
};

Map.empty = new Map({});
Map.fromArray = function(a) {
	for(var i = 0, o = {}, l = a.length; i < l; i += 2) o[a[i]] = a[i+1];
	return new Map(o);
};
Map.of = function() {return Map.fromArray(arguments)};

// kinds
var K = {};

K.Star = function() {};
K.Star.prototype.toString = function() {return '*'};
K.star = new K.Star();

K.Fn = function(a, b) {this.a = a; this.b = b};
K.Fn.prototype.toString = function() {return '(' + this.a + ' ~> ' + this.b + ')'};
K.fn = function() {
	if(arguments.length < 2) terr('too few arguments for kind function');
	return Array.prototype.reduceRight.call(arguments, function(a, b) {return new K.Fn(b, a)});
};

K.eq = function(a, b) {
	if(a instanceof K.Star) return b instanceof K.Star;
	if(a instanceof K.Fn) return b instanceof K.Fn && K.eq(a.a, b.a) && K.eq(a.b, b.b);
};

// types
var T = {};

T.Var = function(id, kind, nick) {this.id = id; this.kind = kind; this.nick = nick || ''};
T.Var.prototype.toString = function() {return "'" + this.nick + this.id /*+ ' :: ' + this.kind*/};
T.Var.id = 0;
T.var = function(kind, nick) {return new T.Var(T.Var.id++, kind, nick)};

T.Con = function(name, kind) {this.name = name; this.kind = kind};
T.Con.prototype.toString = function() {return /*'(' +*/ this.name /*+ ' :: ' + this.kind + ')'*/};
T.con = function(name, kind) {return new T.Con(name, kind)};

T.App = function(con, arg) {
	var ckind = con.kind, akind = arg.kind;
	if(ckind instanceof K.Star) terr('cannot apply ' + con + ', invalid kind ' + ckind);
	if(!K.eq(ckind.a, akind)) terr('kind mismatch, expected ' + ckind.a + ' but got ' + akind);
	this.con = con; this.arg = arg; this.kind = ckind.b;
};
T.App.prototype.toString = function() {return '(' + this.con + ' ' + this.arg /*+ ' :: ' + this.kind*/ + ')'};
T.app = function() {
	if(arguments.length < 2) terr('too few arguments for type application');
	return Array.prototype.reduce.call(arguments, function(a, b) {return new T.App(a, b)});
};

T.Scheme = function(bound, type) {this.bound = bound; this.type = type};
T.Scheme.prototype.toString = function() {return '\\' + this.bound + ' ' + this.type};
T.scheme = function(bound, type) {return new T.Scheme(bound, type)};

T.Int = T.con('Int', K.star);
T.Float = T.con('Float', K.star);
T.Bool = T.con('Bool', K.star);
T.Str = T.con('Str', K.star);
T.List = T.con('List', K.fn(K.star, K.star));
T.Fn = T.con('Fn', K.fn(K.star, K.star, K.star));
T.fn = function() {
	if(arguments.length === 0) return T.Fn;
	if(arguments.length === 1) return T.app(T.Fn, arguments[0]);
	return Array.prototype.reduceRight.call(arguments, function(a, b) {
		return T.app(T.Fn, b, a);
	});
};

T.free = function(t) {
	if(t instanceof T.Var) return Set.of(t.id);
	if(t instanceof T.Con) return Set.empty;
	if(t instanceof T.App) return T.free(t.con).union(T.free(t.arg));
	if(t instanceof T.Scheme) return T.free(t.type).difference(t.bound);
	if(t instanceof Map) return Set.flatten(t.vals().map(T.free));
	terr('type missed in free');
};

T.generalize = function(env, t) {return T.scheme(T.free(t).difference(T.free(env)), t)};

T.substitute = function(sub, t) {
	if(t instanceof T.Var) return sub.getOr(t.id, t);
	if(t instanceof T.Con) return t;
	if(t instanceof T.App) return T.app(T.substitute(sub, t.con), T.substitute(sub, t.arg));
	if(t instanceof Map) return t.map(function(v) {return T.substitute(sub, v)});
	if(t instanceof T.Scheme) {
		var nsub = sub.filter(function(_, id) {return !t.bound.has(id)});
		return T.scheme(t.bound, T.substitute(nsub, t.type));
	} 
	terr('substitution failed: ' + sub + ' over ' + t);
};

T.instantiate = function(t) {
	if(t instanceof T.Scheme) {
		var subs = t.bound.toMap(function(k) {return [k, T.var(K.star)]});
		return T.substitute(subs, t.type);
	}
	return t;
};

T.occursIn = function(v, t) {
	return T.free(t).has(v.id);
};

T.kind = function(t) {
	if(t instanceof T.Var) return t.kind;
	if(t instanceof T.Con) return t.kind;
	if(t instanceof T.App) return t.kind;
	if(t instanceof T.Scheme) return t.type.kind;
	terr('cannot get kind of ' + t); 
};

T.unify = function(a, b) {
	if(a instanceof T.Var) {
		if(a === b) return Map.empty;
		if(T.occursIn(a, b)) terr('recursive unification: ' + a + ' and ' + b);
		var ka = a.kind, kb = T.kind(b);
		if(!K.eq(ka, kb))
			terr('unification failed for ' + a + ' and ' + b + ', unmatched kinds ' + ka + ' and ' + kb);
		return Map.of(a.id, b);
	}
	if(b instanceof T.Var) return T.unify(b, a);
	if(a instanceof T.Con && b instanceof T.Con && a.name === b.name && K.eq(a.kind, b.kind))
		return Map.empty;
	if(a instanceof T.App && b instanceof T.App) {
		var sub = T.unify(a.con, b.con);
		return sub.union(T.unify(T.substitute(sub, a.arg), T.substitute(sub, b.arg)));
	}
	terr('unification failed for ' + a + ' and ' + b);
};

// exprs
var E = {};

E.wrap = function(x) {return typeof x === 'string'? E.id(x): x};

E.Id = function(id) {this.id = id};
E.Id.prototype.toString = function() {return this.id};
E.id = function(id) {return new E.Id(id)};

E.App = function(fn, arg) {this.fn = fn; this.arg = arg};
E.App.prototype.toString = function() {return '(' + this.fn + ' ' + this.arg + ')'};
E.app = function() {
	if(arguments.length < 2) terr('too few arguments for application');
	return Array.prototype.reduce.call(arguments,
		function(a, b) {return new E.App(E.wrap(a), E.wrap(b))});
};

E.Result = function(sub, type) {this.sub = sub; this.type = type};
E.Result.prototype.toString = function() {return '' + this.type};
E.Result.prototype.substitute = function() {return new E.Result(this.sub, T.substitute(this.sub, this.type))};
E.result = function(sub, type) {return new E.Result(sub, type)};

E.infer = function(expr, env) {
	var env = env || Map.empty;
	if(expr instanceof E.Id) {
		if(env.has(expr.id)) return E.result(Map.empty, T.instantiate(env.get(expr.id)));
		terr('unknown symbol ' + expr);
	}
	if(expr instanceof E.App) {
		var sub = Map.empty;
		var o = E.infer(expr.fn, env);
		sub = sub.union(o.sub);
		var k = E.infer(expr.arg, T.substitute(sub, env));
		sub = sub.union(k.sub);
		var t = T.var(K.star);
		var s = T.unify(T.substitute(sub, o.type), T.substitute(sub,T.app(T.Fn, k.type, t)));
		sub = sub.union(s);
		return E.result(sub, t).substitute();
	}
	terr('invalid expr type ' + expr);
};

// testing
var t = T.var(K.star, 't'), f = T.var(K.fn(K.star, K.star), 'f');
var a = T.var(K.star, 'a'), b = T.var(K.star, 'b');
var env = new Map({
	i0: T.Int,
	isZero: T.fn(T.Int, T.Bool),
	not: T.fn(T.Bool, T.Bool),
	map: T.fn(T.fn(a, b), T.app(f, a), T.app(f, b)),
	lInt: T.app(T.List, T.Int),
	lBool: T.app(T.List, T.Bool),
}); 

var exprs = [
	'i0',
	'isZero',
	E.app('isZero', 'i0'),
	'map',
	E.app('map', 'isZero'),
	E.app('map', 'isZero', 'lInt'),
	E.app('map', 'isZero', 'lBool'),
	E.app('map', 'not', 'lBool'),
];

exprs.forEach(function(e) {
	var e = E.wrap(e);
	console.log('' + e);
	try {
		var res = E.infer(e, env);
		console.log('' + res.type);
		console.log('' + res.sub);
	} catch(err) {
		console.log('' + err);
	}
	console.log();
});


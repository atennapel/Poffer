// HM
// @author: Albert ten Napel
// @todo: testing, test if instantiate truly works 

// util
var terr = function(msg) {throw new TypeError(msg)};

// set
var Set = function(o) {this.o = o};
Set.prototype.toString = function() {return '{' + this.toArray().join(', ') + '}'};
Set.prototype.union = function(s) {
	var n = {};
	for(var k in this.o) if(this.o[k]) n[k] = true;
	for(var k in s.o) if(s.o[k]) n[k] = true;
	return new Set(n);
};
Set.prototype.difference = function(s) {
	var n = {};
	for(var k in this.o) if(this.o[k]) n[k] = true;
	for(var k in s.o) if(s.o[k]) n[k] = false;
	return new Set(n);
};
Set.prototype.has = function(k) {return this.o[k]};
Set.prototype.toMap = function(f) {
	var r = [];
	this.toArray().forEach(function(k) {
		var a = f(k);
		r.push(a[0], a[1]);
	});
	return Map.fromArray(r);
};
Set.prototype.isEmpty = function() {
	for(var k in this.o) if(this.o[k]) return false;
	return true;
};
Set.prototype.intersection = function(o) {
	var n = {};
	for(var k in this.o) if(this.o[k] && o.has(k)) n[k] = true;
	return new Set(n);
};
Set.prototype.toArray = function() {
	var r = [];
	for(var k in this.o) if(this.o[k]) r.push(k);
	return r;
};
Set.prototype.isSubsetOf = function(o) {
	for(var k in this.o) if(this.o[k] && !o.has(k)) return false;
	return true;
};

Set.empty = new Set({});
Set.fromArray = function(a) {
	for(var i = 0, o = {}, l = a.length; i < l; i++) o[a[i]] = true;
	return new Set(o);
};
Set.of = function() {return Set.fromArray(arguments)};
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
Map.prototype.add = function(k, v) {
	var n = {};
	for(var i in this.o) n[i] = this.o[i];
	n[k] = v;
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
	var ckind = T.kind(con), akind = T.kind(arg);
	if(ckind instanceof K.Star) terr('cannot apply ' + con + ', invalid kind ' + ckind);
	if(!K.eq(ckind.a, akind)) terr('kind mismatch, expected ' + ckind.a + ' but got ' + akind);
	this.con = con; this.arg = arg; this.kind = ckind.b;
};
T.App.prototype.toString = function() {return '(' + this.con + ' ' + this.arg /*+ ' :: ' + this.kind*/ + ')'};
T.app = function() {
	if(arguments.length < 2) terr('too few arguments for type application');
	return Array.prototype.reduce.call(arguments, function(a, b) {return new T.App(a, b)});
};

T.Record = function(map, rest) {this.map = map; this.rest = rest || null};
T.Record.prototype.toString = function() {
	var map = this.map;
	return '{' +
		map.keys().map(function(k) {return k + ': ' + map.get(k)}).join(', ') +
		(this.rest? ' | ' + this.rest: '') +
	'}';
};
T.record = function(a, b) {return new T.Record(a, b)};

T.Fn = T.con('Fn', K.fn(K.star, K.star, K.star));
T.fn = function() {
	if(arguments.length === 0) return T.Fn;
	if(arguments.length === 1) return T.app(T.Fn, arguments[0]);
	return Array.prototype.reduceRight.call(arguments, function(a, b) {
		return T.app(T.Fn, b, a);
	});
};

T.Implicit = function(t, r) {this.type = t; this.ret = r; this.kind = T.kind(r)}
T.Implicit.prototype.toString = function() {return '(implicit ' + this.type + ' -> ' + this.ret + ')'};
T.im = function(t, r) {return new T.Implicit(t, r)};

T.Scheme = function(bound, type) {this.bound = bound; this.type = type};
T.Scheme.prototype.toString = function() {return '\\' + this.bound + ' ' + this.type};
T.scheme = function(bound, type) {return new T.Scheme(bound, type)};

T.free = function(type) {
	if(type instanceof T.Var) return Set.of(type.id);
	if(type instanceof T.Con) return Set.empty;
	if(type instanceof T.App) return T.free(type.con).union(T.free(type.arg));
	if(type instanceof T.Implicit) return T.free(type.type).union(T.free(type.ret));
	if(type instanceof T.Record) return type.rest? T.free(type.rest).union(T.free(type.map)): T.free(type.map);
	if(type instanceof T.Scheme) return T.free(type.type).difference(type.bound);
	if(type instanceof Map) return Set.flatten(type.vals().map(T.free));
	terr('type missed in free: ' + type);
};

T.generalize = function(env, t) {return T.scheme(T.free(t).difference(T.free(env)), t)};

T.mergeRecord = function(r) {
	if(!(r.rest && r instanceof T.Record)) return r;
	var rest = T.mergeRecord(r.rest);
	if(!(rest instanceof T.Record)) return new T.Record(r.map, rest);
	var ka = Set.fromArray(r.map.keys());
	var kr = Set.fromArray(rest.map.keys());
	if(!ka.intersection(kr).isEmpty()) throw new TypeError('failed to merge ' + r);
	return T.record(rest.map.union(r.map), rest.rest);
};

T.substitute = function(sub, t) {
	if(t instanceof T.Var) return sub.getOr(t.id, t);
	if(t instanceof T.Con) return t;
	if(t instanceof T.App) return T.app(T.substitute(sub, t.con), T.substitute(sub, t.arg));
	if(t instanceof T.Implicit) return T.im(T.substitute(sub, t.type), T.substitute(sub, t.ret));
	if(t instanceof T.Record)
		return T.mergeRecord(T.record(T.substitute(sub, t.map), t.rest && T.substitute(sub, t.rest)));
	if(t instanceof T.Scheme) {
		var nsub = sub.filter(function(_, id) {return !t.bound.has(id)});
		return T.scheme(t.bound, T.substitute(nsub, t.type));
	}
	if(t instanceof Map) return t.map(function(v) {return T.substitute(sub, v)});
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
	if(t instanceof T.Record) return K.star;
	if(t instanceof T.Implicit) return t.kind;
	if(t instanceof T.Scheme) return t.type.kind;
	terr('cannot get kind of ' + t); 
};

T.zip = function(a, b) {
	for(var r = [], i = 0, l = Math.min(a.length, b.length); i < l; i++)
		r.push([a[i], b[i]]);
	return r;
};

T.unify = function(a, b, env) {
	console.log('unify ' + a + ' ; ' + b);
	if(a instanceof T.Var) {
		if(a === b) return Map.empty;
		if(T.occursIn(a, b)) terr('recursive unification: ' + a + ' and ' + b);
		var ka = a.kind, kb = T.kind(b);
		if(!K.eq(ka, kb))
			terr('unification failed for ' + a + ' and ' + b + ', unmatched kinds ' + ka + ' and ' + kb);
		return Map.of(a.id, b);
	}
	if(b instanceof T.Var) return T.unify(b, a, env);
	if(a instanceof T.Con && b instanceof T.Con && a.name === b.name && K.eq(a.kind, b.kind))
		return Map.empty;
	if(a instanceof T.App && b instanceof T.App) {
		var sub = T.unify(a.con, b.con, env);
		return sub.union(T.unify(T.substitute(sub, a.arg), T.substitute(sub, b.arg), env));
	}
	if(a instanceof T.Record && b instanceof T.Record) {
		var ka = Set.fromArray(a.map.keys());
		var kb = Set.fromArray(b.map.keys());
		if(ka.isSubsetOf(kb)) {
			var keys = ka.toArray();
			var ta = keys.map(function(k) {return a.map.get(k)});
			var tb = keys.map(function(k) {return b.map.get(k)});
			var sub = T.zip(ta, tb).reduce(function(sub, types) {
				return sub.union(T.unify(
					T.substitute(sub, types[0]),
					T.substitute(sub, types[1]),
					env
				));
			}, Map.empty);
			var rest = T.record(kb.difference(ka).toMap(function(k) {return [k, b.map.get(k)]}), b.rest);
			return sub.union(T.unify(T.substitute(sub, a.rest), T.substitute(sub, rest), env));
		}
	}
	terr('unification failed for ' + a + ' and ' + b);
};

// exprs
var E = {};

E.Id = function(id) {this.id = id};
E.Id.prototype.toString = function() {return this.id};
E.id = function(id) {return new E.Id(id)};

E.App = function(fn, arg) {this.fn = fn; this.arg = arg};
E.App.prototype.toString = function() {return '(' + this.fn + ' ' + this.arg + ')'};
E.app = function() {
	if(arguments.length < 2) terr('too few arguments for application');
	return Array.prototype.reduce.call(arguments,
		function(a, b) {return new E.App(a, b)});
};

E.Lam = function(arg, body) {this.arg = arg; this.body = body};
E.Lam.prototype.toString = function() {return '(' + this.arg + ' => ' + this.body + ')'};
E.lam = function() {
	if(arguments.length < 2) terr('too few arguments for lambda');
	return Array.prototype.reduceRight.call(arguments,
		function(a, b) {return new E.Lam(b, a)});
};

E.Let = function(arg, val, body) {this.arg = arg; this.val = val; this.body = body};
E.Let.prototype.toString = function() {return 'let ' + this.arg + ' = ' + this.val + ' in ' + this.body};
E.let = function(a, b, c) {return new E.Let(a, b, c)};

// Algorithm W
E.Result = function(sub, type) {this.sub = sub; this.type = type};
E.Result.prototype.toString = function() {return '' + this.type};
E.Result.prototype.substitute = function() {return new E.Result(this.sub, T.substitute(this.sub, this.type))};
E.result = function(sub, type) {return new E.Result(sub, type)};

E.infer = function(expr, env) {
	var env = env || Map.empty;
	console.log('infer ' + expr);
	if(expr instanceof E.Id) {
		if(env.has(expr.id)) {
			var type = env.get(expr.id);
			console.log('type: ' + type);
			var instant = T.instantiate(type);
			console.log('instant: ' + instant);
			if(instant instanceof T.Implicit) {
				var type = instant.type, ret = instant.ret;
				for(var i = 0, ks = env.keys(), l = ks.length; i < l; i++) {
					var k = ks[i], t = env.get(k);
					if(t instanceof T.Scheme) t = t.type;
					console.log('implicit: ' + k + ' ' + t);
					try {
						return E.result(T.unify(type, t, env), ret).substitute();
					} catch(e) {
						console.log('implicit error: ' + e);
					}
				}
				terr('no implicit found for ' + type);
			}
			return E.result(Map.empty, instant);
		}
		terr('unknown symbol ' + expr);
	}
	if(expr instanceof E.App) {
		var sub = Map.empty;
		var o = E.infer(expr.fn, env);
		sub = sub.union(o.sub);
		var k = E.infer(expr.arg, T.substitute(sub, env));
		sub = sub.union(k.sub);
		var t = T.var(K.star);
		var s = T.unify(T.substitute(sub, o.type), T.substitute(sub,T.app(T.Fn, k.type, t)), env);
		sub = sub.union(s);
		return E.result(sub, t).substitute();
	}
	if(expr instanceof E.Lam) {
		var t = T.var(K.star);
		var nenv = env.add(expr.arg, t);
		var o = E.infer(expr.body, nenv);
		var sub = T.substitute(o.sub, o.sub);
		return E.result(sub, T.fn(t, o.type)).substitute();
	}
	if(expr instanceof E.Let) {
		var u = T.var(K.star);
		var tmp = E.infer(expr.val, env.add(expr.arg, u));
		var s1 = tmp.sub, t1 = tmp.type;
		var s2 = T.unify(t1, T.substitute(s1, u), env);
		var s2t1 = T.substitute(s2, t1);
		s1 = s1.union(s2);
		new_env = T.substitute(s1, env);
		var v = T.generalize(new_env, s2t1);
		new_env = new_env.add(expr.arg, v);
		tmp = E.infer(expr.body, new_env);
		var s3 = tmp.sub, t2 = tmp.type;
		s1 = s1.union(s3);
		return E.result(s1, t2).substitute();
	}
	terr('invalid expr type ' + expr);
};

// testing
var fn = T.fn, app = T.app, record = T.record, im = T.im;
var g = function(f) {
	for(var i = 0, r = [], l = f.length; i < l; i++) r.push(T.var(K.star));
	return f.apply(null, r);
};

var Int = T.con('Int', K.star);
var Float = T.con('Float', K.star);
var Bool = T.con('Bool', K.star);
var Str = T.con('Str', K.star);
var List = T.con('List', K.fn(K.star, K.star));
var Maybe = T.con('Maybe', K.fn(K.star, K.star));
var Show = T.con('Show', K.fn(K.star, K.star));

var Monoid = T.con('Monoid', K.fn(K.star, K.star));

var f = T.var(K.fn(K.star, K.star), 'f');
var env = new Map({
	Monoid: g(function(t) {return fn(fn(t, t, t), t, T.app(Monoid, t))}),
	
	add: fn(Int, Int, Int),
	zero: Int,

	append: g(function(t) {return im(T.app(Monoid, t), fn(t, t, t))}),
	unit: g(function(t) {return im(T.app(Monoid, t), t)}),

	StrMonoid: T.app(Monoid, Str),
}); 

var call = E.app, i = E.id, lam = E.lam, let = E.let;
var exprs = [
	let('m', call(i('Monoid'), i('add'), i('zero')), call(i('append'), i('zero'))),
];

exprs.forEach(function(e) {
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


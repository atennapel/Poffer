// HM
// @author: Albert ten Napel
// @todo: test instantiation and typeclasses

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

// env
var KV = function(key, val) {this.key = key; this.val = val};
var Env = function(a) {this.arr = a};
Env.prototype.toString = function() {
	return 'Env {' + this.arr.map(function(kv) {return kv.key + ': ' + kv.val}).join(', ') + '}';
};
Env.prototype.has = function(k) {
	for(var a = this.arr, i = a.length - 1; i >= 0; i--) {
		var kv = a[i];
		if(kv.key === k) return true;
	}
	return false;
};
Env.prototype.get = function(k) {
	for(var a = this.arr, i = a.length - 1; i >= 0; i--) {
		var kv = a[i];
		if(kv.key === k) return kv.val;
	}
	return null;
};
Env.prototype.add = function(k, v) {
	var n = this.arr.slice();
	n.push(new KV(k, v));
	return new Env(n);
};
Env.prototype.keys = function() {
	return this.arr.map(function(kv) {return kv.key}).reverse();
};
Env.prototype.vals = function() {
	return this.arr.map(function(kv) {return kv.val}).reverse();
};
Env.prototype.map = function(f) {
	return new Env(this.arr.map(function(kv) {return new KV(kv.key, f(kv.val, kv.key))}));
};

Env.empty = new Env([]);
Env.fromArray = function(a) {
	for(var i = 0, l = a.length, r = []; i < l; i += 2)
		r.push(new KV(a[i], a[i+1]));
	return new Env(r);
};
Env.of = function() {return Env.fromArray(arguments)};

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

T.Var = function(id, kind, constraints) {
	this.id = id;
	this.kind = kind;
	this.constraints = constraints || Set.empty;
};
T.Var.prototype.toString = function() {
	var a = this.constraints.toArray();
	return (a.length? '(' + a.join(', ') + " => '": "'") + this.id /*+ ' :: ' + this.kind*/ + (a.length? ')': '');
};
T.Var.id = 0;
T.var = function(kind, constraints) {return new T.Var(T.Var.id++, kind, constraints)};

T.Con = function(name, kind) {this.name = name; this.kind = kind};
T.Con.prototype.toString = function() {return /*'(' +*/ this.name /*+ ' :: ' + this.kind + ')'*/};
T.con = function(name, kind) {return new T.Con(name, kind)};

T.App = function(con, arg) {
	var ckind = T.kind(con), akind = T.kind(arg);
	if(ckind instanceof K.Star) terr('cannot apply ' + con + ', invalid kind ' + ckind);
	if(!K.eq(ckind.a, akind)) terr('kind mismatch, expected ' + ckind.a + ' but got ' + akind);
	this.con = con; this.arg = arg; this.kind = ckind.b;
};
T.App.prototype.toString = function() {
	var con = this.con, arg = this.arg;
	if(con instanceof T.App && con.con === T.Fn)
		return '(' + con.arg + ' -> ' + arg + ')';
	if(con === T.Fn)
		return '(-> ' + arg + ')';
	return '(' + con + ' ' + arg /*+ ' :: ' + this.kind*/ + ')';
};
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

T.Fn = T.con('->', K.fn(K.star, K.star, K.star));
T.fn = function() {
	if(arguments.length === 0) return T.Fn;
	if(arguments.length === 1) return T.app(T.Fn, arguments[0]);
	return Array.prototype.reduceRight.call(arguments, function(a, b) {
		return T.app(T.Fn, b, a);
	});
};

T.Scheme = function(bound, type) {this.bound = bound; this.type = type};
T.Scheme.prototype.toString = function() {return '\\' + this.bound + ' ' + this.type};
T.scheme = function(bound, type) {return new T.Scheme(bound, type)};

T.free = function(type) {
	if(type instanceof T.Var) return Set.of(type.id);
	if(type instanceof T.Con) return Set.empty;
	if(type instanceof T.App) return T.free(type.con).union(T.free(type.arg));
	if(type instanceof T.Record) return type.rest? T.free(type.rest).union(T.free(type.map)): T.free(type.map);
	if(type instanceof T.Scheme) return T.free(type.type).difference(type.bound);
	if(type instanceof Map) return Set.flatten(type.vals().map(T.free));
	if(type instanceof Env) return Set.flatten(type.vals().map(T.free));
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
	if(t instanceof T.Record)
		return T.mergeRecord(T.record(T.substitute(sub, t.map), t.rest && T.substitute(sub, t.rest)));
	if(t instanceof T.Scheme) {
		var nsub = sub.filter(function(_, id) {return !t.bound.has(id)});
		return T.scheme(t.bound, T.substitute(nsub, t.type));
	}
	if(t instanceof Map) return t.map(function(v) {return T.substitute(sub, v)});
	if(t instanceof Env) return t.map(function(v) {return T.substitute(sub, v)});
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
	if(t instanceof T.Scheme) return t.type.kind;
	terr('cannot get kind of ' + t); 
};

T.zip = function(a, b) {
	for(var r = [], i = 0, l = Math.min(a.length, b.length); i < l; i++)
		r.push([a[i], b[i]]);
	return r;
};

T.Error = function(msg) {this.msg = msg};
T.Error.prototype.toString = function() {return 'TError(' + this.msg + ')'};
T.Error.prototype.error = function() {throw new TypeError(this.msg)};
T.error = function(msg) {return new T.Error(msg)};

T.unifySafe = function(a, b, env, tenv) {
	console.log('unifySafe ' + a + ' ; ' + b);
	//console.log('' + env);
	if(!K.eq(T.kind(a), T.kind(b)))
		return T.error('unification failed for ' + a + ' and ' + b + ', unmatched kinds ' + T.kind(a) + ' and ' + T.kind(b));
	if(a instanceof T.Var) {
		console.log('var');
		if(a === b) return Map.empty;
		if(T.occursIn(a, b)) return T.error('recursive unification: ' + a + ' and ' + b);
		var ka = a.kind, kb = T.kind(b);
		if(!K.eq(ka, kb))
			return T.error('unification failed for ' + a + ' and ' + b + ', unmatched kinds ' + ka + ' and ' + kb);
		if(b instanceof T.Var) {
			var union = a.constraints.union(b.constraints);
			var newvar = T.var(ka, union);
			console.log('constraint union ' + a + ' and ' + b + ' : ' + union);
			return Map.of(a.id, newvar, b.id, newvar);
		}
		var constraints = a.constraints.toArray();
		if(constraints.length === 0) return Map.of(a.id, b);
		console.log('find typeclass instances ' + constraints);
		for(var i = 0, l = constraints.length; i < l; i++) {
			var constraint = constraints[i];
			var members = tenv[constraint];
			var found = false;
			for(var j = 0, k = members.length; j < k; j++) {
				var member = members[j];
				var res = T.unifySafe(member, b, env, tenv);
				if(!(res instanceof T.Error)) {
					found = true;
					break;
				}
			}
			if(!found)
				return T.error('no typeclass instance found for (' + constraint + ' ' + b + ') in unification with ' + a);
		}
		console.log('found typeclass instances');
		return Map.of(a.id, b);
	}
	if(b instanceof T.Var) return T.unifySafe(b, a, env, tenv);
	if(a instanceof T.Con && b instanceof T.Con && a.name === b.name && K.eq(a.kind, b.kind))
		return Map.empty;
	if(a instanceof T.App && b instanceof T.App) {
		//console.log('app');
		var sub = T.unifySafe(a.con, b.con, env, tenv);
		if(sub instanceof T.Error) return sub;
		var subr = T.unifySafe(
			T.substitute(sub, a.arg),
			T.substitute(sub, b.arg),
			T.substitute(sub, env),
			tenv
		);
		if(subr instanceof T.Error) return subr;
		return sub.union(subr);
	}
	if(a instanceof T.Record && b instanceof T.Record) {
		//console.log('record');
		var ka = Set.fromArray(a.map.keys());
		var kb = Set.fromArray(b.map.keys());
		if(ka.isSubsetOf(kb)) {
			var keys = ka.toArray();
			var ta = keys.map(function(k) {return a.map.get(k)});
			var tb = keys.map(function(k) {return b.map.get(k)});
			var sub = T.zip(ta, tb).reduce(function(sub, types) {
				if(sub instanceof T.Error) return sub;
				var nsub = T.unifySafe(
					T.substitute(sub, types[0]),
					T.substitute(sub, types[1]),
					T.substitute(sub, env),
					tenv
				);
				if(nsub instanceof T.Error) return nsub;
				return sub.union(nsub);
			}, Map.empty);
			if(sub instanceof T.Error) return sub;
			var rest = T.record(kb.difference(ka).toMap(function(k) {return [k, b.map.get(k)]}), b.rest);
			var subr = T.unifySafe(
				T.substitute(sub, a.rest),
				T.substitute(sub, rest),
				T.substitute(sub, env),
				tenv
			);
			if(subr instanceof T.Error) return subr;
			return sub.union(subr);
		}
	}
	return T.error('unification failed for ' + a + ' and ' + b);
};

T.unify = function(a, b, env, tenv) {
	var r = T.unifySafe(a, b, env, tenv);
	if(r instanceof T.Error) r.error();
	return r;
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
E.Lam.prototype.toString = function() {return '(\\' + this.arg + ' -> ' + this.body + ')'};
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

E.infer = function(expr, env, tenv) {
	var env = env || Env.empty;
	var tenv = tenv || {};
	//console.log('infer ' + expr, tenv);
	if(expr instanceof E.Id) {
		if(env.has(expr.id)) return E.result(Map.empty, T.instantiate(env.get(expr.id)));
		terr('unknown symbol ' + expr);
	}
	if(expr instanceof E.App) {
		var sub = Map.empty;
		var o = E.infer(expr.fn, env, tenv);
		sub = sub.union(o.sub);
		var nenv = T.substitute(sub, env);
		var k = E.infer(expr.arg, nenv, tenv);
		sub = sub.union(k.sub);
		var t = T.var(K.star);
		nenv = T.substitute(sub, env);
		var fnt = T.substitute(sub, o.type);
		var s = T.unify(fnt, T.substitute(sub,T.app(T.Fn, k.type, t)), nenv, tenv);
		sub = sub.union(s);
		return E.result(sub, t).substitute();
	}
	if(expr instanceof E.Lam) {
		var t = T.var(K.star);
		var nenv = env.add(expr.arg, t);
		var o = E.infer(expr.body, nenv, tenv);
		var sub = T.substitute(o.sub, o.sub);
		return E.result(sub, T.fn(t, o.type)).substitute();
	}
	if(expr instanceof E.Let) {
		var u = T.var(K.star);
		var tmp = E.infer(expr.val, env.add(expr.arg, u), tenv);
		var s1 = tmp.sub, t1 = tmp.type;
		var nenv = T.substitute(s1, env);
		var s2 = T.unify(t1, T.substitute(s1, u), nenv, tenv);
		var s2t1 = T.substitute(s2, t1);
		s1 = s1.union(s2);
		new_env = T.substitute(s1, env);
		var v = T.generalize(new_env, s2t1);
		new_env = new_env.add(expr.arg, v);
		tmp = E.infer(expr.body, new_env, tenv);
		var s3 = tmp.sub, t2 = tmp.type;
		s1 = s1.union(s3);
		return E.result(s1, t2).substitute();
	}
	terr('invalid expr type ' + expr);
};

E.inferAll = function(e, env, tenv) {
	var prev = E.infer(e, env, tenv);
	var cur = prev.substitute();
	while(''+prev !== ''+cur) {
		prev = cur;
		cur = prev.substitute();
	}
	return cur;
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
var Val = T.con('Val', K.fn(K.star, K.star));

var Pair = T.con('Pair', K.fn(K.star, K.star, K.star));

var Monoid = T.con('Monoid', K.fn(K.star, K.star));

var s = T.var(K.star, Set.of('Show'));
var i = T.var(K.star, Set.of('Int'));
var f = T.var(K.fn(K.star, K.star));
var n = T.var(K.star, Set.of('Add'));
var tenv = {
	Show: [Int],
	Int: [Int],
	Add: [Int]
};
var env = Env.fromArray([
	//'Monoid', g(function(t) {return fn(fn(t, t, t), t, T.app(Monoid, t))}),
	
	'add', fn(n, n, T.var(K.star)),
	'zero', Int,
	's', Str,
	'b', Bool,

	//'append', g(function(t) {return im(T.app(Monoid, t), fn(t, t, t))}),
	//'unit', g(function(t) {return im(T.app(Monoid, t), t)}),

	//'StrMonoid', T.app(Monoid, Str),
	//'BoolMonoid', T.app(Monoid, Bool),

	//'nv', T.app(Val, Int),
	//'sv', T.app(Val, Str),
	//'bv', T.app(Val, Bool),

	//'val', g(function(t) {return im(T.app(Val, t), t)}),

	'Show', g(function(t) {return fn(fn(t, Str), T.app(Show, t))}),
	'show', fn(s, Str),
	'int', fn(i, Int),

	'parseInt', fn(Str, Int),

	'pair', g(function(a, b) {return fn(a, b, T.app(Pair, a, b))}),
]);

var call = E.app, i = E.id, lam = E.lam, let = E.let;
var exprs = [
	//i('Show'),
	//lam('x', call(i('pair'), call(i('show'), i('x')), call(i('int'), i('x'))))
	i('add'),
	lam('n', call(i('show'), call(i('add'), i('n'), i('n'))))
];

exprs.forEach(function(e) {
	console.log('' + e);
	try {
		var res = E.inferAll(e, env, tenv);
		console.log('' + res.type);
		console.log('' + res.sub);
	} catch(err) {
		console.log('' + err);
	}
	console.log();
});


/**
 * Poffer v0.0.1
 * point-free programming
 * @author Albert ten Napel
 * 
 * TODO
 * 	strings
 * 	map literals
 * 	operators: ?
 * 	think about ,
 * 	comments
 */
var show = function(x) {return Array.isArray(x)? '[' + x.map(show).join(', ') + ']': '' + x};
var meth = function(m) {return function(x) {return x[m]()}};
var err = function(m) {throw new Error(m)};

var PAPP = {toString: function() {return '/'}};
var RPAPP = {toString: function() {return '\\'}};
var PAPPL = {toString: function() {return '//'}};
var RPAPPL = {toString: function() {return '\\\\'}};
var TO = {toString: function() {return '..'}};
var UNTIL = {toString: function() {return '...'}};
var COMMA = {toString: function() {return ','}};
var EXTEND = {toString: function() {return '@'}};
var ASSIGNMENT = {toString: function() {return ':'}};
var COND = {toString: function() {return '?'}};
var NEG = {toString: function() {return '-'}};
var parse = function(s) {
	var START = 0, NAME = 1, NUMBER = 2;
	var state = START, p = [], r = [], t = [], b = [];
	for(var i = 0, l = s.length; i <= l; i++) {
		var c = s[i] || '';
		// console.log('<' + i + ' ' + c + ' ' + show(r) + ' ' + show(p));
		if(state === START) {
			if(c === '.' && s[i+1] === '.' && s[i+2] === '.') r.push(UNTIL), i += 2;
			else if(c === '.' && s[i+1] === '.') r.push(TO), i++;
			else if(c === '/' && s[i+1] === '/') r.push(PAPPL), i++;
			else if(c === '\\' && s[i+1] === '\\') r.push(RPAPPL), i++;
			else if(c === ',') r.push(COMMA);
			else if(c === '-') r.push(NEG);
			else if(c === ':') r.push(ASSIGNMENT);
			else if(c === '@') r.push(EXTEND);
			else if(c === '?') r.push(COND);
			else if(c === '/') r.push(PAPP);
			else if(c === '\\') r.push(RPAPP);
			else if(c === '(' || c === '[' || c === '{') b.push(c), p.push(r), r = [];
			else if(/[a-z]/i.test(c)) t.push(c), state = NAME;
			else if(/[0-9]/.test(c)) t.push(c), state = NUMBER;
			else if(c === ')' || c === ']' || c === '}') {
				if(!b.length) err('unmatched bracket: ' + c);
				var br = b.pop();
				if((c === ')' && br !== '(') ||
					 (c === ']' && br !== '[') ||
					 (c === '}' && br !== '{')) err('unmatched bracket: ' + br + ' and ' + c);
				var a = handleOps(r); r = p.pop();
				if(c === ')') r.push(new Expr.Group(a));
				else if(c === ']') r.push(new Expr.Composition(a));
				else if(c === '}') r.push(new Expr.Fork(a));
			}
		} else if(state === NAME) {
			if(!/[a-z0-9]/i.test(c))
				r.push(new Expr.Name(t.join(''))), t = [], i--, state = START;
			else t.push(c);
		} else if(state === NUMBER) {
			if(!/[0-9]/.test(c))
				r.push(new Expr.Number(t.join(''))), t = [], i--, state = START;
			else t.push(c);
		}
		// console.log('>' + i + ' ' + c + ' ' + show(r) + ' ' + show(p));
	}
	if(b.length) err('unmatched brackets: ' + b.join(' '));
	return new Expr.Group(handleOps(r));
};

var handleOps = function(a) {
	var r = [], op = null;
	for(var i = 0, l = a.length; i < l; i++) {
		var c = a[i];
		if(!(c instanceof Expr.Expr)) {
			if(op) err('invalid operator position: ' + c);
			op = c;
		} else if(op) {
			if(!r[r.length - 1] && (op === PAPP || op === RPAPP || op === TO || op === UNTIL || op === COMMA || op === ASSIGNMENT))
				err('operator without left argument: ' + op);
			if(op === PAPP) r.push(new Expr.PApp(r.pop(), c));
			else if(op === RPAPP) r.push(new Expr.PApp(r.pop(), c, true));
			else if(op === PAPPL) r.push(new Expr.PAppL(c));
			else if(op === RPAPPL) r.push(new Expr.PAppL(c, true));
			else if(op === NEG) r.push(new Expr.Call(new Expr.Name('neg'), [c]));
			else if(op === TO) r.push(new Expr.Call(new Expr.Name('to'), [r.pop(), c]));
			else if(op === UNTIL) r.push(new Expr.Call(new Expr.Name('until'), [r.pop(), c]));
			else if(op === COMMA) r.push(new Expr.Array([r.pop(), c]));
			else if(op === ASSIGNMENT) {
				var rest = a.slice(i + 1);
				if(rest.length < 1) err('assignment without body');
				r.push(new Expr.Let(r.pop(), c, new Expr.Group(handleOps(rest))));
				op = null;
				break;
			} else if(op === EXTEND) {
				if(!(c instanceof Expr.Composition)) err('cannot prefix ' + c + ' with @');
				r.push(new Expr.Array(c.val));
			} else if(op === COND) {
				if(!(c instanceof Expr.Fork)) err('cannot prefix ' + c + ' with ?');
				r.push(new Expr.Cond(c.val));
			} else err('invalid operator: ' + op);
			op = null;
		} else r.push(c);
	}
	if(op) err('operator without right argument: ' + op);
	return r;
};

///
var litc = function(x) {return x.isLiteral()? new Expr.Call(new Expr.Name('constant'), [x]): x};

var Expr = {};
Expr.Expr = function() {};
Expr.Expr.prototype.optimize = function() {return this};
Expr.Expr.prototype.toJS = function() {err('cannot compile to js: ' + this)};
Expr.Expr.prototype.isLiteral = function() {return false};

Expr.Name = function(name) {this.val = name};
Expr.Name.prototype = Object.create(Expr.Expr.prototype);
Expr.Name.prototype.toString = function() {return this.val}; 
Expr.Name.prototype.toJS = function() {return this.val}; 

Expr.Number = function(name) {this.val = name};
Expr.Number.prototype = Object.create(Expr.Expr.prototype);
Expr.Number.prototype.toString = function() {return this.val}; 
Expr.Number.prototype.toJS = function() {return this.val};
Expr.Number.prototype.isLiteral = function() {return true}; 

Expr.PApp = function(a, b, rev) {this.a = a; this.b = b; this.rev = rev || false};
Expr.PApp.prototype = Object.create(Expr.Expr.prototype);
Expr.PApp.prototype.toString = function() {return '('+ this.a + (this.rev? '\\': '/') + this.b + ')'}; 
Expr.PApp.prototype.optimize = function() {
	return this.rev?
		new Expr.Call(new Expr.Name('rpapp'), [this.a.optimize(), this.b.optimize()]):
		new Expr.Call(new Expr.Name('papp'), [this.a.optimize(), this.b.optimize()]);
};

Expr.PAppL = function(fn, rev) {this.fn = fn; this.rev = rev || false};
Expr.PAppL.prototype = Object.create(Expr.Expr.prototype);
Expr.PAppL.prototype.toString = function() {return (this.rev? '\\\\': '//') + this.fn}; 
Expr.PAppL.prototype.optimize = function() {
	return this.rev?
		new Expr.Call(new Expr.Name('rpappl'), [this.fn.optimize()]):
		new Expr.Call(new Expr.Name('pappl'), [this.fn.optimize()]);
};

Expr.Call = function(fn, args) {this.fn = fn; this.args = args};
Expr.Call.prototype = Object.create(Expr.Expr.prototype);
Expr.Call.prototype.toString = function() {
	return (this.fn instanceof Expr.Name? this.fn: '(' + this.fn + ')') + '('+ this.args.join(', ') + ')';
};
Expr.Call.prototype.optimize = function() {
	return new Expr.Call(this.fn.optimize(), this.args.map(meth('optimize')));
}; 
Expr.Call.prototype.toJS = function() {
	return (this.fn instanceof Expr.Name? this.fn.toJS(): '(' + this.fn.toJS() + ')') +
		'('+ this.args.map(meth('toJS')).join(', ') + ')';
}; 

Expr.Group = function(a) {this.val = a};
Expr.Group.prototype = Object.create(Expr.Expr.prototype);
Expr.Group.prototype.toString = function() {return '(' + this.val.join(' ') + ')'};
Expr.Group.prototype.optimize = function() {
	if(this.val.length === 0) err('empty group: ()');
	if(this.val.length === 1) return this.val[0].optimize();
	return new Expr.Group(this.val.map(meth('optimize')));
};
Expr.Group.prototype.toJS = function() {
	return '(' + this.val.map(meth('toJS')).join(', ') + ')';
};

Expr.Composition = function(a) {this.val = a};
Expr.Composition.prototype = Object.create(Expr.Expr.prototype);
Expr.Composition.prototype.toString = function() {return '[' + this.val.join(' ') + ']'};
Expr.Composition.prototype.optimize = function() {
	if(this.val.length === 0) return new Expr.Name('id');
	if(this.val.length === 1) return new Expr.Call(new Expr.Name('constant'), [this.val[0].optimize()]);
	var comp = new Expr.Name('comp');
	return this.val.map(meth('optimize')).reduce(function(a, b) {
		return new Expr.Call(comp, [litc(a).optimize(), litc(b).optimize()]);
	}).optimize();
};

Expr.Fork = function(a) {this.val = a};
Expr.Fork.prototype = Object.create(Expr.Expr.prototype);
Expr.Fork.prototype.toString = function() {return '{' + this.val.join(' ') + '}'};
Expr.Fork.prototype.optimize = function() {
	if(this.val.length === 0) return new Expr.Name('id');
	if(this.val.length === 1) return new Expr.Fork([new Expr.Name('id'), this.val[0], new Expr.Name('id')]).optimize();
	if(this.val.length % 2 === 0) return new Expr.Fork(this.val.concat([new Expr.Name('id')])).optimize();
	var a = this.val.map(litc).map(meth('optimize')), fork = new Expr.Name('fork');
	var c = new Expr.Call(fork, [a[0], a[1], a[2]]);
	for(var i = 3, l = a.length; i < l; i += 2) c = new Expr.Call(fork, [c, a[i], a[i+1]]);
	return c.optimize();
};

Expr.Cond = function(a) {this.val = a};
Expr.Cond.prototype = Object.create(Expr.Expr.prototype);
Expr.Cond.prototype.toString = function() {return '?{' + this.val.join(' ') + '}'};
Expr.Cond.prototype.optimize = function() {
	if(this.val.length === 0) return new Expr.Name('id');
	if(this.val.length === 1) return this.val[0].optimize();
	if(this.val.length % 2 === 0) return new Expr.Cond(this.val.concat([new Expr.Name('id')])).optimize();
	var a = this.val.map(litc).map(meth('optimize')), cond = new Expr.Name('cond');
	var c = new Expr.Call(cond, [a[a.length-3], a[a.length-2], a[a.length-1]]);
	for(var i = a.length - 4; i >= 0; i -= 2) c = new Expr.Call(cond, [a[i-1], a[i], c]);
	return c.optimize();
};

Expr.Array = function(a) {this.val = a};
Expr.Array.prototype = Object.create(Expr.Expr.prototype);
Expr.Array.prototype.isLiteral = function() {return true};
Expr.Array.prototype.toString = function() {return '(' + this.val.join(', ') + ')'};
Expr.Array.prototype.optimize = function() {
	return new Expr.Array(this.val.map(meth('optimize')));
};
Expr.Array.prototype.toJS = function() {
	return '[' + this.val.map(meth('toJS')).join(', ') + ']';
};

Expr.Let = function(name, arg, body) {this.name = name; this.arg = arg; this.body = body};
Expr.Let.prototype = Object.create(Expr.Expr.prototype);
Expr.Let.prototype.toString = function() {return 'Let ' + this.name + ': ' + this.arg + ' in ' + this.body};
Expr.Let.prototype.optimize = function() {
	return new Expr.Let(this.name, this.arg.optimize(), this.body.optimize());
};
Expr.Let.prototype.toJS = function() {
	return '(function(' + this.name.toJS() + ') {return ' + this.body.toJS() + '})(' + this.arg.toJS() + ')';
};

/// testing

var Seq = {};
Seq.Base = function() {};
Seq.Base.prototype.map = function(f) {return new Seq.Map(this, f)};
Seq.Base.prototype.filter = function(f) {return new Seq.Filter(this, f)};
Seq.Base.prototype.reduce = function(f, v) {
	this.forEach(function(x) {v = f(v, x)});
	return v;
};
Seq.Base.prototype.all = function(f) {
	var r = true;
	this.forEach(function(x) {return r = !f(x)});
	return !r;
};
Seq.Base.prototype.none = function(f) {
	var r = false;
	this.forEach(function(x) {return r = f(x)});
	return r;
};
Seq.Base.prototype.take = function(n) {
	var r = []; if(n < 1) return r;
	n--; this.forEach(function(x, i) {r.push(x); return !n--});
	return new Seq.Array(r);
};
Seq.Base.prototype.len = function() {
	var n = 0;
	this.forEach(function() {n++});
	return n;
};
Seq.Base.prototype.last = function() {
	var last;
	this.forEach(function(x) {last = x});
	return last;
};

Seq.Filter = function(s, f) {this.seq = s; this.fn = f};
Seq.Filter.prototype = Object.create(Seq.Base.prototype);
Seq.Filter.prototype.forEach = function(f) {
	var fn = this.fn;
	this.seq.forEach(function(x) {if(fn(x)) return f(x)});
};

Seq.Map = function(s, f) {this.seq = s; this.fn = f};
Seq.Map.prototype = Object.create(Seq.Base.prototype);
Seq.Map.prototype.forEach = function(f) {
	var fn = this.fn;
	this.seq.forEach(function(x) {return f(fn(x))});
};

Seq.Range = function(a, b) {this.a = a; this.b = b};
Seq.Range.prototype = Object.create(Seq.Base.prototype);
Seq.Range.prototype.forEach = function(f) {
	for(var i = this.a, j = 0, b = this.b; i <= b; i++, j++) if(f(i, j)) break;
};
Seq.Range.prototype.last = function() {return this.b};
Seq.Range.prototype.toString = function() {return '(' + this.a + '..' + this.b + ')'};

Seq.Array = function(a) {this.a = a};
Seq.Array.prototype = Object.create(Seq.Base.prototype);
Seq.Array.prototype.forEach = function(f) {
	for(var i = 0, a = this.a, l = a.length; i < l; i++) if(f(a[i], i)) break;
};
Seq.Array.prototype.len = function() {return this.a.length};
Seq.Array.prototype.last = function() {var a = this.a; return a[a.length-1]};
Seq.Array.prototype.toString = function() {return show(this.a)};

Seq.LazySeq = function(x, f) {this.start = x; this.fn = f};
Seq.LazySeq.prototype = Object.create(Seq.Base.prototype);
Seq.LazySeq.prototype.forEach = function(f) {
	for(var i = this.start, fn = this.fn, j = 0;; i = fn(i), j++) if(f(i, j)) break;
}; 

var id = function(x) {return x};

var neg = function(x) {return -x};
var sq = function(x) {return x * x};
var sqrt = function(x) {return Math.sqrt(x)};
var abs = function(x) {return Math.abs(x)};
var floor = function(x) {return Math.floor(x)};
var ceil = function(x) {return Math.ceil(x)};
var round = function(x) {return Math.round(x)};
var inc = function(x) {return x + 1};
var dec = function(x) {return x - 1};
var add = function(x, y) {return x + y};
var mul = function(x, y) {return x * y};
var sub = function(x, y) {return x - y};
var div = function(x, y) {return x / y};
var idiv = function(x, y) {return Math.floor(x / y)};
var rem = function(x, y) {return x % y};
var mod = function(x, y) {return ((x % y) + y) % y};
var divisible = function(x, y) {return x % y === 0};
var max = function(x, y) {return Math.max(x, y)};
var min = function(x, y) {return Math.min(x, y)};

var eq = function(x, y) {return x === y};
var neq = function(x, y) {return x !== y};
var gt = function(x, y) {return x > y};
var lt = function(x, y) {return x < y};
var geq = function(x, y) {return x >= y};
var leq = function(x, y) {return x <= y};

var and = function(x, y) {return x && y};
var or = function(x, y) {return x || y};
var not = function(x) {return !x};

var to = function(x, y) {return typeof y === 'function'? new Seq.LazySeq(x, y): new Seq.Range(x, y)};
var until = function(x, y) {return new Seq.Range(x, y - 1)};

var each = function(f) {return a.forEach(f)};
var filter = function(f, a) {return a.filter(f)};
var len = function(a) {return a.len()};
var count = function(f, a) {return a.reduce(function(x) {return f(x)? x + 1: x}, 0)};
var none = function(f, a) {return a.none(f)};
var all = function(f, a) {return a.all(f)};
var map = function(f, a) {return a.map(f)};
var fold = foldL = function(f, v, a) {return a.reduce(f, v)};
//var foldR = function(f, v, a) {return a.reduceRight(f, v)};
var reduce = function(f, a) {return a.reduce(f)};
//var reduceR = function(f, a) {return a.reduceRight(f)};
//var reverse = function(a) {return a.slice().reverse()};
//var sort = function(a) {return a.sort(sub)};
var sum = function(a) {return a.reduce(add, 0)};
var product = function(a) {return a.reduce(mul, 1)};
var maxl = function(a) {return a.reduce(max, -Number.MAX_VALUE)};
var minl = function(a) {return a.reduce(min, Number.MAX_VALUE)};
var take = function(n, a) {return a.take(n)};
var last = function(a) {return a.last()};

var constant = function(x) {return function(y) {return x}};
var fn = function(x) {return typeof x === 'function'? x: constant(x)};
var papp = function(f, x) {return function() {return f.apply(this, [x].concat(Array.prototype.slice.call(arguments)))}};
var rpapp = function(f, x) {return function(y) {return f.apply(this, [y, x].concat(Array.prototype.slice.call(arguments, 1)))}};
var pappl = function(f) {return function(x) {return papp(f, x)}};
var rpappl = function(f) {return function(x) {return rpapp(f, x)}};
var comp = function(f, g) {return function() {return fn(g)(fn(f).apply(this, arguments))}};
var fork = function(a, b, c) {return function() {return fn(b)(fn(a).apply(this, arguments), fn(c).apply(this, arguments))}};
var cond = function(a, b, c) {return function() {return fn(a).apply(this, arguments)? fn(b).apply(this, arguments): fn(c).apply(this, arguments)}};
var app = function(f, a) {return f.apply(this, a)};

///

var s = '[@[1 -2 3 -4 5] map/(?{lt\\0 neg})]'
console.log('' + s);
var p = parse(s);
console.log('' + p);
var o = p.optimize();
console.log('' + o);
var j = o.toJS();
console.log('' + j);
var t = Date.now();
console.log('' + show(eval(j)()));
console.log((Date.now() - t) + 'ms');
// 600000 -> 3742ms

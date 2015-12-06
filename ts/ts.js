// util
var terr = function(msg) {throw new TypeError(msg)};

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

T.Var = function(id, kind) {this.id = id; this.kind = kind};
T.Var.prototype.toString = function() {return "'" + this.id /*+ ' :: ' + this.kind*/};
T.Var.id = 0;
T.var = function(kind) {return new T.Var(T.Var.id++, kind)};

T.Con = function(name, kind) {this.name = name; this.kind = kind};
T.Con.prototype.toString = function() {return /*'(' +*/ this.name /*+ ' :: ' + this.kind + ')'*/};
T.con = function(name, kind) {return new T.Con(name, kind)};

T.App = function(con, arg) {
	var ckind = con.kind, akind = arg.kind;
	if(ckind instanceof K.Star) terr('cannot apply ' + con);
	if(!K.eq(ckind.a, akind)) terr('kind mismatch, expected ' + ckind.a + ' but got ' + akind);
	this.con = con; this.arg = arg; this.kind = ckind.b;
};
T.App.prototype.toString = function() {return '(' + this.con + ' ' + this.arg /*+ ' :: ' + this.kind*/ + ')'};
T.app = function() {
	if(arguments.length < 2) terr('too few arguments for type application');
	return Array.prototype.reduce.call(arguments, function(a, b) {return new T.App(a, b)});
};

T.Int = T.con('Int', K.star);
T.Float = T.con('Float', K.star);
T.Bool = T.con('Bool', K.star);
T.Str = T.con('Str', K.star);
T.List = T.con('List', K.fn(K.star, K.star));
T.Fn = T.con('Fn', K.fn(K.star, K.star, K.star));

// exprs
var E = {};

E.Id = function(id) {this.id = id};
E.Id.prototype.toString = function() {return this.id};
E.id = function(id) {return new E.Id(id)};

E.App = function(fn, arg) {this.fn = fn; this.arg = arg};
E.App.prototype.toString = function() {return '(' + this.fn + ' ' + this.arg + ')'};
E.app = function() {
	if(arguments.length < 2) terr('too few arguments for application');
	return Array.prototype.reduce.call(arguments, function(a, b) {return new E.App(a, b)});
};

// testing
var t = T.var(K.star);
console.log('' + T.app(T.Fn, T.app(T.List, t), t));


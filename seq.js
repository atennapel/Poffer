var add = function(x) {return function(y) {return x + y}};
var mul = function(x) {return function(y) {return x * y}};
var eq = function(x) {return function(y) {return x === y}};

var REMOVE = {};
var DONE = function(val) {this.val = val};

var ArrayIterator = function(a) {this.a = a; this.i = 0};
ArrayIterator.prototype.next = function() {
	var a = this.a, l = a.length, i = this.i;
	if(i >= l) return {done: true};
	return {val: a[this.i++], done: false};
};

Array.prototype.iterator = function() {return new ArrayIterator(this)};
Array.prototype.cat = function(x) {this.push(x); return this};
Array.prototype.empty = function(x) {return []};
String.prototype.iterator = function() {return new ArrayIterator(this)};
String.prototype.cat = function(x) {return this + x};
String.prototype.empty = function(x) {return ''};

var Seq = function() {};
Seq.prototype.seq = function(a) {
	var iter = a.iterator(), cur;
	var r = a.empty();
	while(!(cur = iter.next()).done) {
		var v = this.call(cur.val);
		if(v !== REMOVE) r = r.cat(v);
	}
	return r;
};

var Map = function(f, a) {this.fn = f; this.a = a};
Map.prototype = Object.create(Operation.prototype);
Map.prototype.call = function(x) {return this.fn(x)};
var map = function(f) {return new Map(f)};

var Filter = function(f, a) {this.fn = f; this.a = a};
Filter.prototype = Object.create(Operation.prototype);
Filter.prototype.call = function(x) {return this.fn(x)? x: REMOVE};
var filter = function(f) {return new Filter(f)};

console.log(map(add(1)).seq([1, 2, 3]));

/**
 * Poffer
 * point-free programming
 * @author Albert ten Napel
 */
var version = '0.0.1';

var show = function(x) {return Array.isArray(x)? '[' + x.map(show).join(', ') + ']': '' + x};
var meth = function(m) {return function(x) {return x[m]()}};
var err = function(m) {throw new Error(m)};

var parse = function(s) {
	var START = 0, NAME = 1, NUMBER = 2, COMMENT = 3, STRING = 4, BLOCKCOMMENT = 5;
	var state = START, p = [], r = [], t = [], b = [], esc = false;
	for(var i = 0, l = s.length; i <= l; i++) {
		var c = s[i] || '\n';
		// console.log('<' + i + ' ' + c + ' ' + show(r) + ' ' + show(p));
		if(state === START) {
			if(c === ';' && s[i+1] === ';' && s[i+2] === ';') state = BLOCKCOMMENT, i += 2;
			else if(c === ';' && s[i+1] === ';') state = COMMENT, i++;
			else if(c === '"') state = STRING;
			else if(c === '(' || c === '[' || c === '{') b.push(c), p.push(r), r = [];
			else if(/[a-z]/i.test(c)) t.push(c), state = NAME;
			else if(/[0-9]/.test(c)) t.push(c), state = NUMBER;
			else if(c === ')' || c === ']' || c === '}') {
				if(!b.length) err('unmatched bracket: ' + c);
				var br = b.pop();
				if((c === ')' && br !== '(') ||
					 (c === ']' && br !== '[') ||
					 (c === '}' && br !== '{')) err('unmatched bracket: ' + br + ' and ' + c);
				var a = r; r = p.pop();
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
		} else if(state === COMMENT) {
			if(c === '\n' || c === '\r') state = START;
		} else if(state === BLOCKCOMMENT) {
			if(c === ';' && s[i+1] === ';' && s[i+2] === ';') state = START, i += 2;
		} else if(state === STRING) {
			if(esc) t.push(c), esc = false;
			else if(c === '\\') t.push(c), esc = true;
			else if(c === '"') r.push(new Expr.String(t.join(''))), t = [], state = START;
			else t.push(c);
		}
		// console.log('>' + i + ' ' + c + ' ' + show(r) + ' ' + show(p));
	}
	if(b.length) err('unmatched brackets: ' + b.join(' '));
	if(state !== START) err('parser error');
	return new Program(r);
};

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

Expr.String = function(str) {this.val = str};
Expr.String.prototype = Object.create(Expr.Expr.prototype);
Expr.String.prototype.toString = function() {return '"' + this.val + '"'};
Expr.String.prototype.toJS = function() {return '"' + this.val + '"'};
Expr.String.prototype.isLiteral = function() {return true}; 

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
		this.args.map(meth('toJS')).map(function(x) {return '(' + x + ')'}).join('');
}; 

Expr.Group = function(a) {this.val = a};
Expr.Group.prototype = Object.create(Expr.Expr.prototype);
Expr.Group.prototype.toString = function() {return '(' + this.val.join(' ') + ')'};
Expr.Group.prototype.optimize = function() {
	if(this.val.length === 0) return new Expr.Name('null');
	if(this.val.length === 1) return this.val[0].optimize();
	return new Expr.Call(this.val[0], this.val.slice(1)).optimize();
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
Expr.Array.prototype.toString = function() {return '@[' + this.val.join(' ') + ']'};
Expr.Array.prototype.optimize = function() {
	return new Expr.Array(this.val.map(meth('optimize')));
};
Expr.Array.prototype.toJS = function() {
	return '[' + this.val.map(meth('toJS')).join(', ') + ']';
};

Expr.Map = function(a) {this.val = a};
Expr.Map.prototype = Object.create(Expr.Expr.prototype);
Expr.Map.prototype.isLiteral = function() {return true};
Expr.Map.prototype.toString = function() {return '@{' + this.val.join(' ') + '}'};
Expr.Map.prototype.optimize = function() {
	return new Expr.Map(this.val.map(meth('optimize')));
};
Expr.Map.prototype.toJS = function() {
	if(this.val.length % 2) err('invalid map, missing value: ' + this);
	for(var i = 0, r = [], a = this.val, l = a.length; i < l; i += 2)
		r.push(a[i].toJS() + ': ' + a[i+1].toJS());
	return '({' + r.join(', ') + '})';
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

var Program = function(a) {
	var b = a.slice();
	if(b.length % 2)
		b.splice(b.length - 1, 0, new Expr.Name('main'));
	this.defs = b;
};
Program.prototype.toString = function() {return 'Program(' + this.defs.join(' ') + ')'};
Program.prototype.toJS = function() {
	var names = [], defsjs = [], foundmain = false;
	for(var i = 0, a = this.defs.map(meth('optimize')), l = a.length; i < l; i += 2) {
		var name = a[i], def = a[i+1];
		if(!(name instanceof Expr.Name)) err('definition must be a name');
		if(name.val === 'main') foundmain = true;
		names.push(name.toJS());
		defsjs.push(name.toJS() + ' = ' + def.toJS());
	}
	if(!foundmain) err('no main function found');
	return '(function() {var ' +
		names.join(', ') + '; ' +
		defsjs.join(';') + '; return ' +
		(new Expr.Call(new Expr.Name('main'), [new Expr.Name('null')])).toJS() +
	'})()';
};

///
var id = function(x) {return x};
var cons = function(x) {return function(y) {return x}};

var add = function(x) {return function(y) {return x + y}};
var mul = function(x) {return function(y) {return x * y}};
///

var scr = '(cons (add 1 (mul 2 3)))';
console.log(parse(scr).toJS());
console.log(eval(parse(scr).toJS()));

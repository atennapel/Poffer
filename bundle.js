(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
exports.extend = (env, name, type) => {
    const nenv = Object.create(env);
    nenv[name] = type;
    return nenv;
};
exports.freeEnv = (env, free = {}) => {
    let fr = free;
    for (let k in env)
        fr = types_1.freeForall(env[k], fr);
    return fr;
};

},{"./types":9}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let id = 0;
exports.nextId = () => id++;
exports.namePart = (name) => name.split('$')[0];
exports.fresh = (name = '_') => `${exports.namePart(name)}$${exports.nextId()}`;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exprs_1 = require("./exprs");
const $ = exprs_1.Var;
exports.combinators = {
    A: exprs_1.abs(['f', 'x'], exprs_1.apps($('f'), $('x'))),
    B: exprs_1.abs(['f', 'g', 'x'], exprs_1.apps($('f'), exprs_1.apps($('g'), $('x')))),
    C: exprs_1.abs(['f', 'x', 'y'], exprs_1.apps($('f'), $('y'), $('x'))),
    D: exprs_1.abs(['f', 'g', 'x', 'y'], exprs_1.apps($('f'), exprs_1.apps($('g'), $('x'), $('y')))),
    E: exprs_1.abs(['f', 'g', 'x', 'y', 'z'], exprs_1.apps($('f'), exprs_1.apps($('g'), $('x'), $('y'), $('z')))),
    F: exprs_1.abs(['f', 'g', 'h', 'x'], exprs_1.apps($('f'), exprs_1.apps($('g'), $('x')), exprs_1.apps($('h'), $('x')))),
    G: exprs_1.abs(['f', 'g', 'h', 'x', 'y'], exprs_1.apps($('f'), exprs_1.apps($('g'), $('x'), $('y')), exprs_1.apps($('h'), $('x'), $('y')))),
    I: exprs_1.abs(['x'], $('x')),
    K: exprs_1.abs(['x', 'y'], $('x')),
    L: exprs_1.abs(['x', 'y', 'z'], exprs_1.apps($('x'), exprs_1.apps($('y'), $('z')), $('z'))),
    P: exprs_1.abs(['f', 'g', 'x', 'y'], exprs_1.apps($('f'), exprs_1.apps($('g'), $('x')), exprs_1.apps($('g'), $('y')))),
    R: exprs_1.abs(['x', 'y'], $('y')),
    S: exprs_1.abs(['x', 'y', 'z'], exprs_1.apps($('x'), $('z'), exprs_1.apps($('y'), $('z')))),
    T: exprs_1.abs(['x', 'f'], exprs_1.apps($('f'), $('x'))),
    W: exprs_1.abs(['f', 'x'], exprs_1.apps($('f'), $('x'), $('x'))),
};
/* Combinators
A apply
B compose (fmap)
C flip
D compose2
E compose3
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

},{"./exprs":5}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = (expr) => {
    switch (expr.tag) {
        case 'Var': return expr.name;
        case 'Abs': return `(${expr.arg} => ${exports.compile(expr.body)})`;
        case 'App': return `${exports.compile(expr.left)}(${exports.compile(expr.right)})`;
        case 'Let': return `(${expr.name} => ${exports.compile(expr.body)})(${exports.compile(expr.val)})`;
    }
};
exports.compileDefs = (defs) => {
    const r = [];
    for (let k in defs) {
        r.push(`window['${k}'] = ${exports.compile(defs[k])}`);
    }
    return r.join(';') + ';';
};

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Var = (name) => ({ tag: 'Var', name });
exports.Abs = (arg, body) => ({ tag: 'Abs', arg, body });
exports.abs = (as, body) => as.reduceRight((x, y) => exports.Abs(y, x), body);
exports.App = (left, right) => ({ tag: 'App', left, right });
exports.appFrom = (es) => es.reduce(exports.App);
exports.apps = (...es) => exports.appFrom(es);
exports.Let = (name, val, body) => ({ tag: 'Let', name, val, body });
exports.showExpr = (expr) => {
    switch (expr.tag) {
        case 'Var': return expr.name;
        case 'Abs': return `(\\${expr.arg} -> ${exports.showExpr(expr.body)})`;
        case 'App': return `(${exports.showExpr(expr.left)} ${exports.showExpr(expr.right)})`;
        case 'Let': return `(let ${expr.name} = ${exports.showExpr(expr.val)} in ${exports.showExpr(expr.body)})`;
    }
};

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const Env_1 = require("./Env");
const utils_1 = require("./utils");
exports.isError = (val) => typeof val === 'string';
// unification
const prune = (ty) => {
    switch (ty.tag) {
        case 'TVar': return ty;
        case 'TMeta': return ty.type ? ty.type = prune(ty.type) : ty;
        case 'TFun': return types_1.TFun(prune(ty.left), prune(ty.right));
    }
};
const occurs = (a, ty) => {
    switch (ty.tag) {
        case 'TVar': return false;
        case 'TMeta': return ty.name === a;
        case 'TFun': return occurs(a, ty.left) || occurs(a, ty.right);
    }
};
const bind = (a, b) => {
    if (b.tag === 'TMeta' && a.name === b.name)
        return null;
    if (occurs(a.name, b))
        return `${a.name} occurs in ${types_1.showTy(b)}`;
    a.type = b;
    return null;
};
const unify_ = (a, b) => {
    if (a.tag === 'TMeta')
        return bind(a, b);
    if (b.tag === 'TMeta')
        return bind(b, a);
    if (a.tag === 'TVar' && b.tag === 'TVar' && a.name === b.name)
        return null;
    if (a.tag === 'TFun' && b.tag === 'TFun') {
        const ret = unify_(a.left, b.left);
        if (exports.isError(ret))
            return ret;
        return unify(a.right, b.right);
    }
    return `cannot unify ${types_1.showTy(a)} ~ ${types_1.showTy(b)}`;
};
const unify = (a, b) => unify_(prune(a), prune(b));
// inference
const instantiate = (ty) => {
    const args = ty.args;
    const map = {};
    for (let i = 0; i < args.length; i++)
        map[args[i]] = types_1.freshMeta(args[i]);
    return types_1.substMeta(ty.type, map);
};
const generalize = (env, ty) => {
    const free = Env_1.freeEnv(env);
    const freeT = types_1.freeTy(ty);
    const args = [];
    for (let k in freeT)
        if (!free[k])
            args.push(k);
    return types_1.Forall(args, ty);
};
const infer_ = (env, expr) => {
    switch (expr.tag) {
        case 'Var': return env[expr.name] ? instantiate(env[expr.name]) : `undefined var ${expr.name}`;
        case 'Abs':
            const tm = types_1.freshMeta(expr.arg);
            const ret = infer(Env_1.extend(env, expr.arg, types_1.Forall([], tm)), expr.body);
            if (exports.isError(ret))
                return ret;
            return types_1.TFun(tm, ret);
        case 'App':
            const left = infer_(env, expr.left);
            if (exports.isError(left))
                return left;
            const right = infer_(env, expr.right);
            if (exports.isError(right))
                return right;
            const tmr = types_1.freshMeta();
            const ret1 = unify(left, types_1.TFun(right, tmr));
            if (exports.isError(ret1))
                return ret1;
            return tmr;
        case 'Let':
            const val = infer(env, expr.val);
            if (exports.isError(val))
                return val;
            return infer(Env_1.extend(env, expr.name, generalize(env, val)), expr.body);
    }
};
const infer = (env, expr) => {
    const ret = infer_(env, expr);
    if (exports.isError(ret))
        return ret;
    return prune(ret);
};
exports.inferGen = (env, expr) => {
    const ret = infer(env, expr);
    if (exports.isError(ret))
        return ret;
    return generalize({}, ret);
};
exports.inferDefs = (env_, ds) => {
    let env = utils_1.objClone(env_);
    for (let k in ds) {
        const res = exports.inferGen(env, ds[k]);
        if (typeof res === 'string')
            return res;
        env[k] = res;
    }
    return env;
};

},{"./Env":1,"./types":9,"./utils":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exprs_1 = require("./exprs");
const utils_1 = require("./utils");
function matchingBracket(c) {
    if (c === '(')
        return ')';
    if (c === ')')
        return '(';
    if (c === '{')
        return '}';
    if (c === '}')
        return '{';
    if (c === '[')
        return ']';
    if (c === ']')
        return '[';
    return '';
}
const START = 0;
const NAME = 1;
const NUMBER = 2;
function tokenize(s) {
    let state = START;
    let t = '';
    let r = [], p = [], b = [];
    for (let i = 0; i <= s.length; i++) {
        const c = s[i] || ' ';
        if (state === START) {
            if (/[a-z\:\_]/i.test(c))
                t += c, state = NAME;
            else if (/[0-9]/.test(c))
                t += c, state = NUMBER;
            else if (c === '(' || c === '{' || c === '[')
                b.push(c), p.push(r), r = [];
            else if (c === ')' || c === '}' || c === ']') {
                if (b.length === 0)
                    throw new SyntaxError(`unmatched bracket: ${c}`);
                const br = b.pop();
                if (matchingBracket(br) !== c)
                    throw new SyntaxError(`unmatched bracket: ${br} and ${c}`);
                const a = p.pop();
                a.push({ tag: 'list', val: r, br });
                r = a;
            }
            else if (/\s+/.test(c))
                continue;
            else
                throw new SyntaxError(`invalid char: ${c}`);
        }
        else if (state === NAME) {
            if (!/[a-z0-9\_\!]/i.test(c))
                r.push({ tag: 'name', val: t }), t = '', i--, state = START;
            else
                t += c;
        }
        else if (state === NUMBER) {
            if (!/[0-9]/.test(c))
                r.push({ tag: 'number', val: parseInt(t, 10) }), t = '', i--, state = START;
            else
                t += c;
        }
    }
    if (state !== START)
        throw new SyntaxError(`invalid parsing end state: ${state}`);
    return r;
}
function exprs(r, br = '[') {
    switch (br) {
        case '(': return r.length === 0 ? exprs_1.Var('Unit') : r.length === 1 ? expr(r[0]) : exprs_1.appFrom(r.map(expr));
        case '[': throw SyntaxError('unimplemented [] groups');
        case '{':
            if (r.length === 0)
                return exprs_1.Abs('x', exprs_1.Var('x'));
            if (r.length === 1)
                return exprs_1.Abs('_', expr(r[0]));
            const args = r[0];
            if (args.tag !== 'list' || args.br !== '[' || args.val.length === 0)
                return exprs_1.Abs('_', exprs(r, '('));
            if (utils_1.any(args.val, a => a.tag !== 'name'))
                throw new SyntaxError(`invalid args: ${args.val.join(' ')}`);
            return args.val.reduceRight((b, n) => exprs_1.Abs(n.val, b), exprs(r.slice(1), '('));
    }
}
function expr(r) {
    switch (r.tag) {
        case 'name': return exprs_1.Var(r.val);
        case 'number':
            let c = exprs_1.Var('Zero');
            for (let i = 0; i < r.val; i++)
                c = exprs_1.App(exprs_1.Var('Succ'), c);
            return c;
        case 'list': return exprs(r.val, r.br);
    }
}
function parse(s) {
    return exprs(tokenize(s), '(');
}
exports.default = parse;

},{"./exprs":5,"./utils":10}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const inference_1 = require("./inference");
const compile_1 = require("./compile");
const parser_1 = require("./parser");
const exprs_1 = require("./exprs");
const combinators_1 = require("./combinators");
exports._env = {
    Y: types_1.Forall(['t'], types_1.TFun(types_1.TFun(types_1.TMeta('t'), types_1.TMeta('t')), types_1.TMeta('t'))),
    caseVoid: types_1.Forall(['t'], types_1.TFun(types_1.TVar('Void'), types_1.TMeta('t'))),
    Unit: types_1.Forall([], types_1.TVar('Unit')),
    caseUnit: types_1.Forall(['t'], types_1.TFun(types_1.TMeta('t'), types_1.TFun(types_1.TVar('Unit'), types_1.TMeta('t')))),
    True: types_1.Forall([], types_1.TVar('Bool')),
    False: types_1.Forall([], types_1.TVar('Bool')),
    caseBool: types_1.Forall(['t'], types_1.TFun(types_1.TMeta('t'), types_1.TFun(types_1.TMeta('t'), types_1.TFun(types_1.TVar('Bool'), types_1.TMeta('t'))))),
    Zero: types_1.Forall([], types_1.TVar('Nat')),
    Succ: types_1.Forall([], types_1.TFun(types_1.TVar('Nat'), types_1.TVar('Nat'))),
    caseNat: types_1.Forall(['t'], types_1.TFun(types_1.TMeta('t'), types_1.TFun(types_1.TFun(types_1.TVar('Nat'), types_1.TMeta('t')), types_1.TFun(types_1.TVar('Nat'), types_1.TMeta('t'))))),
};
function _show(x) {
    if (typeof x === 'function')
        return '[Fn]';
    if (x._tag) {
        if (x._tag === 'Zero')
            return '0';
        if (x._tag === 'Succ') {
            let n = 0;
            let c = x;
            while (c._tag === 'Succ') {
                n++;
                c = c.val;
            }
            return `${n}`;
        }
        return x.val ? `(${x._tag} ${_show(x.val)})` : x._tag;
    }
    return '' + x;
}
let _ctx = exports._env;
function _startup(cb) {
    const res = inference_1.inferDefs(_ctx, combinators_1.combinators);
    if (typeof res === 'string')
        return cb(`type error in combinators: ${res}`, true);
    _ctx = res;
    try {
        const c = `(function() {${compile_1.compileDefs(combinators_1.combinators)}})()`;
        eval(c);
        return cb('combinators loaded');
    }
    catch (err) {
        return cb('' + err, true);
    }
}
exports._startup = _startup;
function _run(i, cb) {
    try {
        console.log(i);
        const p = parser_1.default(i);
        console.log(exprs_1.showExpr(p));
        const result = inference_1.inferGen(_ctx, p);
        if (typeof result === 'string')
            throw result;
        else {
            const ty = result;
            console.log(types_1.showForall(ty));
            const c = compile_1.compile(p);
            console.log(c);
            const res = eval(c);
            cb(`${_show(res)} : ${types_1.prettyForall(ty)}`);
        }
    }
    catch (e) {
        console.log(e);
        cb('' + e, true);
    }
}
exports._run = _run;

},{"./combinators":3,"./compile":4,"./exprs":5,"./inference":6,"./parser":7,"./types":9}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Name_1 = require("./Name");
exports.TVar = (name) => ({ tag: 'TVar', name });
exports.TMeta = (name, type) => ({ tag: 'TMeta', name, type: type || null });
exports.freshMeta = (name) => exports.TMeta(Name_1.fresh(name));
exports.TFun = (left, right) => ({ tag: 'TFun', left, right });
exports.flattenTFun = (ty) => {
    const r = [];
    let c = ty;
    while (c.tag === 'TFun') {
        r.push(c.left);
        c = c.right;
    }
    r.push(c);
    return r;
};
exports.showTy = (ty) => {
    switch (ty.tag) {
        case 'TVar': return ty.name;
        case 'TMeta': return `^${ty.name}`;
        case 'TFun': return `(${exports.showTy(ty.left)} -> ${exports.showTy(ty.right)})`;
    }
};
exports.freeTy = (ty, free = {}) => {
    switch (ty.tag) {
        case 'TVar': return free;
        case 'TMeta':
            free[ty.name] = true;
            return free;
        case 'TFun': return exports.freeTy(ty.right, exports.freeTy(ty.left, free));
    }
};
exports.substMeta = (ty, map) => {
    switch (ty.tag) {
        case 'TVar': return ty;
        case 'TMeta': return map[ty.name] || ty;
        case 'TFun': return exports.TFun(exports.substMeta(ty.left, map), exports.substMeta(ty.right, map));
    }
};
exports.prettyTy = (ty) => {
    switch (ty.tag) {
        case 'TVar': return ty.name;
        case 'TMeta': return `^${ty.name}`;
        case 'TFun': return exports.flattenTFun(ty)
            .map(t => t.tag === 'TFun' ? `(${exports.prettyTy(t)})` : exports.prettyTy(t))
            .join(' -> ');
    }
};
exports.Forall = (args, type) => ({ tag: 'Forall', args, type });
exports.showForall = (ty) => ty.args.length === 0 ? exports.showTy(ty.type) : `forall ${ty.args.join(' ')}. ${exports.showTy(ty.type)}`;
exports.freeForall = (ty, free = {}) => {
    const fr = exports.freeTy(ty.type, free);
    for (let i = 0; i < ty.args.length; i++)
        fr[ty.args[i]] = false;
    return fr;
};
exports.simplifyNames = (ns) => {
    const map = {};
    const ret = [];
    for (let i = 0; i < ns.length; i++) {
        let n = Name_1.namePart(ns[i]);
        if (n === '_')
            n = 't';
        if (!map[n]) {
            map[n] = 1;
            ret.push(n);
        }
        else {
            const ind = map[n]++;
            ret.push(`${n}${ind - 1}`);
        }
    }
    return ret;
};
exports.prettyForall = (ty) => {
    const args = ty.args;
    if (args.length === 0)
        return exports.prettyTy(ty.type);
    const sargs = exports.simplifyNames(args);
    const map = {};
    for (let i = 0; i < args.length; i++)
        map[args[i]] = exports.TVar(sargs[i]);
    return `forall ${sargs.join(' ')}. ${exports.prettyTy(exports.substMeta(ty.type, map))}`;
};

},{"./Name":2}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impossible = () => { throw new Error('impossible'); };
exports.assocGet = (arr, val) => {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i][0].equals(val))
            return arr[i][1];
    }
    return null;
};
exports.containsDuplicate = (arr) => {
    const acc = [];
    for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        for (let j = 0; j < acc.length; j++) {
            if (acc[j].equals(c))
                return true;
        }
        acc.push(c);
    }
    return false;
};
exports.any = (arr, fn) => {
    for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        if (fn(c))
            return true;
    }
    return false;
};
exports.all = (arr, fn) => {
    for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        if (!fn(c))
            return false;
    }
    return true;
};
exports.remove = (arr, fn) => {
    const ret = [];
    for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        if (!fn(c))
            ret.push(c);
    }
    return ret;
};
exports.objMap = (map, fn) => {
    const r = {};
    for (let k in map)
        r[k] = fn(map[k], k);
    return r;
};
exports.objMapToArr = (map, fn) => {
    const r = [];
    for (let k in map)
        r.push(fn(map[k], k));
    return r;
};
exports.objClone = (map) => {
    const n = {};
    for (let k in map)
        n[k] = map[k];
    return n;
};

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = require("./repl");
function getOutput(s, cb) {
    repl_1._run(s, cb);
}
var hist = [], index = -1;
var input = document.getElementById('input');
var content = document.getElementById('content');
function onresize() {
    content.style.height = window.innerHeight;
}
window.addEventListener('resize', onresize);
onresize();
repl_1._startup(function (output, err) {
    if (err)
        addResult(output, true);
    else {
        addResult("REPL");
        input.focus();
        input.onkeydown = function (keyEvent) {
            var val = input.value;
            var txt = (val || '').trim();
            if (keyEvent.keyCode === 13) {
                keyEvent.preventDefault();
                if (txt) {
                    hist.push(val);
                    index = hist.length;
                    input.value = '';
                    var div = document.createElement('div');
                    div.innerHTML = val;
                    div.className = 'line input';
                    content.insertBefore(div, input);
                    getOutput(txt, addResult);
                }
            }
            else if (keyEvent.keyCode === 38 && index > 0) {
                keyEvent.preventDefault();
                input.value = hist[--index];
            }
            else if (keyEvent.keyCode === 40 && index < hist.length - 1) {
                keyEvent.preventDefault();
                input.value = hist[++index];
            }
            else if (keyEvent.keyCode === 40 && keyEvent.ctrlKey && index >= hist.length - 1) {
                index = hist.length;
                input.value = '';
            }
        };
    }
});
function addResult(msg, err) {
    var divout = document.createElement('pre');
    divout.className = 'line output';
    if (err)
        divout.className += ' error';
    divout.innerHTML = '' + msg;
    content.insertBefore(divout, input);
    input.focus();
    content.scrollTop = content.scrollHeight;
    return divout;
}

},{"./repl":8}]},{},[11]);

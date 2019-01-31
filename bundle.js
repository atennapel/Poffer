(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exprs_1 = require("./exprs");
const util_1 = require("./util");
exports.compile = (expr) => {
    if (exprs_1.isVar(expr))
        return expr.name;
    if (exprs_1.isApp(expr))
        return `${exports.compile(expr.left)}(${exports.compile(expr.right)})`;
    if (exprs_1.isNatLit(expr))
        return `${expr.val}n`;
    if (exprs_1.isThunk(expr))
        return `(_ => ${exports.compile(expr.expr)})`;
    return util_1.impossible('compile');
};

},{"./exprs":3,"./util":11}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kinds_1 = require("./kinds");
const types_1 = require("./types");
exports.kType = kinds_1.KCon('Type');
exports.kConstraint = kinds_1.KCon('Constraint');
exports.tFun = types_1.TCon('->', kinds_1.KFun(exports.kType, kinds_1.KFun(exports.kType, exports.kType)));
exports.tfun = (...ts) => ts.reduceRight((x, y) => types_1.TApp(types_1.TApp(exports.tFun, y), x));
exports.isTFun = (type) => types_1.isTApp(type) && types_1.isTApp(type.left) && type.left.left === exports.tFun;
exports.tnat = types_1.TCon('Nat', exports.kType);
exports.tunit = types_1.TCon('Unit', exports.kType);
exports.cDup = types_1.TCon('Dup', kinds_1.KFun(exports.kType, exports.kConstraint));
exports.cDrop = types_1.TCon('Drop', kinds_1.KFun(exports.kType, exports.kConstraint));
exports.tv = (id, kind = exports.kType) => types_1.TVar(id, kind);
exports.initialEnv = {
    I: types_1.Qual([], exports.tfun(exports.tv(0), exports.tv(0))),
    B: types_1.Qual([], exports.tfun(exports.tfun(exports.tv(1), exports.tv(2)), exports.tfun(exports.tv(0), exports.tv(1)), exports.tv(0), exports.tv(2))),
    C: types_1.Qual([], exports.tfun(exports.tfun(exports.tv(0), exports.tv(1), exports.tv(2)), exports.tv(1), exports.tv(0), exports.tv(2))),
    K: types_1.Qual([types_1.tapp(exports.cDrop, exports.tv(1))], exports.tfun(exports.tv(0), exports.tv(1), exports.tv(0))),
    W: types_1.Qual([types_1.tapp(exports.cDup, exports.tv(0))], exports.tfun(exports.tfun(exports.tv(0), exports.tv(0), exports.tv(1)), exports.tv(0), exports.tv(1))),
    Y: types_1.Qual([], exports.tfun(exports.tfun(exports.tv(0), exports.tv(0)), exports.tv(0))),
    u: types_1.Qual([], exports.tunit),
    i: types_1.Qual([], exports.tfun(exports.tnat, exports.tnat)),
    j: types_1.Qual([], exports.tfun(exports.tnat, exports.tnat)),
};

},{"./kinds":5,"./types":9}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
exports.Var = (name) => ({ tag: 'Var', name });
exports.isVar = (expr) => expr.tag === 'Var';
exports.App = (left, right) => ({ tag: 'App', left, right });
exports.isApp = (expr) => expr.tag === 'App';
exports.app = (...expr) => expr.reduce(exports.App);
exports.NatLit = (val) => ({ tag: 'NatLit', val });
exports.isNatLit = (expr) => expr.tag === 'NatLit';
exports.Thunk = (expr) => ({ tag: 'Thunk', expr });
exports.isThunk = (expr) => expr.tag === 'Thunk';
exports.showExpr = (expr) => {
    if (exports.isVar(expr))
        return expr.name;
    if (exports.isApp(expr))
        return `(${exports.showExpr(expr.left)} ${exports.showExpr(expr.right)})`;
    if (exports.isNatLit(expr))
        return expr.val;
    if (exports.isThunk(expr))
        return `{${exports.showExpr(expr.expr)}}`;
    return util_1.impossible('showExpr');
};

},{"./util":11}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env");
const types_1 = require("./types");
const exprs_1 = require("./exprs");
const util_1 = require("./util");
const unification_1 = require("./unification");
const solver_1 = require("./solver");
const kinds_1 = require("./kinds");
const inst = (type, map) => {
    if (types_1.isTVar(type)) {
        const m = map.get(type.id);
        if (!m) {
            const m = types_1.freshTMeta(type.kind);
            map.set(type.id, m);
            return m;
        }
        return m;
    }
    if (types_1.isTApp(type))
        return types_1.TApp(inst(type.left, map), inst(type.right, map));
    return type;
};
const instQual = (qual) => {
    const map = new Map();
    const cs = qual.constraints.map(c => {
        unification_1.checkKind(c, env_1.kConstraint);
        return inst(c, map);
    });
    const ty = inst(qual.type, map);
    return [cs, ty];
};
const gen = (type) => {
    if (types_1.isTMeta(type))
        return types_1.TVar(type.id, type.kind);
    if (types_1.isTApp(type))
        return types_1.TApp(gen(type.left), gen(type.right));
    return type;
};
const genQual = (cs, type) => types_1.Qual(cs.map(gen), gen(type));
const combine = (c1, c2) => c1.concat(c2).map(types_1.pruneType);
const synth = (env, expr) => {
    if (exprs_1.isVar(expr)) {
        const ty = env[expr.name];
        if (!ty)
            return util_1.tyerr(`undefined var ${expr.name}`);
        return instQual(ty);
    }
    if (exprs_1.isApp(expr)) {
        const [cs1, ta] = synth(env, expr.left);
        const [cs2, tb] = synth(env, expr.right);
        const tr = types_1.freshTMeta(env_1.kType);
        unification_1.unifyType(ta, env_1.tfun(tb, tr));
        return [combine(cs1, cs2), types_1.pruneType(tr)];
    }
    if (exprs_1.isNatLit(expr))
        return [[], env_1.tnat];
    if (exprs_1.isThunk(expr)) {
        const [cs, ty] = synth(env, expr.expr);
        return [cs, env_1.tfun(types_1.freshTMeta(env_1.kType), ty)];
    }
    return util_1.impossible('synth');
};
exports.infer = (env, expr) => {
    kinds_1.resetKindId();
    types_1.resetTypeId();
    const [cs, ty] = synth(env, expr);
    const free = types_1.freeTMeta(ty);
    return genQual(solver_1.solve(free, cs), ty);
};

},{"./env":2,"./exprs":3,"./kinds":5,"./solver":8,"./types":9,"./unification":10,"./util":11}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
exports.KCon = (name) => ({ tag: 'KCon', name });
exports.isKCon = (kind) => kind.tag === 'KCon';
exports.KMeta = (id) => ({ tag: 'KMeta', id, kind: null });
exports.isKMeta = (kind) => kind.tag === 'KMeta';
let kindId = 0;
exports.resetKindId = () => { kindId = 0; };
exports.freshKMeta = () => exports.KMeta(kindId++);
exports.KFun = (left, right) => ({ tag: 'KFun', left, right });
exports.isKFun = (kind) => kind.tag === 'KFun';
exports.showKind = (kind) => {
    if (exports.isKCon(kind))
        return kind.name;
    if (exports.isKMeta(kind))
        return `?${kind.id}`;
    if (exports.isKFun(kind))
        return `(${exports.showKind(kind.left)} -> ${exports.showKind(kind.right)})`;
    return util_1.impossible('showKind');
};
exports.pruneKind = (kind) => {
    if (exports.isKMeta(kind)) {
        if (!kind.kind)
            return kind;
        const k = exports.pruneKind(kind.kind);
        kind.kind = k;
        return k;
    }
    if (exports.isKFun(kind))
        return exports.KFun(exports.pruneKind(kind.left), exports.pruneKind(kind.right));
    return kind;
};
exports.containsKMeta = (kind, m) => {
    if (kind === m)
        return true;
    if (exports.isKFun(kind))
        return exports.containsKMeta(kind.left, m) || exports.containsKMeta(kind.right, m);
    return false;
};

},{"./util":11}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exprs_1 = require("./exprs");
const err = (msg) => {
    throw new SyntaxError(msg);
};
const TkName = (name) => ({ tag: 'TkName', name });
const isTkName = (token) => token.tag === 'TkName';
const TkNumber = (val) => ({ tag: 'TkNumber', val });
const isTkNumber = (token) => token.tag === 'TkNumber';
const TkString = (val) => ({ tag: 'TkString', val });
const isTkString = (token) => token.tag === 'TkString';
const TkParen = (tokens) => ({ tag: 'TkParen', tokens });
const isTkParen = (token) => token.tag === 'TkParen';
const TkCurly = (tokens) => ({ tag: 'TkCurly', tokens });
const isTkCurly = (token) => token.tag === 'TkCurly';
const matchingBracket = (c) => {
    if (c === '(')
        return ')';
    if (c === ')')
        return '(';
    if (c === '{')
        return '}';
    if (c === '}')
        return '{';
    return err(`invalid bracket: ${c}`);
};
const START = 0;
const NUM = 1;
const STR = 2;
const tokenize = (s) => {
    let state = START;
    let t = '';
    let r = [], p = [], b = [], esc = false;
    for (let i = 0; i <= s.length; i++) {
        const c = s[i] || ' ';
        const next = s[i + 1] || ' ';
        // console.log(i, c, state, t, esc);
        if (state === START) {
            if (/[a-z]/i.test(c))
                r.push(TkName(c));
            else if (/[0-9]/.test(c))
                t += c, state = NUM;
            else if (c === '"')
                state = STR;
            else if (c === '(' || c === '{')
                b.push(c), p.push(r), r = [];
            else if (c === ')' || c === '}') {
                if (b.length === 0)
                    return err(`unmatched bracket: ${c}`);
                const br = b.pop();
                if (matchingBracket(br) !== c)
                    return err(`unmatched bracket: ${br} and ${c}`);
                const a = p.pop();
                if (br === '(')
                    a.push(TkParen(r));
                else if (br === '{')
                    a.push(TkCurly(r));
                r = a;
            }
            else if (/\s+/.test(c))
                continue;
            else
                return err(`invalid char: ${c}`);
        }
        else if (state === NUM) {
            if (!/[0-9\.]/.test(c))
                r.push(TkNumber(t)), t = '', i--, state = START;
            else
                t += c;
        }
        else if (state === STR) {
            if (esc) {
                esc = false;
                t += c;
            }
            else if (c === '\\')
                esc = true;
            else if (c === '"')
                r.push(TkString(t)), t = '', state = START;
            else
                t += c;
        }
    }
    if (b.length > 0)
        return err(`unclosed brackets: ${b.join(' ')}`);
    if (state === STR)
        return err('unclosed string');
    if (state !== START)
        return err(`invalid parsing end state: ${state}`);
    return r;
};
const parseToken = (t) => {
    if (isTkName(t))
        return exprs_1.Var(t.name);
    if (isTkNumber(t))
        return exprs_1.NatLit(t.val);
    if (isTkParen(t))
        return parseParen(t.tokens);
    if (isTkCurly(t))
        return exprs_1.Thunk(parseParen(t.tokens));
    return err(`invalid token: ${t.tag}`);
};
const parseParen = (ts) => ts.length === 0 ? exprs_1.Var('u') :
    ts.length === 1 ? parseToken(ts[0]) :
        ts.map(parseToken).reduce(exprs_1.App);
exports.parse = (s) => parseParen(tokenize(s));

},{"./exprs":3}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env");
const parser_1 = require("./parser");
const exprs_1 = require("./exprs");
const inference_1 = require("./inference");
const types_1 = require("./types");
const compiler_1 = require("./compiler");
const _env = env_1.initialEnv;
function _show(x) {
    if (typeof x === 'string')
        return JSON.stringify(x);
    if (typeof x === 'function')
        return '[Function]';
    if (typeof x._tag === 'string')
        return typeof x.val === 'undefined' ? x._tag :
            Array.isArray(x.val) ? `(${x._tag} ${x.val.map(_show).join(' ')})` :
                `(${x._tag} ${_show(x.val)})`;
    if (typeof x === 'object' && x._rec) {
        const r = [];
        for (let k in x)
            if (k[0] !== '_')
                r.push(`${k}: ${_show(x[k])}`);
        return `{${r.join(', ')}}`;
    }
    return '' + x;
}
function _run(_i, cb) {
    try {
        console.log(_i);
        const _p = parser_1.parse(_i);
        console.log(exprs_1.showExpr(_p));
        const time = Date.now();
        const result = inference_1.infer(_env, _p);
        console.log(`${Date.now() - time}ms`);
        console.log(`${types_1.showQual(result)}`);
        const _c = compiler_1.compile(_p);
        console.log(_c);
        const res = eval(_c);
        cb(`${_show(res)} : ${types_1.showQual(result)}`);
    }
    catch (e) {
        console.log(e);
        cb('' + e, true);
    }
}
exports.default = _run;

},{"./compiler":1,"./env":2,"./exprs":3,"./inference":4,"./parser":6,"./types":9}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const util_1 = require("./util");
const env_1 = require("./env");
const handleDup = (free, type) => {
    if (types_1.isTMeta(type))
        return free.has(type) ? [types_1.tapp(env_1.cDup, type)] : [];
    if (types_1.isTCon(type)) {
        if (type.name === 'Nat')
            return [];
        if (type.name === 'List')
            return [];
        if (type.name === 'Unit')
            return [];
        return util_1.tyerr(`${types_1.showType(type)} cannot be duplicated`);
    }
    if (env_1.isTFun(type))
        return handleDup(free, type.right);
    if (types_1.isTApp(type))
        return handleDup(free, type.left).concat(handleDup(free, type.right));
    return util_1.tyerr(`${types_1.showType(type)} cannot be duplicated`);
};
const handleDrop = (free, type) => {
    if (types_1.isTMeta(type))
        return free.has(type) ? [types_1.tapp(env_1.cDrop, type)] : [];
    if (types_1.isTCon(type)) {
        if (type.name === 'Nat')
            return [];
        if (type.name === 'List')
            return [];
        if (type.name === 'Unit')
            return [];
        return util_1.tyerr(`${types_1.showType(type)} cannot be dropped`);
    }
    if (env_1.isTFun(type))
        return handleDup(free, type.right);
    if (types_1.isTApp(type))
        return handleDup(free, type.left).concat(handleDup(free, type.right));
    return util_1.tyerr(`${types_1.showType(type)} cannot be dropped`);
};
const solvers = {
    Dup: (free, args) => handleDup(free, args[0]),
    Drop: (free, args) => handleDrop(free, args[0]),
};
const solveOne = (free, cs) => {
    if (!types_1.isTApp(cs))
        return util_1.tyerr(`invalid constraint: ${types_1.showType(cs)}`);
    const f = types_1.flattenTApp(cs);
    if (!types_1.isTCon(f[0]))
        return util_1.tyerr(`invalid constraint head: ${types_1.showType(f[0])}`);
    const cname = f[0].name;
    if (!solvers[cname])
        return util_1.tyerr(`undefined constraint: ${cname}`);
    return solvers[cname](free, f[1]);
};
exports.solve = (free, cs) => {
    const remaining = [];
    for (let i = 0, l = cs.length; i < l; i++) {
        const ret = solveOne(free, types_1.pruneType(cs[i]));
        for (let j = 0, k = ret.length; j < k; j++)
            remaining.push(ret[j]);
    }
    return remaining.map(types_1.pruneType);
};

},{"./env":2,"./types":9,"./util":11}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
exports.TCon = (name, kind) => ({ tag: 'TCon', name, kind });
exports.isTCon = (type) => type.tag === 'TCon';
exports.TVar = (id, kind) => ({ tag: 'TVar', id, kind });
exports.isTVar = (type) => type.tag === 'TVar';
exports.TMeta = (id, kind) => ({ tag: 'TMeta', id, kind, type: null });
exports.isTMeta = (type) => type.tag === 'TMeta';
let typeId = 0;
exports.resetTypeId = () => { typeId = 0; };
exports.freshTMeta = (kind) => exports.TMeta(typeId++, kind);
exports.TApp = (left, right) => ({ tag: 'TApp', left, right });
exports.isTApp = (type) => type.tag === 'TApp';
exports.tapp = (...ts) => ts.reduce(exports.TApp);
exports.tapps = (head, args) => [head].concat(args).reduce(exports.TApp);
exports.flattenTApp = (ty) => {
    let c = ty;
    const args = [];
    while (exports.isTApp(c)) {
        args.push(c.right);
        c = c.left;
    }
    return [c, args.reverse()];
};
exports.showType = (type) => {
    if (exports.isTCon(type))
        return type.name;
    if (exports.isTVar(type))
        return `'${type.id}`;
    if (exports.isTMeta(type))
        return `?${type.id}`;
    if (exports.isTApp(type))
        return exports.isTApp(type.left) && exports.isTCon(type.left.left) && /[^a-z]/i.test(type.left.left.name) ?
            `(${exports.showType(type.left.right)} ${type.left.left.name} ${exports.showType(type.right)})` :
            `(${exports.showType(type.left)} ${exports.showType(type.right)})`;
    return util_1.impossible('showType');
};
exports.pruneType = (type) => {
    if (exports.isTMeta(type)) {
        if (!type.type)
            return type;
        const t = exports.pruneType(type.type);
        type.type = t;
        return t;
    }
    if (exports.isTApp(type))
        return exports.TApp(exports.pruneType(type.left), exports.pruneType(type.right));
    return type;
};
exports.containsTMeta = (type, m) => {
    if (type === m)
        return true;
    if (exports.isTApp(type))
        return exports.containsTMeta(type.left, m) || exports.containsTMeta(type.right, m);
    return false;
};
exports.freeTMeta = (type, s = new Set()) => {
    if (exports.isTMeta(type)) {
        s.add(type);
        return s;
    }
    if (exports.isTApp(type)) {
        exports.freeTMeta(type.right, exports.freeTMeta(type.left, s));
        return s;
    }
    return s;
};
exports.Qual = (constraints, type) => ({ tag: 'Qual', constraints, type });
exports.showQual = (qual) => qual.constraints.length === 0 ? exports.showType(qual.type) :
    `${qual.constraints.map(exports.showType).join(', ')} => ${exports.showType(qual.type)}`;

},{"./util":11}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const util_1 = require("./util");
const kinds_1 = require("./kinds");
const bindKind = (a, b) => {
    if (kinds_1.isKMeta(b) && b.id === a.id)
        return;
    if (kinds_1.containsKMeta(b, a))
        return util_1.tyerr(`infinite kind: ${kinds_1.showKind(a)} in ${kinds_1.showKind(b)}`);
    a.kind = b;
};
exports.unifyKind = (a_, b_) => {
    const a = kinds_1.pruneKind(a_);
    const b = kinds_1.pruneKind(b_);
    if (a === b)
        return;
    if (kinds_1.isKMeta(a))
        return bindKind(a, b);
    if (kinds_1.isKMeta(b))
        return bindKind(b, a);
    if (kinds_1.isKCon(a) && kinds_1.isKCon(b) && a.name === b.name)
        return;
    if (kinds_1.isKFun(a) && kinds_1.isKFun(b)) {
        exports.unifyKind(a.left, b.left);
        exports.unifyKind(a.right, b.right);
        return;
    }
    return util_1.tyerr(`cannot unify kinds ${kinds_1.showKind(a)} ~ ${kinds_1.showKind(b)}`);
};
const synthKind = (type) => {
    if (types_1.isTApp(type)) {
        const ka = synthKind(type.left);
        const kb = synthKind(type.right);
        const kr = kinds_1.freshKMeta();
        exports.unifyKind(ka, kinds_1.KFun(kb, kr));
        return kinds_1.pruneKind(kr);
    }
    return type.kind;
};
exports.checkKind = (ty, kind) => exports.unifyKind(kind, synthKind(ty));
const bindType = (a, b) => {
    if (types_1.isTMeta(b) && b.id === a.id)
        return;
    if (types_1.containsTMeta(b, a))
        return util_1.tyerr(`infinite type: ${types_1.showType(a)} in ${types_1.showType(b)}`);
    a.type = b;
};
exports.unifyType = (a_, b_) => {
    const a = types_1.pruneType(a_);
    const b = types_1.pruneType(b_);
    if (a === b)
        return;
    exports.unifyKind(synthKind(a), synthKind(b));
    if (types_1.isTMeta(a))
        return bindType(a, b);
    if (types_1.isTMeta(b))
        return bindType(b, a);
    if (types_1.isTCon(a) && types_1.isTCon(b) && a.name === b.name)
        return;
    if (types_1.isTVar(a) && types_1.isTVar(b) && a.id === b.id)
        return;
    if (types_1.isTApp(a) && types_1.isTApp(b)) {
        exports.unifyType(a.left, b.left);
        exports.unifyType(a.right, b.right);
        return;
    }
    return util_1.tyerr(`cannot unify types ${types_1.showType(a)} ~ ${types_1.showType(b)}`);
};

},{"./kinds":5,"./types":9,"./util":11}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impossible = (msg) => {
    throw new Error(msg);
};
exports.tyerr = (msg) => {
    throw new TypeError(msg);
};

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = require("./repl");
function getOutput(s, cb) {
    repl_1.default(s, cb);
}
var hist = [], index = -1;
var input = document.getElementById('input');
var content = document.getElementById('content');
function onresize() {
    content.style.height = window.innerHeight;
}
window.addEventListener('resize', onresize);
onresize();
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

},{"./repl":7}]},{},[12]);

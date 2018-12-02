(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":1,"inherits":2}],5:[function(require,module,exports){
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

},{"./types":12}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let id = 0;
exports.nextId = () => id++;
exports.namePart = (name) => name.split('$')[0];
exports.fresh = (name = '_') => `${exports.namePart(name)}$${exports.nextId()}`;

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Var = (name) => ({ tag: 'Var', name });
exports.Abs = (arg, body) => ({ tag: 'Abs', arg, body });
exports.App = (left, right) => ({ tag: 'App', left, right });
exports.appFrom = (es) => es.reduce(exports.App);
exports.Let = (name, val, body) => ({ tag: 'Let', name, val, body });
exports.showExpr = (expr) => {
    switch (expr.tag) {
        case 'Var': return expr.name;
        case 'Abs': return `(\\${expr.arg} -> ${exports.showExpr(expr.body)})`;
        case 'App': return `(${exports.showExpr(expr.left)} ${exports.showExpr(expr.right)})`;
        case 'Let': return `(let ${expr.name} = ${exports.showExpr(expr.val)} in ${exports.showExpr(expr.body)})`;
    }
};

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const Env_1 = require("./Env");
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

},{"./Env":5,"./types":12}],10:[function(require,module,exports){
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
function tokenize(s) {
    let state = START;
    let t = '';
    let r = [], p = [], b = [];
    for (let i = 0; i <= s.length; i++) {
        const c = s[i] || ' ';
        if (state === START) {
            if (/[a-z\:\_]/i.test(c))
                t += c, state = NAME;
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
        case 'list': return exprs(r.val, r.br);
    }
}
function parse(s) {
    return exprs(tokenize(s), '(');
}
exports.default = parse;

},{"./exprs":8,"./utils":13}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const inference_1 = require("./inference");
const util_1 = require("util");
const compile_1 = require("./compile");
const parser_1 = require("./parser");
const exprs_1 = require("./exprs");
exports._env = {
    Unit: types_1.Forall([], types_1.TVar('Unit')),
    True: types_1.Forall([], types_1.TVar('Bool')),
    False: types_1.Forall([], types_1.TVar('Bool')),
};
function _show(x) {
    if (typeof x === 'function')
        return '[Fn]';
    if (x._tag)
        return x._tag;
    return '' + x;
}
let _ctx = exports._env;
function _run(i, cb) {
    try {
        console.log(i);
        const p = parser_1.default(i);
        console.log(exprs_1.showExpr(p));
        const result = inference_1.inferGen(_ctx, p);
        if (util_1.isError(result))
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
exports.default = _run;

},{"./compile":7,"./exprs":8,"./inference":9,"./parser":10,"./types":12,"util":4}],12:[function(require,module,exports){
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
        const n = Name_1.namePart(ns[i]);
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

},{"./Name":6}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./repl":11}]},{},[14]);

function(export) {
	export.const = function(x) {return function(y) {return x}};

	export.isNum = function(n) {return typeof n === 'number'};
	export.isStr = function(s) {return typeof s === 'string'};
	export.isBool = function(s) {return typeof s === 'boolean'};
	export.isFun = function(s) {return typeof s === 'function'};
	export.isObj = function(x) {return x === 'object' && !Array.isArray(x)};
	export.isArr = Array.isArray;

	export.nativeEq = function(x) {return function(y) {return x === y}};
	export.nativeNeq = function(x) {return function(y) {return x !== y}};
	export.nativeGt = function(x) {return function(y) {return x > y}};
	export.nativeLt = function(x) {return function(y) {return x < y}};
	export.nativeGeq = function(x) {return function(y) {return x >= y}};
	export.nativeLeq = function(x) {return function(y) {return x <= y}};

	export.notBool = function(x) {return !x};
	export.andBool = function(x) {return function(y) {return x && y}};
	export.orBool = function(x) {return function(y) {return x || y}};

	export.negNum = function(x) {return -x};
	export.addNum = function(x) {return function(y) {return x + y}};
	export.subNum = function(x) {return function(y) {return x - y}};
	export.mulNum = function(x) {return function(y) {return x * y}};
	export.imulNum = function(x) {return function(y) {return Math.floor(x * y)}};
	export.divNum = function(x) {return function(y) {return x / y}};
	export.idivNum = function(x) {return function(y) {return Math.floor(x / y)}};
	export.remNum = function(x) {return function(y) {return x % y}};

	export.notNum = function(x) {return ~x};
	export.andNum = function(x) {return function(y) {return x & y}};
	export.orNum = function(x) {return function(y) {return x | y}};
	export.xorNum = function(x) {return function(y) {return x ^ y}};

	export.sqrtNum = Math.sqrt;
	export.absNum = Math.abs;
}

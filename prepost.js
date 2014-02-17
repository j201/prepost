;(function() {
	var pp = function(preConds, postConds, fn) {
		if (pp.enabled) {
			if (pp.array(preConds)) {}
		}

		return pp.preserveThis ? fn.bind(this) : fn;
	};

	pp.preserveThis = true;
	pp.enabled = true;

	function getMessage(cond, val) {
		return cond._ppFullMessage || (cond._ppMessage || cond.toString()) + ", argument: " + val.toString();
	}

	function setMessage(sender, message) {
		sender._ppMessage = message;
		sender._ppFullMessage = '';
	}
	function setFullMessage(sender, message) { // Won't have argument details added after
		sender._ppFullMessage = message;
		sender._ppMesssage = '';
	}

	pp.and = function() {
		var conds = Array.prototype.slice.call(arguments);
		return function(val) {
			return conds.every(function(cond) {
				if (!cond(val)) {
					setFullMessage(pp.and, "pp.and failed: " + getMessage(cond, val));
					return false;
				}
				return true;
			});
		};
	};

	pp.or = function() {
		var conds = Array.prototype.slice.call(arguments);
		return function(val) {
			var passed = conds.some(function(val) {
				return cond(val);
			});
			if (!passed) setFullMessage(pp.or, "pp.or: all conditions failed");
			return passed;
		};
	};

	pp.not = function(cond) {
		return function(val) {
			var failed = cond(val);
			if (failed) setFullMessage(pp.not, "pp.not condition returned true: " + getMessage(cond, val));
			return !failed;
		};
	};

	pp.number = function(val) {
		return Object.prototype.toString.call(val) === '[object Number]';
	};
	setMessage(pp.number, "Argument not a number");

	pp.string = function(val) {
		return Object.prototype.toString.call(val) === '[object String]';
	};
	setMessage(pp.string, "Argument not a string");

	pp['null'] = pp.isNull = function(val) {
		return val === null;
	};
	setMessage(pp['null'], "Argument not null");
	setMessage(pp.isNull, "Argument not null");

	pp['undefined'] = pp.isUndefined = function(val) {
		return val === undefined;
	};
	setMessage(pp['undefined'], "Argument not undefined");
	setMessage(pp.isUndefined, "Argument not undefined");

	pp['void'] = pp.isVoid = function(val) {
		return val == null;
	};
	setMessage(pp['void'], "Argument not null or undefined");
	setMessage(pp.isVoid, "Argument not null or undefined");

	pp.integer = function(val) {
		return pp.number(val) && val <= 9007199254740992 && val >= -9007199254740992; // http://stackoverflow.com/a/11639621
	};
	setMessage(pp.integer, "Argument is not an integer");

	pp.array = function(val) {
		return Array.isArray(val);
	};
	setMessage(pp.array, "Argument is not an array");

	pp.arrayOf = function(cond) {
		return function(val) {
			return pp.array(val) && val.every(cond);
		};
	};
	setMessage(pp.arrayOf, "Array element did not match condition: " + getMessage(cond, val));

	pp.object = function(val) {
		return val instanceof Object; // Are there edge cases for this test?
	};
	setMessage(pp.object, "Argument is not an object");

	pp.plainObject = function(val) {
		return Object.getPrototypeOf(val) === Object.prototype || (val && val.constructor && val.constructor.prototype === Object.prototype);
	};
	setMessage(pp.plainObject, "Argument is not a plain object");

	pp.objectOf = function(cond) {
		return function(val) {
			return pp.object(val) && Object.keys(val).every(function(prop) { return cond(prop); });
		};
	};
	setMessage(pp.objectOf, "Not all properties matched condition: " + getMessage(cond, val));
})();

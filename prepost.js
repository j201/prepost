var deepEqual = require('is-equal');

var pp = function(preConds, postCond, fn) {
	if (pp.enabled) {
		// TODO: arg type checking
		return function() {
			pp.args = Array.prototype.slice.call(arguments);
			if (pp.isFunction(preConds))
				preConds = [preConds];

			var failed, failCond, failArg;
			// TODO: implement pp.optional and pp.rest
			failed = preConds.some(function(cond, index) {
				failCond = cond;
				failArg = pp.args[index];
				return !cond(failArg);
			});

			if (failed)
				sendError("Pre condition failed: " + getMessage(failCond, failArg) + " in " + fn.toString());

			var result = fn.apply(this, arguments);
			if (!postCond(result))
				sendError("Post condition failed: " + getMessage(postCond, failArg) + " in " + fn.toString());

			return result;
		};
	}

	return fn;
};

pp.enabled = true;
pp.quiet = false;

function sendError(message) {
	if (pp.quiet)
		console.log(message); // console.warn maybe?
	else
		throw Error(message);
}

function toString(val) {
	return String(val); // TODO: improve
}

function getMessage(cond, val) {
	return cond._ppFullMessage || (cond._ppMessage || cond.toString()) + ", argument: " + toString(val);
}

function setMessage(sender, message) {
	sender._ppMessage = message;
	sender._ppFullMessage = '';
}
function setFullMessage(sender, message) { // Won't have argument details added after
	sender._ppFullMessage = message;
	sender._ppMesssage = '';
}

pp.pre = function(preCond, fn) {
	return pp(preCond, function() { return true; }, fn);
};
pp.post = function(postCond, fn) {
	return pp([], postCond, fn);
};

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
		if (!(pp.array(val) && val.every(cond))) {
			setMessage(pp.arrayOf, "Array element did not match condition: " + getMessage(cond, val));
			return false;
		}
		return true;
	};
};

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
		var passed = pp.object(val) && Object.keys(val).every(function(prop) { return cond(prop); });
		if (!passed)
			setMessage(pp.objectOf, "Not all properties matched condition: " + getMessage(cond, val));
		return passed;
	};
};

pp['function'] = pp.isFunction = function(val) {
	return typeof val === 'function';
};
setMessage(pp['function'], "Argument is not a function");
setMessage(pp.isFunction, "Argument is not a function");

pp.eq = function(val1) {
	return function(val2) {
		var passed = deepEqual(val1, val2);
		if (!passed)
			setMessage(pp.eq, "Argument not equal to " + toString(val1));
		return passed;
	};
};

pp.ne = function(val1) {
	return function(val2) {
		var failed = deepEqual(val1, val2);
		if (failed)
			setMessage(pp.ne, "Argument equal to " + toString(val1));
		return !failed;
	};
};

pp.gt = function(val1) {
	if (!pp.number(val1))
		throw Error('pp.gt requires a number, got ' + toString(val1));

	return function(val2) {
		if (!pp.number(val2))
			setMessage(pp.gt, "Argument not a number ");
		else if (val2 <= val1)
			setMessage(pp.gt, "Argument is not greater than " + val1);
		else
			return true;
		return false;
	};
};

pp.gte = function(val1) {
	if (!pp.number(val1))
		throw Error('pp.gte requires a number, got ' + toString(val1));

	return function(val2) {
		if (!pp.number(val2))
			setMessage(pp.gte, "Argument not a number ");
		else if (val2 < val1)
			setMessage(pp.gte, "Argument is not greater than or equal to " + val1);
		else
			return true;
		return false;
	};
};

pp.lt = function(val1) {
	if (!pp.number(val1))
		throw Error('pp.lt requires a number, got ' + toString(val1));

	return function(val2) {
		if (!pp.number(val2))
			setMessage(pp.lt, "Argument not a number ");
		else if (val2 >= val1)
			setMessage(pp.lt, "Argument is not less than " + val1);
		else
			return true;
		return false;
	};
};

pp.lte = function(val1) {
	if (!pp.number(val1))
		throw Error('pp.lte requires a number, got ' + toString(val1));

	return function(val2) {
		if (!pp.number(val2))
			setMessage(pp.lte, "Argument not a number ");
		else if (val2 > val1)
			setMessage(pp.lte, "Argument is not less than or equal to " + val1);
		else
			return true;
		return false;
	};
};

pp.instanceOf = function(ctor) {
	return function(val) {
		if (!(val instanceof ctor)) {
			setMessage(pp.instanceOf, "Argument is not an instance of " + ctor);
			return false;
		}
		return true;
	};
};

pp.optional = function(cond) {
	var result = function(x) {
		var result = cond(x);
		setMessage(pp.optional, getMessage(cond));
		return result;
	};
	result._ppOptional = true;
	return result;
};

function isOptional(cond) {
	return cond._ppOptional;
}

// TODO: pp.rest

module.exports = pp;

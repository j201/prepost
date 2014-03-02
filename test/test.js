var pp = require('../prepost');
var tape = require('tape');

var atEnd = pp.pre([pp.string, pp.variadic(pp.number)], function(){});
atEnd("foo", 1, 2, 3);

tape("Prepost", function(t) {
	var add = pp([pp.number, pp.number], pp.number, function(a, b) { return a + b; });
	var wrongAdd = pp([pp.number, pp.number], pp.number, function(a, b) { return a + "b"; });

	t.doesNotThrow(add.bind(null, 1, 2), "doesn't throw when the conditions are fulfilled");
	t.throws(add.bind(null, 1, "2"), "throws when a pre condition fails");
	t.throws(wrongAdd.bind(null, 1, 2), "throws when a post condition fails");

	t.test("pre", function(t) {
		var add = pp.pre([pp.number, pp.number], function(a, b) { return a + b; });
		t.doesNotThrow(add.bind(null, 1, 2));
		t.throws(add.bind(null, 1, "2"));
		t.end();
	});

	t.test("post", function(t) {
		var add = pp.post(pp.number, function(a, b) { return a + b; });
		t.doesNotThrow(add.bind(null, 1, 2));
		t.throws(add.bind(1, "2"));
		t.end();
	});

	function testMatcher(name, matcher, dntInputs, throwInputs) {
		t.test(name, function(t) {
			var ident = pp.pre(matcher, function(x) { return x; });
			dntInputs.forEach(function (input) {
				t.doesNotThrow(ident.bind(null, input));
			});
			throwInputs.forEach(function (input) {
				t.throws(ident.bind(null, input));
			});
			t.end();
		});
	}

	testMatcher("any", pp.any, [1, null, undefined], []);
	testMatcher("number", pp.number, [1, NaN], ["1", null]);
	testMatcher("string", pp.string, ["foo", ''], [0, null]);
	testMatcher("null", pp.isNull, [null], [undefined, {}]);
	testMatcher("undefined", pp.isUndefined, [undefined], [null, NaN]);
	testMatcher("void", pp.isVoid, [null, undefined], [NaN, 0, '']);
	testMatcher("integer", pp.integer, [0, -10, 50, Math.pow(2, 40)], [0.1, NaN, Infinity, Math.pow(2, 40) + 0.1, Math.pow(2, 54)]);
	testMatcher("array", pp.array, [[1, 2], [], Array()], [{length: 1, '0': 0}]);
	testMatcher("arrayOf", pp.arrayOf(pp.number), [[1, 2], []], [[1, 2, "3", 4]]);
	testMatcher("object", pp.object, [{}, Object(1), function(){}, [], /a/], [null, 1, "foo", false]);
	testMatcher("objectOf", pp.objectOf(pp.number), [{}, {a: 1, b: 2}], [{a: 1, b: null}]);
	testMatcher("function", pp.isFunction, [function(){}], [{}]);
	testMatcher("and", pp.and(pp.integer, pp.gt(0)), [1, 4], [-1, 0.2, -0.5]);
	testMatcher("or", pp.or(pp.integer, pp.gt(0)), [-2, 0.5, 3], [-0.3]);
	testMatcher("maybe", pp.maybe(pp.number), [2, NaN, null, undefined], ["", {}]);

	function testCurried(name, matcher, dntPairs, throwPairs) {
		t.test(name, function(t) {
			dntPairs.forEach(function(pair) {
				var ident = pp.pre(matcher(pair[0]), function(x) { return x; });
				t.doesNotThrow(ident.bind(null, pair[1]));
			});
			throwPairs.forEach(function(pair) {
				var ident = pp.pre(matcher(pair[0]), function(x) { return x; });
				t.throws(ident.bind(null, pair[1]));
			});
			t.end();
		});
	}

	testCurried("eq", pp.eq,
				[[1, 1], [{a: 1}, {a: 1}], [/foo/, /foo/], [[[1, [2, 3]], 4], [[1, [2, 3]], 4]]],
				[[1, 2], [{a: 1}, {a: 2}], [/foo/, /foo/g], [[[1, [2, 3]], 4], [[1, [2, 5]], 4]]]);
	testCurried("ne", pp.ne,
				[[1, 2], [{a: 1}, {a: 2}], [/foo/, /foo/g], [[[1, [2, 3]], 4], [[1, [2, 5]], 4]]],
				[[1, 1], [{a: 1}, {a: 1}], [/foo/, /foo/], [[[1, [2, 3]], 4], [[1, [2, 3]], 4]]]);
	testCurried("gt", pp.gt, [[1, 2]], [[2, 1], [1, 1], [1, '2']]); // Should throw on non-numbers
	testCurried("gte", pp.gte, [[1, 2], [1, 1]], [[2, 1], [1, '2']]);
	testCurried("lt", pp.lt, [[2, 1]], [[1, 2], [1, 1], [2, '1']]);
	testCurried("lte", pp.lte, [[2, 1], [1, 1]], [[1, 2], [2, '1']]);
	testCurried("instanceOf", pp.instanceOf, [[Object, {}], [Date, new Date()]], [[Number, 2]]);

	t.test('optional', function(t) {
		var doStuff = pp.pre([pp.number, pp.optional(pp.object), pp.isFunction], function(a, b, c) {});

		t.doesNotThrow(doStuff.bind(null, 1, {foo: 2}, function(){}), "doesn't throw when argument present and correct");
		t.doesNotThrow(doStuff.bind(null, 1, function(){}), "doesn't throw when argument omitted");
		t.throws(doStuff.bind(null, 1, 2, function(){}), "throws when optional argument is incorrect");
		t.throws(doStuff.bind(null, 1, {}, 3), "throws when other argument is incorrect");
		t.throws(doStuff.bind(null, 1, 2), "throws when omitted and other argument is incorrect");

		t.end();
	});

	t.test('variadic', function(t) {
		var atEnd = pp.pre([pp.string, pp.variadic(pp.number)], function(){});
		var inMiddle = pp.pre([pp.string, pp.variadic(pp.number), pp.string], function(){});

		t.doesNotThrow(atEnd.bind(null, "foo"), "doesn't throw with no variadic arguments");
		t.doesNotThrow(atEnd.bind(null, "foo", 2), "doesn't throw with one correct variadic argument");
		t.throws(atEnd.bind(null, "foo", "2"), "throws with one incorrect variadic argument");
		t.doesNotThrow(atEnd.bind(null, "foo", 2, 3, 4), "doesn't throw with multiple correct variadic arguments");
		t.throws(atEnd.bind(null, "foo", 2, "3", 4), "throws with any incorrect variadic arguments");

		t.throws(inMiddle.bind(null, "foo"), "throws with omitted required end arguments");
		t.doesNotThrow(inMiddle.bind(null, "foo", "bar"), "doesn't throw with no middle variadic arguments");
		t.doesNotThrow(inMiddle.bind(null, "foo", 2, "bar"), "doesn't throw with one correct middle variadic argument");
		t.throws(inMiddle.bind(null, "foo", "bar", "baz"), "throws with one incorrect middle variadic argument");
		t.doesNotThrow(inMiddle.bind(null, "foo", 2, 3, 4, "bar"), "doesn't throw with multiple correct middle variadic arguments");
		t.throws(inMiddle.bind(null, "foo", 2, "3", 4, "bar"), "throws with any incorrect middle variadic arguments");

		t.end();
	});

	t.end();
});

var pp = require('../prepost');
var tape = require('tape');

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

	testMatcher("number", pp.number, [1, NaN], ["1", null]);
	testMatcher("string", pp.string, ["foo", ''], [0, null]);
	testMatcher("null", pp.isNull, [null], [undefined, {}]);
	testMatcher("undefined", pp.isUndefined, [undefined], [null, NaN]);
	testMatcher("void", pp.isVoid, [null, undefined], [NaN, 0, '']);
	testMatcher("integer", pp.integer, [0, -10, 50, Math.pow(2, 40)], [0.1, NaN, Infinity, Math.pow(2, 40) + 0.1, Math.pow(2, 54)]);
	testMatcher("array", pp.array, [[1, 2], [], Array()], [{length: 1, '0': 0}]);
	testMatcher("arrayOf", pp.arrayOf(pp.number), [[1, 2], []], [[1, 2, "3", 4]]);
	testMatcher("object", pp.object, [{}, new Object(), Object(1), function(){}, [], /a/], [null, 1, "foo", false]);
	testMatcher("objectOf", pp.objectOf(pp.number), [{}, {a: 1, b: 2}], [{a: 1, b: null}]);

	t.end();
});

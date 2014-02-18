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

	t.test("number", function(t) {
		var add = pp([pp.number, pp.number], pp.number, function(a, b) { return a + b; });
		t.doesNotThrow(add.bind(null, 1, 2));
		t.throws(add.bind(null, 1, "2"));
		t.end();
	});

	t.test("string", function(t) {
		var upper = pp(pp.string, pp.string, function(s) { return s.toUpperCase(); });
		t.doesNotThrow(upper.bind(null, "foo"));
		t.throws(upper.bind(null, 2));
		t.end();
	});

	t.test("null", function(t) {
		var ident = pp.pre(pp.isNull, function(x) { return x; });
		t.doesNotThrow(ident.bind(null, null));
		t.throws(ident.bind(null));
		t.end();
	});

	t.end();
});

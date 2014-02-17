var pp = require('../prepost');
var tape = require('tape');

tape("Prepost", function(t) {
	var add = pp([pp.number, pp.number], pp.number, function(a, b) { return a + b; });

	t.doesNotThrow(add.bind(null, 1, 2), "doesn't throw when the conditions are fulfilled");
	t.throws(add.bind(null, 1, "2"), "throws when a pre condition fails");

	t.end();
});

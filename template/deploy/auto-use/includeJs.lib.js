var includedJs = new Set();

function includeJs(file) {
	var path = fullPath(file);
	if (includedJs.has(path)) return;
	includedJs.add(path);

	insert('// Line 1 "' + path + '"\n');
	include(file);

	var top = stack[stack.length - 1];
	insert('// Line ' + top.location.lineNumber + ' "' + top.location.source + '"\n');
}

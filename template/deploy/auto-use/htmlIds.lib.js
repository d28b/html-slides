function htmlIds(removeElementIds) {
	var top = stack[stack.length - 1];

	var idList = [];
	for (var label in ids)
		if (label.match(/^[a-zA-Z0-9]+$/))
			idList.push(label);
	idList.sort();

	var text = [];
	text.push(top.indent, 'var html = {\n');
	for (var label of idList)
		text.push(top.indent, '\t', label, ': document.getElementById(\'', label, '\'),\n');
	text.push(top.indent, '\t};\n');

	if (removeElementIds)
		for (var label of idList)
			text.push(top.indent, 'window.', label, ' = null;\n');

	insertRaw(text.join(''));
}

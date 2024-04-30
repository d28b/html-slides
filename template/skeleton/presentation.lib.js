const htmlHeaderLines = [];
let htmlTitle = 'Presentation';

let slideNumber = 0;
const list = [];

function header(text) {
	htmlHeaderLines.push(text);
}

function title(title) {
	htmlTitle = title;
	list.push({slideHandler, indexHandler});

	function slideHandler() { }

	function indexHandler(state) {
		finishSlideRow(state);
		insertRaw('<div class="title">' + title + '</div>\n');
	}
}

function topic(title) {
	list.push({slideHandler, indexHandler});

	function slideHandler() { }

	function indexHandler(state) {
		finishSlideRow(state);
		insertRaw('<div class="topic">' + title + '</div>\n');
	}
}

function subTopic(title) {
	list.push({slideHandler, indexHandler});

	function slideHandler() { }

	function indexHandler(state) {
		finishSlideRow(state);
		insertRaw('<div class="subTopic">' + title + '</div>\n');
	}
}

function slide(file, title, className) {
	slideNumber += 1;
	const number = slideNumber;
	const id = 'slide-' + number;
	if (! title) title = '';
	const fullFilePath = fullPath(file);
	list.push({slideHandler, indexHandler});

	function slideHandler() {
		const parsedPath = path.parse(fullFilePath);
		const jsFullFilePath = path.join(parsedPath.dir, parsedPath.name + '.js');

		insertRaw('<div class="slide' + (className ? ' ' + className : '') + '" id="' + id + '">\n');
		if (parsedPath.ext == '.html') include(fullFilePath);
		else if (parsedPath.ext == '.svg') svg.file(fullFilePath);
		else if (parsedPath.ext == '.mp4') videoFile(fullFilePath);
		else if (parsedPath.ext == '.webm') videoFile(fullFilePath);
		else if (parsedPath.ext == '.ogg') videoFile(fullFilePath);
		else if (parsedPath.ext == '.png') imageFile(fullFilePath);
		else if (parsedPath.ext == '.jpg') imageFile(fullFilePath);
		else if (parsedPath.ext == '.jpeg') imageFile(fullFilePath);
		else insertRaw('<div>Unknown file extension ' + parsedPath.ext + '.</div>\n');
		jsFile(jsFullFilePath);
		insertRaw('\t<div class="slideNumber">' + number + '</div>\n');
		insertRaw('</div>\n');
	}

	function indexHandler(state) {
		startSlideRow(state);
		insertRaw('\t<div id="index-' + id + '" onclick="onIndexSlideClick(this)">' + title + '<div>' + number + '</div></div>\n');
	}
}

function startSlideRow(state) {
	if (state.row) return;
	insertRaw('<div class="slideRow">\n');
	state.row = true;
}

function finishSlideRow(state) {
	if (! state.row) return;
	insertRaw('</div>\n');
	state.row = false;
}

function createSlides() {
	for (const item of list)
		item.slideHandler();
}

function createIndex() {
	const state = {row: false};
	for (const item of list)
		item.indexHandler(state);
	finishSlideRow(state);
}

function videoFile(fullPath) {
	const src = relativePath(fullPath);
	insertRaw('\t<video width="1000" height="600" controls>\n');
	insertRaw('\t\t<source src="' + src + '" type="video/mp4">\n');
	insertRaw('\t\t<a href="' + src + '">Play video with external player</a>\n');
	insertRaw('\t</video>\n');
}

function imageFile(fullPath) {
	insertRaw('\t<img src="' + relativePath(fullPath) + '" class="full">\n');
}

function jsFile(fullPath) {
	// Check if the file exits
	if (! statFile(fullPath).isFile) {
		rule.addDependency(fullPath);
		return;
	}

	// Add it to the output
	const result = readFile(fullPath);
	const lines = [
		'<script>',
		'(function() {',
		'\tconst slide = document.currentScript.parentElement;',
		result.content,
		'})();',
		'</script>'
		];

	insert(lines.join('\n'), result.state);
}

function relativePath(fullPath) {
	const targetDir = path.dirname(target);
	return path.relative(targetDir, fullPath);
}

function htmlHeader() {
	insert(htmlHeaderLines.join('\n'));
}

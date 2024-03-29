const xml = require('./xml.lib.js');

var htmlHeader = '';
var htmlTitle = 'Presentation';

var slideNumber = 0;
var list = [];

function header(text) {
	htmlHeader += text + '\n';
}

function title(title) {
	htmlTitle = title;
	list.push({slideHandler: slideHandler, indexHandler, indexHandler});

	function slideHandler() { }

	function indexHandler(state) {
		finishSlideRow(state);
		output.push('<div class="title">' + title + '</div>\n');
	}
}

function topic(title) {
	list.push({slideHandler: slideHandler, indexHandler, indexHandler});

	function slideHandler() { }

	function indexHandler(state) {
		finishSlideRow(state);
		output.push('<div class="topic">' + title + '</div>\n');
	}
}

function subTopic(title) {
	list.push({slideHandler: slideHandler, indexHandler, indexHandler});

	function slideHandler() { }

	function indexHandler(state) {
		finishSlideRow(state);
		output.push('<div class="subTopic">' + title + '</div>\n');
	}
}

function slide(file, title, className) {
	slideNumber += 1;
	var number = slideNumber;
	var id = 'slide-' + number;
	if (! title) title = '';
	var fullPath = path.join(folder, file);
	list.push({slideHandler: slideHandler, indexHandler, indexHandler});

	function slideHandler() {
		var parsedPath = path.parse(fullPath);
		var jsFullPath = path.join(parsedPath.dir, parsedPath.name + '.js');

		output.push('<div class="slide' + (className ? ' ' + className : '') + '" id="' + id + '">\n');
		if (parsedPath.ext == '.html') htmlFile(fullPath);
		else if (parsedPath.ext == '.svg') svgFile(fullPath);
		else if (parsedPath.ext == '.mp4') videoFile(fullPath);
		else if (parsedPath.ext == '.webm') videoFile(fullPath);
		else if (parsedPath.ext == '.ogg') videoFile(fullPath);
		else if (parsedPath.ext == '.png') imageFile(fullPath);
		else if (parsedPath.ext == '.jpg') imageFile(fullPath);
		else if (parsedPath.ext == '.jpeg') imageFile(fullPath);
		else output.push('<div>Unknown file extension ' + parsedPath.ext + '.</div>\n');
		jsFile(jsFullPath);
		output.push('\t<div class="slideNumber">' + number + '</div>\n');
		output.push('</div>\n');
	}

	function indexHandler(state) {
		startSlideRow(state);
		output.push('\t<div id="index-' + id + '" onclick="onIndexSlideClick(this)">' + title + '<div>' + number + '</div></div>\n');
	}
}

function startSlideRow(state) {
	if (state.row) return;
	output.push('<div class="slideRow">\n');
	state.row = true;
}

function finishSlideRow(state) {
	if (! state.row) return;
	output.push('</div>\n');
	state.row = false;
}

function createSlides() {
	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		item.slideHandler();
	}
}

function createIndex() {
	var state = {row: false};
	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		item.indexHandler(state);
	}
	finishSlideRow(state);
}

function htmlFile(fullPath) {
	output.push('\t<? include ../' + fullPath + ' ?>\n');
}

function svgFile(fullPath) {
	// Add the source
	rule.addDependency(fullPath);

	// Read
	var content = fs.readFileSync(fullPath, {encoding: 'utf8'});
	if (content == null) return;

	// Parse
	var root = xml.parse(content);
	var svg = root.firstChildWithTag('svg');

	// Clean
	delete svg.attributes['sodipodi:docname'];
	delete svg.attributes['viewBox'];
	delete svg.attributes['inkscape:version'];
	delete svg.attributes['xmlns:inkscape'];
	delete svg.attributes['xmlns:rdf'];
	delete svg.attributes['xmlns:dc'];
	delete svg.attributes['xmlns:cc'];
	delete svg.attributes['xmlns:svg'];
	delete svg.attributes['xmlns:sodipodi'];

	svg.removeChildrenWithTag('defs');
	svg.removeChildrenWithTag('metadata');
	svg.removeChildrenWithTag('sodipodi:namedview');
	svg.removeChildrenWith(node => node.attributes && node.attributes.id && node.attributes.id.match(/[A-Za-z0-9]+(Ruler|Color)/));
	svg.traverseNodes(checkNode);

	// Add it to the output
	svg.stringify(output, '\t');

	function checkNode(node, parents) {
		//delete node.attributes['xml:space'];

		// Remove default IDs
		if (node.attributes.id != null && node.attributes.id.match(/^(text|tspan|rect|path|g|circle|defs|svg|a|polygon|image)\d{1,4}$/))
			delete node.attributes['id'];

		// Remove inkscape-specific attributes
		for (var key in node.attributes) {
			var key9 = key.substr(0, 9);
			if (key9 == 'sodipodi:' || key9 == 'inkscape:') delete node.attributes[key];
		}

		// Fix hrefs
		if (node.attributes['xlink:href']) {
			var folder = path.dirname(fullPath);
			var link = node.attributes['xlink:href'];
			node.attributes['xlink:href'] = path.join(folder, link);
		}

		// Clean the style
		if (node.attributes.style != null) {
			var style = {};
			var styles = node.attributes.style.split(/;/);
			for (var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var match = item.match(/^(.*?)\s*:\s*(.*?)\s*$/);
				if (! match) continue;
				style[match[1]] = match[2];
			}

			cleanStyle(style);

			var text = '';
			var keys = Object.keys(style).sort();
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				var value = style[key];
				if (i > 0) text += '; ';
				text += key + ':' + value;
			}

			node.attributes.style = text;
		}
	}

	function cleanStyle(style) {
		delete style['-inkscape-font-specification'];
		delete style['font-family'];
	}
}

function videoFile(fullPath) {
	output.push('\t<video width="1000" height="600" controls>\n');
	output.push('\t\t<source src="' + fullPath + '" type="video/mp4">\n');
	output.push('\t\t<a href="' + fullPath + '">Play video with external player</a>\n');
	output.push('\t</video>\n');
}

function imageFile(fullPath) {
	output.push('\t<img src="' + fullPath + '" class="full">\n');
}

function jsFile(fullPath) {
	// Add the dependency no matter if the file exists
	rule.addDependency(fullPath);

	// Check if the file exits
	if (! statFile(fullPath).isFile) return;

	// Add it to the output
	output.push('\t<script>\n');
	output.push('\t(function() {\n');
	output.push('\t\tvar slide = document.currentScript.parentElement;\n');
	output.push('\t\tINCLUDE ../' + fullPath + '\n');
	output.push('\t})();\n');
	output.push('\t</script>\n');
}

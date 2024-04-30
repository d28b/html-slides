const xmlTree = require('./xmlTree.js');
const crypto = require('node:crypto');

function svgDefinitions() {
	let uniqueCounter = 0;
	const usedIds = new Set();
	const byHashHex = new Map();

	const indent = stack[stack.length - 1].indent ?? '';
	insertGenerator(generator);
	return {file};

	function generator() {
		const svg = xmlTree.createNode('svg');
		svg.attributes.set('width', '0');
		svg.attributes.set('height', '0');
		svg.attributes.set('style', 'position: fixed; x: 0; y: 0');
		const defs = xmlTree.createNode('defs');
		svg.children.push(defs);

		for (const item of byHashHex.values()) {
			if (! item.used) continue;
			defs.children.push(item.node);
		}

		if (! defs.children.length) return [];

		const output = [];
		svg.normalizeWhitespace(indent);
		svg.addToOutput(output);
		return output;
	}

	function define(node) {
		node.removeWhitespace();
		const sha256 = crypto.createHash('sha256');
		sha256.update(node.stringify());
		const hashHex = sha256.digest('hex');

		const item = byHashHex.get(hashHex);
		if (item) return item;

		const oldId = node.attributes.get('id');
		const id = usedIds.has(oldId) ? createUniqueId() : oldId;
		usedIds.add(id);

		node.attributes.set('id', id);
		const newItem = {node, hashHex, id, used: 0};
		byHashHex.set(hashHex, newItem);
		return newItem;
	}

	function createUniqueId() {
		uniqueCounter += 1;
		return 'svg-def-' + uniqueCounter.toFixed(0);
	}

	function file(file, options = {}) {
		const result = readFile(file);
		if (! result) return;

		// Parse
		const root = xmlTree.parse(result.content);
		const svg = root.firstChildWithTag('svg');

		// Clean
		svg.attributes.delete('xmlns:inkscape');
		svg.attributes.delete('xmlns:rdf');
		svg.attributes.delete('xmlns:dc');
		svg.attributes.delete('xmlns:cc');
		svg.attributes.delete('xmlns:svg');
		svg.attributes.delete('xmlns:sodipodi');
		cleanAttributes(svg.attributes);

		svg.removeChildrenWithTag('metadata');
		svg.removeChildrenWithTag('sodipodi:namedview');
		svg.traverseNodes(cleanNode);

		function cleanNode(node, parents) {
			// Remove default IDs
			const id = node.attributes.get('id');
			if (id != null && id.match(/^(layer|text|tspan|rect|path|g|circle|ellipse|defs|svg|a|polygon|image|use)\d+$/))
				node.attributes.delete('id');

			// Remove inkscape-specific attributes
			cleanAttributes(node.attributes);

			// Fix hrefs
			const href = node.attributes.get('xlink:href');
			if (href) {
				const resolvedHref = path.resolve(result.state.folder, href);
				const targetDir = path.dirname(target);
				node.attributes.set('xlink:href', path.relative(targetDir, resolvedHref));
			}

			// Clean the style
			const styleValue = node.attributes.get('style');
			if (! styleValue) return;

			const style = new Map();
			for (const item of styleValue.split(/;/)) {
				const match = item.match(/^(.*?)\s*:\s*(.*?)\s*$/);
				if (! match) continue;
				style.set(match[1], match[2]);
			}

			for (const key of style.keys())
				if (key.startsWith('-inkscape'))
					style.delete(key);

			if (options.processStyle)
				options.processStyle();

			const properties = Array.from(style).sort((a, b) => a[0].localeCompare(b[0])).map(entry => entry[0] + ': ' + entry[1]);
			node.attributes.set('style', properties.join('; '));
		}

		// Move defs to definitions, and replace IDs
		const defsById = new Map();
		const defsNode = svg.firstChildWithTag('defs');
		if (defsNode) {
			for (const child of defsNode.children) {
				if (! child.attributes) continue;
				const id = child.attributes.get('id');
				const def = define(child);
				defsById.set(id, def);
			}
		}

		svg.traverseNodes(replaceDefIds);
		svg.removeChildrenWithTag('defs');

		function replaceDefIds(node, parents) {
			const styleValue = node.attributes.get('style');
			if (! styleValue) return;

			const replacedStyleValue = styleValue.replace(/url\(#([a-zA-Z0-9_\-]*)\)/g, replaceUrlId);
			node.attributes.set('style', replacedStyleValue);

			function replaceUrlId(all, id) {
				const def = defsById.get(id);
				if (def) def.used += 1;
				return 'url(#' + (def ? def.id : id) + ')';
			}
		}

		// Apply options
		applyAttribute('id');
		applyAttribute('style');
		applyAttribute('width');
		applyAttribute('height');
		applyAttribute('viewBox');
		applyAttribute('class');
		if (options.processSvg) options.processSvg(svg);

		function applyAttribute(name) {
			const value = options[name];
			if (value === undefined) return;
			if (value == null) svg.attributes.delete(name);
			else svg.attributes.set(name, '' + value);
		}

		// Insert
		svg.normalizeWhitespace();
		insert(svg.stringify(), result.state);
	}

	function cleanAttributes(attributes) {
		for (const key of attributes.keys())
			if (key.startsWith('sodipodi:') || key.startsWith('inkscape:'))
				attributes.delete(key);
	}
}

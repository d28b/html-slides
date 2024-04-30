exports.parse = parse;
exports.createNode = function(tag, attributes, children) { return new Node(tag, attributes, children); };
exports.createTextNode = function(text) { return new TextNode(text); };
exports.createCDataNode = function(text) { return new CDataNode(text); };
exports.createCommentNode = function(text) { return new CommentNode(text); };

function Node(tag, attributes, children) {
	this.tag = tag;
	this.attributes = attributes ?? new Map();
	this.children = children ?? [];
}

Node.prototype.clone = function() {
	return new Node(this.tag, new Map(this.attributes), this.children.map(child => child.clone()));
};

Node.prototype.firstChildWithTag = function(tag) {
	for (const child of this.children)
		if (child.tag == tag) return child;
	return null;
};

Node.prototype.removeChildrenWithTag = function(tag) {
	let i = 0;
	while (i < this.children.length) {
		if (this.children[i].tag == tag) this.children.splice(i, 1);
		else i += 1;
	}
};

Node.prototype.childrenWithTag = function(tag) {
	const list = [];
	for (const child of this.children)
		if (child.tag == tag) list.push(child);
	return list;
};

Node.prototype.firstChildWith = function(handler) {
	for (const child of this.children)
		if (handler(child)) return child;
	return null;
};

Node.prototype.removeChildrenWith = function(handler) {
	let i = 0;
	while (i < this.children.length) {
		if (handler(this.children[i])) this.children.splice(i, 1);
		else i += 1;
	}
};

Node.prototype.childrenWith = function(handler) {
	const list = [];
	for (const child of this.children)
		if (handler(child)) list.append(child);
	return list;
};

Node.prototype.traverseNodes = function(handler) {
	const parents = [];
	traverse(this);

	function traverse(child) {
		if (child.tag == null) return;
		handler(child, parents);
		parents.push(child);
		child.children.forEach(traverse);
		parents.pop();
	}
};

Node.prototype.stringify = function() {
	const output = [];
	this.addToOutput(output);
	return output.join('');
};

Node.prototype.addToOutput = function(output) {
	if (this.tag == null) return addChildren(this.children);

	output.push('<' + this.tag);
	const entries = Array.from(this.attributes).sort((a, b) => a[0].localeCompare(b[0]));
	for (const entry of entries)
		output.push(' ' + entry[0] + '="' + replaceXmlEntities('' + entry[1]) + '"');

	if (this.children.length == 0) {
		output.push(this.tag.startsWith('?') ? ' ?>' : ' />');
		return;
	}

	output.push('>');
	addChildren(this.children);
	output.push('</' + this.tag + '>');

	function addChildren(children) {
		for (const child of children)
			child.addToOutput(output);
	}
};

Node.prototype.removeWhitespace = function() {
	if (this.attributes.get('xml:space') == 'preserve') return;

	const children = [];
	for (const child of this.children) {
		if (child.constructor == TextNode && child.text.trim() == '') continue;
		if (child.constructor == Node) child.removeWhitespace();
		children.push(child);
	}

	this.children = children;
};

Node.prototype.normalizeWhitespace = function(indent = '') {
	if (this.attributes.get('xml:space') == 'preserve') return;
	if (! this.children.length) return;

	if (this.children.length == 1) {
		const child = this.children[0];
		if (child.constructor == TextNode) {
			child.text = child.text.trim();
			return;
		}
	}

	const children = [];
	const childIndent = this.tag == null ? indent : indent + '\t';
	for (const child of this.children) {
		if (child.constructor == TextNode) {
			child.text = child.text.trim();
			if (child.text == '') continue;
			child.text = '\n' + childIndent + child.text;
			children.push(child);
		} else {
			children.push(new TextNode('\n' + childIndent));
			if (child.constructor == Node) child.normalizeWhitespace(childIndent);
			children.push(child);
		}
	}

	if (this.tag != null && children.length) children.push(new TextNode('\n' + indent));
	this.children = children;
};

Node.prototype.textContent = function() {
	let text = '';
	for (const child of this.children) {
		if (child.text != null) text += child.text;
		else if (child.cdata != null) text += child.cdata;
		else if (child.tag != null) text += child.textContent();
	}
	return text;
};

function TextNode(text) {
	this.text = text;
}

TextNode.prototype.clone = function() {
	return new TextNode(this.text);
};

TextNode.prototype.addToOutput = function(output, indent) {
	output.push(replaceXmlEntities(this.text));
};

function CDataNode(cdata) {
	this.cdata = cdata;
}

CDataNode.prototype.clone = function() {
	return new CDataNode(this.cdata);
};

CDataNode.prototype.addToOutput = function(output, indent) {
	output.push('<![CDATA[' + this.cdata + ']]>');
};

function CommentNode(comment) {
	this.comment = comment;
}

CommentNode.prototype.clone = function() {
	return new CommentNode(this.comment);
};

CommentNode.prototype.addToOutput = function(output, indent) {
	output.push('<!--' + this.comment.replace('-->', '--&gt;') + '-->');
};

function replaceXmlEntities(text) {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parse(xmlText) {
	// Tree
	const root = new Node(null);
	const stack = [root];

	function addChildNode(child) {
		const top = stack[stack.length - 1];
		top.children.push(child);
	}

	function pushNode(child) {
		const top = stack[stack.length - 1];
		top.children.push(child);
		stack.push(child);
	}

	function popNode(tag) {
		if (stack.length < 2) return;
		const top = stack[stack.length - 1];
		if (top.tag == tag) stack.pop();
	}

	// Parse
	const p = new Parser(xmlText);
	while (! p.isAtEnd()) {
		text();
		node();
	}

	return root;

	function text() {
		let text = '';
		while (! p.isAtEnd() && p.char != '<') {
			if (p.char == '&') text += readAmpersand();
			else text += p.char;
			p.next();
		}

		if (text) addChildNode(new TextNode(text));
	}

	function node() {
		if (p.char != '<') return;
		p.next();

		if (p.char == '/') return closingNode();
		if (p.read('!--')) return commentNode();
		if (p.read('![CDATA[')) return cDataNode();

		const tag = p.readAll((char, charCode) => char != '>' && ! p.isWhitespace(char, charCode));
		const node = new Node(tag);

		let closed = tag.startsWith('?');
		while (! p.isAtEnd()) {
			p.skipAll(p.isWhitespace);

			if (p.char == '>') {
				p.next();
				break;
			}

			if (p.char == '/') {
				p.next();
				closed = true;
				continue;
			}

			if (p.char == '?') {
				p.next();
				continue;
			}

			const key = p.readAll((char, charCode) => char != '>' && char != '=' && ! p.isWhitespace(char, charCode));
			p.skipAll(p.isWhitespace);
			const value = p.char == '=' ? attributeValue() : true;
			node.attributes.set(key, value);
		}

		if (closed) addChildNode(node);
		else pushNode(node);
	}

	function cDataNode() {
		let text = '';
		while (! p.isAtEnd()) {
			if (p.read(']]>')) break;
			text += p.char;
			p.next();
		}

		addChildNode(new CDataNode(text));
	}

	function commentNode() {
		let text = '';
		while (! p.isAtEnd()) {
			if (p.read('-->')) break;
			text += p.char;
			p.next();
		}

		addChildNode(new CommentNode(text));
	}

	function closingNode() {
		p.next();
		const tag = p.readAll((char, charCode) => char != '>' && ! p.isWhitespace(char, charCode));
		p.skipAll((char, charCode) => char != '>');
		p.next();
		popNode(tag);
	}

	function attributeValue() {
		p.skipAll((char, charCode) => char == '=' || p.isWhitespace(char, charCode));
		if (p.char == '"' || p.char == '\'') return quoted();
		return unquoted();

		function quoted() {
			const endQuote = p.char;
			p.next();

			let text = '';
			while (! p.isAtEnd()) {
				if (p.char == endQuote) break;
				if (p.char == '&') text += readAmpersand();
				else text += p.char;
				p.next();
			}

			p.next();
			return text;
		}

		function unquoted() {
			let text = '';
			while (! p.isAtEnd()) {
				if (p.isWhitespace(p.char, p.charCode)) break;
				if (p.char == '&') text += readAmpersand();
				else text += p.char;
				p.next();
			}

			return text;
		}
	}

	function readAmpersand() {
		p.next();
		const name = p.readAll(p.isLetter);
		if (p.char == ';') p.next();
		return String.fromCodePoint(ENTITIES[name]);
	}
}

function Parser(text) {
	const p = this;

	// State
	let lineNumber = 1;
	let lineStart = 0;
	let position = 0;
	updateChar();

	function updateChar() {
		if (position < text.length) {
			p.char = text.substr(position, 1);
			p.charCode = p.char.charCodeAt(0);
		} else {
			p.char = '';
			p.charCode = -1;
		}
	}

	p.getState = function() {
		return {lineNumber, lineStart, position};
	};

	p.setState = function(state) {
		lineNumber = state.lineNumber;
		lineStart = state.lineStart;
		position = state.position;
		updateChar();
	};

	p.getPosition = function() { return position; }
	p.substr = function(start, length) { return text.substr(start, length); }
	p.charAt = function(position) { return text.substr(position, 1); };
	p.charCodeAt = function(position) { return text.charCodeAt(position); };

	// Moving forward

	p.next = function() {
		if (p.char == '\n') {
			lineNumber += 1;
			lineStart = position + 1;
		}

		position += 1;
		updateChar();
	};

	p.isAtEnd = function() {
		return position >= text.length;
	};

	// Parser functions

	p.readAll = function(constraint) {
		const start = position;
		while (! p.isAtEnd() && constraint(p.char, p.charCode)) p.next();
		return text.substr(start, position - start);
	};

	p.skipAll = function(constraint) {
		while (! p.isAtEnd() && constraint(p.char, p.charCode)) p.next();
	};

	p.readOne = function(constraint) {
		if (p.isAtEnd()) return;
		if (! constraint(p.char, p.charCode)) return;
		const result = p.char;
		p.next();
		return result;
	};

	p.skipOne = function(constraint) {
		if (p.isAtEnd()) return;
		if (! constraint(p.char, p.charCode)) return;
		p.next();
		return true;
	};

	p.read = function(expected) {
		if (! p.continuesWith(expected)) return false;
		for (let count = expected.length; count > 0; count--) p.next();
		return true;
	};

	p.continuesWith = function(expected) {
		return text.substr(position, expected.length) == expected;
	};

	// Classifiers

	p.isDigit = function(char, charCode) { return char >= '0' && char <= '9'; };
	p.isLowercaseLetter = function(char, charCode) { return char >= 'a' && char <= 'z'; };
	p.isUppercaseLetter = function(char, charCode) { return char >= 'A' && char <= 'Z'; };
	p.isLetter = function(char, charCode) { return p.isLowercaseLetter(char, charCode) || p.isUppercaseLetter(char, charCode); };
	p.isLineWhitespace = function(char, charCode) { return charCode == 9 || charCode == 32; };
	p.isWhitespace = function(char, charCode) { return charCode == 9 || charCode == 10 || charCode == 13 || charCode == 32; };
	p.isLineBreak = function(char, charCode) { return charCode == 10 || charCode == 13; };
	p.not = function(f) { return function(char, charCode) { return ! f(char, charCode); }; };
	p.or = function(a, b) { return function(char, charCode) { return a(char, charCode) || b(char, charCode); }; };
	p.and = function(a, b) { return function(char, charCode) { return a(char, charCode) && b(char, charCode); }; };

	// Error handling

	p.throwError = function(message) {
		throw new ParseError(text, lineNumber, lineStart, position, message);
	};

	p.throwErrorAt = function(state, message) {
		throw new ParseError(text, state.lineNumber, state.lineStart, state.position, message);
	};

	function ParseError(text, lineNumber, lineStart, position, description) {
		this.name = 'ParseError';
		this.lineNumber = lineNumber;
		this.lineStart = lineStart;
		this.position = position;

		let arrow = '^';
		let start = position;
		while (start > 0 && start > position - 30 && text.charCodeAt(start - 1) != 10) {
			start -= 1;
			arrow = ' ' + arrow;
		}

		let end = position;
		if (text.charCodeAt(end) != 10)
			while (end < text.length - 1 && end < position + 10 && text.charCodeAt(end + 1) != 10)
				end += 1;

		this.context = text.substr(start, end - start);
		this.arrow = arrow;
		this.description = description;
		this.message = 'Line ' + lineNumber + ', char ' + (position - lineStart) + ': ' + description + '\n' + this.context + '\n' + arrow;
		this.valueOf = function() { return this.message; };
	}
}

const ENTITIES = {
	'amp': 38,
	'gt': 62,
	'lt': 60,
	'quot': 34,
	'apos': 39,
	'AElig': 198,
	'Aacute': 193,
	'Acirc': 194,
	'Agrave': 192,
	'Aring': 197,
	'Atilde': 195,
	'Auml': 196,
	'Ccedil': 199,
	'ETH': 208,
	'Eacute': 201,
	'Ecirc': 202,
	'Egrave': 200,
	'Euml': 203,
	'Iacute': 205,
	'Icirc': 206,
	'Igrave': 204,
	'Iuml': 207,
	'Ntilde': 209,
	'Oacute': 211,
	'Ocirc': 212,
	'Ograve': 210,
	'Oslash': 216,
	'Otilde': 213,
	'Ouml': 214,
	'THORN': 222,
	'Uacute': 218,
	'Ucirc': 219,
	'Ugrave': 217,
	'Uuml': 220,
	'Yacute': 221,
	'aacute': 225,
	'acirc': 226,
	'aelig': 230,
	'agrave': 224,
	'aring': 229,
	'atilde': 227,
	'auml': 228,
	'ccedil': 231,
	'eacute': 233,
	'ecirc': 234,
	'egrave': 232,
	'eth': 240,
	'euml': 235,
	'iacute': 237,
	'icirc': 238,
	'igrave': 236,
	'iuml': 239,
	'ntilde': 241,
	'oacute': 243,
	'ocirc': 244,
	'ograve': 242,
	'oslash': 248,
	'otilde': 245,
	'ouml': 246,
	'szlig': 223,
	'thorn': 254,
	'uacute': 250,
	'ucirc': 251,
	'ugrave': 249,
	'uuml': 252,
	'yacute': 253,
	'yuml': 255,
	'copy': 169,
	'reg': 174,
	'nbsp': 160,
	'iexcl': 161,
	'cent': 162,
	'pound': 163,
	'curren': 164,
	'yen': 165,
	'brvbar': 166,
	'sect': 167,
	'uml': 168,
	'ordf': 170,
	'laquo': 171,
	'not': 172,
	'shy': 173,
	'macr': 175,
	'deg': 176,
	'plusmn': 177,
	'sup1': 185,
	'sup2': 178,
	'sup3': 179,
	'acute': 180,
	'micro': 181,
	'para': 182,
	'middot': 183,
	'cedil': 184,
	'ordm': 186,
	'raquo': 187,
	'frac14': 188,
	'frac12': 189,
	'frac34': 190,
	'iquest': 191,
	'times': 215,
	'divide': 247,
	'OElig': 338,
	'oelig': 339,
	'Scaron': 352,
	'scaron': 353,
	'Yuml': 376,
	'fnof': 402,
	'circ': 710,
	'tilde': 732,
	'Alpha': 913,
	'Beta': 914,
	'Gamma': 915,
	'Delta': 916,
	'Epsilon': 917,
	'Zeta': 918,
	'Eta': 919,
	'Theta': 920,
	'Iota': 921,
	'Kappa': 922,
	'Lambda': 923,
	'Mu': 924,
	'Nu': 925,
	'Xi': 926,
	'Omicron': 927,
	'Pi': 928,
	'Rho': 929,
	'Sigma': 931,
	'Tau': 932,
	'Upsilon': 933,
	'Phi': 934,
	'Chi': 935,
	'Psi': 936,
	'Omega': 937,
	'alpha': 945,
	'beta': 946,
	'gamma': 947,
	'delta': 948,
	'epsilon': 949,
	'zeta': 950,
	'eta': 951,
	'theta': 952,
	'iota': 953,
	'kappa': 954,
	'lambda': 955,
	'mu': 956,
	'nu': 957,
	'xi': 958,
	'omicron': 959,
	'pi': 960,
	'rho': 961,
	'sigmaf': 962,
	'sigma': 963,
	'tau': 964,
	'upsilon': 965,
	'phi': 966,
	'chi': 967,
	'psi': 968,
	'omega': 969,
	'thetasym': 977,
	'upsih': 978,
	'piv': 982,
	'ensp': 8194,
	'emsp': 8195,
	'thinsp': 8201,
	'zwnj': 8204,
	'zwj': 8205,
	'lrm': 8206,
	'rlm': 8207,
	'ndash': 8211,
	'mdash': 8212,
	'lsquo': 8216,
	'rsquo': 8217,
	'sbquo': 8218,
	'ldquo': 8220,
	'rdquo': 8221,
	'bdquo': 8222,
	'dagger': 8224,
	'Dagger': 8225,
	'bull': 8226,
	'hellip': 8230,
	'permil': 8240,
	'prime': 8242,
	'Prime': 8243,
	'lsaquo': 8249,
	'rsaquo': 8250,
	'oline': 8254,
	'frasl': 8260,
	'euro': 8364,
	'image': 8465,
	'weierp': 8472,
	'real': 8476,
	'trade': 8482,
	'alefsym': 8501,
	'larr': 8592,
	'uarr': 8593,
	'rarr': 8594,
	'darr': 8595,
	'harr': 8596,
	'crarr': 8629,
	'lArr': 8656,
	'uArr': 8657,
	'rArr': 8658,
	'dArr': 8659,
	'hArr': 8660,
	'forall': 8704,
	'part': 8706,
	'exist': 8707,
	'empty': 8709,
	'nabla': 8711,
	'isin': 8712,
	'notin': 8713,
	'ni': 8715,
	'prod': 8719,
	'sum': 8721,
	'minus': 8722,
	'lowast': 8727,
	'radic': 8730,
	'prop': 8733,
	'infin': 8734,
	'ang': 8736,
	'and': 8743,
	'or': 8744,
	'cap': 8745,
	'cup': 8746,
	'int': 8747,
	'there4': 8756,
	'sim': 8764,
	'cong': 8773,
	'asymp': 8776,
	'ne': 8800,
	'equiv': 8801,
	'le': 8804,
	'ge': 8805,
	'sub': 8834,
	'sup': 8835,
	'nsub': 8836,
	'sube': 8838,
	'supe': 8839,
	'oplus': 8853,
	'otimes': 8855,
	'perp': 8869,
	'sdot': 8901,
	'lceil': 8968,
	'rceil': 8969,
	'lfloor': 8970,
	'rfloor': 8971,
	'lang': 9001,
	'rang': 9002,
	'loz': 9674,
	'spades': 9824,
	'clubs': 9827,
	'hearts': 9829,
	'diams': 9830
	};

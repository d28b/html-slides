function Matrix4(elements) {
	this.elements = elements;
}

Matrix4.createIdentity = function() {
	return new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

Matrix4.createRotationX = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new Matrix4([
		1, 0, 0, 0,
		0, c, -s, 0,
		0, s, c, 0,
		0, 0, 0, 1
		]);
};

Matrix4.createRotationY = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new Matrix4([
		c, 0, s, 0,
		0, 1, 0, 0,
		-s, 0, c, 0,
		0, 0, 0, 1
		]);
};

Matrix4.createRotationZ = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new Matrix4([
		c, -s, 0, 0,
		s, c, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
		]);
};

Matrix4.createTranslation = function(v) {
	return new Matrix4([
		1, 0, 0, v[0],
		0, 1, 0, v[1],
		0, 0, 1, v[2],
		0, 0, 0, 1
		]);
};

Matrix4.prototype.e = function(x, y) {
	return this.elements[y * 4 + x];
};

Matrix4.prototype.row = function(y) {
	return this.elements.slice(y * 4, y * 4 + 4);
};

Matrix4.prototype.column = function(x) {
	return [this.elements[x], this.elements[4 + x], this.elements[8 + x], this.elements[12 + x]];
};

Matrix4.prototype.diagonal = function() {
	return [this.elements[0], this.elements[5], this.elements[10], this.elements[15]];
};

Matrix4.prototype.equals = function(that, precision) {
	if (! precision) precision = 0;
	for (var i = 0; i < 16; i++)
		if (Math.abs(this.elements[i] - that.elements[i]) > precision)
			return false;
	return true;
};

Matrix4.prototype.clone = function() {
	var elements = Array.from(this.elements);
	return new Matrix4(elements);
};

Matrix4.prototype.times = function(matrix) {
	var result = new Array(16);
	for (var y = 0; y < 4; y++) {
		for (var x = 0; x < 4; x++) {
			var i = y * 4 + x;
			result[i] = 0;
			for (var n = 0; n < 4; n++)
				result[i] += this.elements[y * 4 + n] * matrix.elements[(n * 4) + x];
		}
	}
	return new Matrix4(result);
};

Matrix4.prototype.timesVector = function(a) {
	var result = new Array(4);
	for (var i = 0; i < 4; i++) {
		result[i] = 0;
		for (var n = 0; n < 4; n++)
			result[i] += this.elements[i * 4 + n] * a[n];
	}
	return result;
};

Matrix4.prototype.vectorTimes = function(a) {
	var result = new Array(4);
	for (var i = 0; i < 4; i++) {
		result[i] = 0;
		for (var n = 0; n < 4; n++)
			result[i] += a[n] * this.elements[(n * 4) + i];
	}
	return result;
};

Matrix4.prototype.transposed = function() {
	var result = new Array(16);
	for (var y = 0; y < 4; y++)
		for (var x = 0; x < 4; x++)
			result[y * 4 + x] = this.elements[x * 4 + y];
	return new Matrix4(result);
};

Matrix4.prototype.inversed = function() {
	// Set inverse to the identity matrix
	var current = this.clone();
	var inverse = Matrix4.createIdentity();

	// Gaussian elimination (part 1)
	for (var i = 0; i < 4; i++) {
		// Get the diagonal term
		var d = current.elements[i * 4 + i];

		// If it is 0, there must be at least one row with a non-zero element (otherwise, the matrix is not invertible)
		if (d == 0) {
			var r = i + 1;
			while (r < 4 && current.elements[r * 4 + i] == 0) r++;
			if (r == 4) return null;  // i is the rank
			for (var c = 0; c < 4; c++) {
				current.elements[i * 4 + c] += current.elements[r * 4 + c];
				inverse.elements[i * 4 + c] += inverse.elements[r * 4 + c];
			}
			d = current.elements[i * 4 + i];
		}

		// Divide the row by the diagonal term
		var inv = 1 / d;
		for (var c = 0; c < 4; c++) {
			current.elements[i * 4 + c] *= inv;
			inverse.elements[i * 4 + c] *= inv;
		}

		// Divide all subsequent rows with a non-zero coefficient, and subtract the row
		for (var r = i + 1; r < 4; r++) {
			var p = current.elements[r * 4 + i];
			if (p != 0) {
				for (var c = 0; c < 4; c++) {
					current.elements[r * 4 + c] -= current.elements[i * 4 + c] * p;
					inverse.elements[r * 4 + c] -= inverse.elements[i * 4 + c] * p;
				}
			}
		}
	}

	// Gaussian elimination (part 2)
	for (var i = 4 - 1; i >= 0; i--) {
		for (var r = 0; r < i; r++) {
			var d = current.elements[r * 4 + i];
			for (var c = 0; c < 4; c++) {
				current.elements[r * 4 + c] -= current.elements[i * 4 + c] * d;
				inverse.elements[r * 4 + c] -= inverse.elements[i * 4 + c] * d;
			}
		}
	}

	return inverse;
};

Matrix4.prototype.toString = function() {
	var i = 0;
	var text = '';
	for (var y = 0; y < 4; y++) {
		for (var x = 0; x < 4; x++) {
			text += digits4(this.elements[i]) + ' ';
			i++;
		}
		if (y < 3) text += '\n';
	}

	return text;

	function digits4(value) {
		var neg = t < 0;
		var t = '' + Math.round((neg ? -value : value) * 10000);
		while (t.length < 5) t = '0' + t;
		t = (neg ? '-' : '') + t.substr(0, t.length - 4) + '.' + t.substr(t.length -4);
		while (t.length < 8) t = ' ' + t;
		return t;
	}
};

Matrix4.toString = function(matrices) {
	var text = '';
	for (var y = 0; y < 4; y++) {
		for (var n = 0; n < matrices.length; n++) {
			var matrix = matrices[n];
			for (var x = 0; x < 4; x++)
				text += digits4(matrix.elements[y * 4 +x]) + ' ';
			if (n < matrices.length - 1) text += ' | ';
		}
		if (y < 3) text += '\n';
	}

	return text;

	function digits4(value) {
		var neg = value < 0;
		var t = '' + Math.round((neg ? -value : value) * 10000);
		while (t.length < 5) t = '0' + t;
		t = (neg ? '-' : '') + t.substr(0, t.length - 4) + '.' + t.substr(t.length -4);
		while (t.length < 8) t = ' ' + t;
		return t;
	}
};

Matrix4.prototype.determinant = function() {
	var m = this;
	return m.elements[0] * det3(1, 2, 3)
		 - m.elements[1] * det3(0, 2, 3)
		 + m.elements[2] * det3(0, 1, 3)
		 - m.elements[3] * det3(0, 1, 2);

	function det3(x0, x1, x2) {
		return m.elements[4 + x0] * det2(x1, x2)
			 - m.elements[4 + x1] * det2(x0, x2)
			 + m.elements[4 + x2] * det2(x0, x1);
	}

	function det2(x0, x1) {
		return m.elements[8 + x0] * m.elements[12 + x1]
			 - m.elements[8 + x1] * m.elements[12 + x0];
	}
};

Matrix4.prototype.translated = function(v) {
	return Matrix4.createTranslation(v).times(this);
};

Matrix4.prototype.rotatedX = function(a) {
	return Matrix4.createRotationX(a).times(this);
};

Matrix4.prototype.rotatedY = function(a) {
	return Matrix4.createRotationY(a).times(this);
};

Matrix4.prototype.rotatedZ = function(a) {
	return Matrix4.createRotationZ(a).times(this);
};

// Float32Array in column-major order
Matrix4.prototype.toGlArray = function() {
	return new Float32Array([
		this.elements[0], this.elements[4], this.elements[8], this.elements[12],
		this.elements[1], this.elements[5], this.elements[9], this.elements[13],
		this.elements[2], this.elements[6], this.elements[10], this.elements[14],
		this.elements[3], this.elements[7], this.elements[11], this.elements[15]
		]);
};

var Identity4 = Matrix4.createIdentity();

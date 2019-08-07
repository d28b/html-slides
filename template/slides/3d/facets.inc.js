// Shape generation

function createRotationXExtrudedFacets(points, steps) {
	var facets = new Float32Array(steps * points.length * 2 * 9);
	var w = 0;

	for (var i = 0; i < points.length; i++) {
		var point = points[i];
		var nextPoint = i + 1 == points.length ? points[0] : points[i + 1];
		addRing(point, nextPoint);
	}

	function addRing(point0, point1) {
		for (var i = 0; i < steps; i++) {
			var a0 = (360 / steps * i) / 180 * Math.PI;
			var c0 = Math.cos(a0);
			var s0 = Math.sin(a0);

			var a1 = (360 / steps * (i + 1)) / 180 * Math.PI;
			var c1 = Math.cos(a1);
			var s1 = Math.sin(a1);

			// Rings
			add(point0.x, point0.y * c0, point0.y * s0);
			add(point0.x, point0.y * c1, point0.y * s1);
			add(point1.x, point1.y * c0, point1.y * s0);

			add(point1.x, point1.y * c0, point1.y * s0);
			add(point0.x, point0.y * c1, point0.y * s1);
			add(point1.x, point1.y * c1, point1.y * s1);
		}
	}

	function add(x, y, z) {
		facets[w++] = x;
		facets[w++] = y;
		facets[w++] = z;
	}

	return facets;
}

// Calculating surface normals

function normalsFromFacets(facets) {
	var normals = new Float32Array(facets.length);
	for (var i = 0; i < facets.length; i += 9) {
		var vx = facets[i + 3] - facets[i + 0];
		var vy = facets[i + 4] - facets[i + 1];
		var vz = facets[i + 5] - facets[i + 2];
		var wx = facets[i + 6] - facets[i + 0];
		var wy = facets[i + 7] - facets[i + 1];
		var wz = facets[i + 8] - facets[i + 2];
		var nx = (vy * wz) - (vz * wy);
		var ny = (vz * wx) - (vx * wz);
		var nz = (vx * wy) - (vy * wx);
		var d = Math.sqrt(nx * nx + ny * ny + nz * nz);
		nx /= d;
		ny /= d;
		nz /= d;
		normals[i + 0] = nx;
		normals[i + 1] = ny;
		normals[i + 2] = nz;
		normals[i + 3] = nx;
		normals[i + 4] = ny;
		normals[i + 5] = nz;
		normals[i + 6] = nx;
		normals[i + 7] = ny;
		normals[i + 8] = nz;
	}

	return normals;
}

// Facet reversal

function reverseFacetsInPlace(facets) {
	for (var i = 0; i < facets.length; i += 9)
		swap(i + 3, i + 6);

	function swap(i0, i1) {
		var x = facets[i0 + 0];
		var y = facets[i0 + 1];
		var z = facets[i0 + 2];
		facets[i0 + 0] = facets[i1 + 0];
		facets[i0 + 1] = facets[i1 + 1];
		facets[i0 + 2] = facets[i1 + 2];
		facets[i1 + 0] = x;
		facets[i1 + 1] = y;
		facets[i1 + 2] = z;
	}
}

// Affine transformations

function transformFacets(facets, matrix) {
	var newFacets = new Float32Array(facets.length);
	for (var i = 0; i < facets.length; i += 3) {
		var x = facets[i + 0];
		var y = facets[i + 1];
		var z = facets[i + 2];
		newFacets[i + 0] = x * matrix.elements[0] + y * matrix.elements[1] + z * matrix.elements[2] + matrix.elements[3];
		newFacets[i + 1] = x * matrix.elements[4] + y * matrix.elements[5] + z * matrix.elements[6] + matrix.elements[7];
		newFacets[i + 2] = x * matrix.elements[8] + y * matrix.elements[9] + z * matrix.elements[10] + matrix.elements[11];
	}
	return newFacets;
}

function transformFacetsInPlace(facets, matrix) {
	for (var i = 0; i < facets.length; i += 3) {
		var x = facets[i + 0];
		var y = facets[i + 1];
		var z = facets[i + 2];
		facets[i + 0] = x * matrix.elements[0] + y * matrix.elements[1] + z * matrix.elements[2] + matrix.elements[3];
		facets[i + 1] = x * matrix.elements[4] + y * matrix.elements[5] + z * matrix.elements[6] + matrix.elements[7];
		facets[i + 2] = x * matrix.elements[8] + y * matrix.elements[9] + z * matrix.elements[10] + matrix.elements[11];
	}
}

// Loading from STL
function facetsFromBinarySTL(bytes) {
	var dv = new DataView(bytes);

	var count = dv.getInt32(80, true);
	if (84 + count * 50 > bytes.byteLength) {
		console.log('STL file with invalid facet count.');
		return;
	}

	var facets = new Float32Array(count * 9);
	var w = 0;

	for (var i = 84; i < dv.byteLength; i += 50)
		for (var n = 12; n < 48; n += 4)
			facets[w++] = dv.getFloat32(i + n, true);

	return facets;
}

// Saving to STL
function binarySTLFromFacets(facets, normals) {
	if (! normals) normals = normalsFromFacets(facets);

	var count = facets.length;
	var countFacets = Math.floor(count / 9);
	var buffer = new ArrayBuffer(84 + countFacets * 50);
	var dv = new DataView(buffer);

	dv.setInt32(80, countFacets, true);
	var w = 84;

	function add(value) {
		dv.setFloat32(w, value, true);
		w += 4;
	}

	for (var i = 0; i < count; i += 9) {
		// Normal
		for (var n = 0; n < 3; n++)
			add(normals[i + n]);

		// Vertices
		for (var n = 0; n < 9; n++)
			add(facets[i + n]);

		// Attribute
		w += 2;
	}

	return new Blob([new Uint8Array(buffer)], {type: 'binary/octet-stream'});
}

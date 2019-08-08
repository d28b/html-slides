function GlDisplay(canvas) {
	var display = this;
	this.canvas = canvas;
	var gl = canvas.getContext('webgl');
	if (! gl) return;
	this.gl = gl;

	// Initialization
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	// Shader
	var vertexShader =
		'attribute highp vec3 aVertexPosition;' +
		'attribute highp vec3 aVertexNormal;' +

		'uniform highp mat4 uNormalMatrix;' +
		'uniform mat4 uMVMatrix;' +
		'uniform mat4 uPMatrix;' +

		'varying highp vec3 vLighting;' +

		'void main(void) {' +
		'	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);' +

		'	highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);' +
		'	highp vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);' +
		'	highp vec3 directionalVector = vec3(-0.3, 0.6, 0.8);' +

		'	highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
		'	highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);' +
		'	vLighting = ambientLight + (directionalLightColor * directional);' +
		'}';

	var fragmentShader =
		'uniform highp vec4 uFrontColor;' +
		'uniform highp vec4 uBackColor;' +
		'varying highp vec3 vLighting;' +

		'void main(void) {' +
		'	highp vec4 color = gl_FrontFacing ? uFrontColor : uBackColor;' +
		'	gl_FragColor = vec4(color.rgb * vLighting, color.a);' +
		'}';

	var shaderProgram = gl.createProgram();
	addShader(gl.VERTEX_SHADER, vertexShader);
	addShader(gl.FRAGMENT_SHADER, fragmentShader);

	function addShader(type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		gl.attachShader(shaderProgram, shader);
	}

	gl.linkProgram(shaderProgram);
	if (! gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
		console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
	gl.useProgram(shaderProgram);

	var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
	gl.enableVertexAttribArray(vertexPositionAttribute);
	var vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
	gl.enableVertexAttribArray(vertexNormalAttribute);

	// View
	var perspectiveMatrix = createPerspectiveMatrix(25, canvas.width / canvas.height, 0.1, 1000.0);
	this.matrix = Matrix4.createTranslation([0.0, 0.0, -100.0]);

	// Objects
	var objects = [];

	this.addObject = function(obj) {
		obj.display = display;
		if (! obj.facets) return;

		obj.facetsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.facetsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.facets, gl.STATIC_DRAW);

		obj.normalsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);

		objects.push(obj);
		for (var i = 0; i < obj.onAdded.length; i++) obj.onAdded[i](obj);
	};

	this.removeObject = function(obj) {
		obj.display = null;
		if (! obj.facetsBuffer) return;

		for (var i = 0; i < obj.onRemoved.length; i++) obj.onRemoved[i](obj);
		gl.deleteBuffer(obj.facetsBuffer);
		gl.deleteBuffer(obj.normalsBuffer);
		obj.facetsBuffer = null;
		obj.normalsBuffer = null
		var index = objects.indexOf(obj);
		if (index < 0) return;
		objects.splice(index, 1);
	};

	// Drawing
	this.redraw = redraw;

	function redraw() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		if (objects.length <= 0) return;

		// Configure the shader
		var uPMatrix = gl.getUniformLocation(shaderProgram, 'uPMatrix');
		gl.uniformMatrix4fv(uPMatrix, false, perspectiveMatrix.toGlArray());

		var uMVMatrix = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
		var uNormalMatrix = gl.getUniformLocation(shaderProgram, 'uNormalMatrix');
		var uFrontColor = gl.getUniformLocation(shaderProgram, 'uFrontColor');
		var uBackColor = gl.getUniformLocation(shaderProgram, 'uBackColor');

		// Draw objects
		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			if (! obj.visible) continue;

			var matrix = this.matrix.times(obj.matrix);

			gl.uniform4fv(uFrontColor, obj.frontColor);
			gl.uniform4fv(uBackColor, obj.backColor);
			gl.uniformMatrix4fv(uMVMatrix, false, matrix.toGlArray());
			gl.uniformMatrix4fv(uNormalMatrix, false, matrix.inversed().transposed().toGlArray());
			//gl.uniformMatrix4fv(uNormalMatrix, false, matrix.transposed().toGlArray());

			gl.bindBuffer(gl.ARRAY_BUFFER, obj.facetsBuffer);
			gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalsBuffer);
			gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.drawArrays(gl.TRIANGLES, 0, obj.count);
		}
	}
}

function GlObject(matrix, frontColor, backColor) {
	this.facets = null;
	this.normals = null;
	this.count = 0;
	this.frontColor = new Float32Array(frontColor);
	this.backColor = new Float32Array(backColor);
	this.matrix = matrix;
	this.onAdded = [];
	this.onRemoved = [];
	this.visible = true;
	this.display = null;

	this.setFacets = function(facets) {
		var display = this.display;
		if (display) display.removeObject(this);
		this.facets = facets;
		this.normals = normalsFromFacets(facets);
		this.count = facets.length / 3;
		if (display) display.addObject(this);
	};
}

// View matrices

function createPerspectiveMatrix(fovy, aspect, znear, zfar) {
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return createFrustumMatrix(xmin, xmax, ymin, ymax, znear, zfar);
}

function createFrustumMatrix(left, right, bottom, top, znear, zfar) {
    var X = 2 * znear / (right - left);
    var Y = 2 * znear / (top - bottom);
    var A = (right + left) / (right - left);
    var B = (top + bottom) / (top - bottom);
    var C = -(zfar + znear) / (zfar - znear);
    var D = -2 * zfar * znear / (zfar - znear);

    return new Matrix4([
		X, 0, A, 0,
		0, Y, B, 0,
		0, 0, C, D,
		0, 0, -1, 0
		]);
}

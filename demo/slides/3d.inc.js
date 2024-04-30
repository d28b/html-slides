<?
include('3d/matrix4.inc.js');
include('3d/facets.inc.js');
include('3d/glDisplay.inc.js');
?>

// Scene

var display = new GlDisplay(document.getElementById('3dCanvas'));

function addObject(color, matrix) {
	var object = new GlObject(Identity4, color, [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5, color[3]]);
	object.matrix = matrix;
	display.addObject(object);
	return object;
}

var black = [0.2, 0.2, 0.2, 1.0];
var gray = [0.9, 0.9, 0.9, 1.0];
var blue = [0.0, 0.3, 1.0, 1.0];
var violet = [0.6, 0.0, 0.75, 1.0];
var green = [0.0, 0.75, 0.0, 1.0];

var zZero = -40;
var stand = addObject(black, z(56));
var middle = addObject(green, z(6));
var middleInside = addObject(black, z(6));
var cover = addObject(gray, zFlipped(6));
loadStl('slides/3d/cover.stl', [cover, stand]);
loadStl('slides/3d/special.stl', [middle]);
loadStl('slides/3d/specialInside.stl', [middleInside]);

function z(height) { return Matrix4.createTranslation([0, 0, zZero + height]); }
function zFlipped(height) { return Matrix4.createRotationX(Math.PI).translated([0, 0, zZero + height]); }

function loadStl(url, objects) {
	var request = new XMLHttpRequest();
	request.onload = function() {
		if (request.status != 200) return;
		var facets = facetsFromBinarySTL(request.response);
		if (facets == null) return;

		for (var i = 0; i < objects.length; i++)
			objects[i].setFacets(facets);

		display.redraw();
	};
	request.open('GET', url);
	request.responseType = 'arraybuffer';
	request.send();
}

// Color selection

document.getElementById('3dBlue').onclick = function(event) {
	middle.frontColor = blue;
};

document.getElementById('3dViolet').onclick = function(event) {
	middle.frontColor = violet;
};

document.getElementById('3dGreen').onclick = function(event) {
	middle.frontColor = green;
};

// Animation

var running = false;
var shouldRun = false;
var angle = 3.4;

slide.onSlideAppears = function() {
	shouldRun = true;
	if (running) return;
	running = true;
	run();
};

slide.onSlideDisappears = function() {
	shouldRun = false;
};

function run() {
	if (! shouldRun) {
		running = false;
		return;
	}

	display.matrix = Matrix4.createRotationZ(angle).rotatedX(0.6 * Math.PI).translated([0.0, 0.0, -300.0]);
	display.redraw();
	angle += 0.008;
	if (angle > Math.PI * 2) angle -= Math.PI * 2;
	cover.matrix = zFlipped(6 - Math.max(0, Math.cos(angle) * 20));

	requestAnimationFrame(run);
}


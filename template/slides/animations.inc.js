var running = false;
var shouldRun = false;

var ball = new Ball(document.getElementById('animationBall'));
var floor = new Floor(document.getElementById('animationFloor'));

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

	ball.step();
	floor.step();
	requestAnimationFrame(run);
}

function Ball(element) {
	var x = Math.random() * 960;
	var y = Math.random() * 300;
	var dx = Math.random() * 10;
	var dy = Math.random() * 10;

	var hue = Math.random() * 360;
	updateColor();

	this.step = function() {
		dx *= 0.995;
		dy *= 0.995;
		dy -= 0.1;

		x += dx;
		y += dy;

		if (x < 0) {
			x = -x;
			dx = -dx;
		}

		if (x > 960) {
			x = 2 * 960 - x;
			dx = -dx;
		}

		if (y > 550) {
			y = 2 * 550 - y;
			dy = -dy;

			hue += 10 + Math.random() * 30;
			if (hue >= 360) hue -= 360;
			updateColor();
		}

		if (y < 0) {
			y = -y;
			dy = -dy - 0.2;
			dx *= 0.95;

			var factor = Math.random();
			dy += factor * 6;
			dx += (x - 500) * 0.05 * factor;
			floor.activate();
		}

		element.style.left = x + 'px';
		element.style.top = (550 - y) + 'px';
	};

	function updateColor() {
		element.style.background = 'hsl(' + hue + ', 80%, 50%)';
	}
}

function Floor(element) {
	var activated = 0.01;

	this.activate = function() {
		activated = 1;
	};

	this.step = function() {
		if (activated == 0) return;
		activated = Math.max(0, activated - 0.05);
		element.style.background = 'hsl(40, 30%, ' + (30 + activated * 20) + '%)';
	};
}

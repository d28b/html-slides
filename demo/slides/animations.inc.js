var svg = slide.getElementsByTagName('svg')[0];

slide.onSlideAppears = function() {
	svg.unpauseAnimations();
};

slide.onSlideDisappears = function() {
	svg.pauseAnimations();
};

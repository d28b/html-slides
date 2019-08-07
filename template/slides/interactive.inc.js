var input = document.getElementById('interactiveInput');
var output = document.getElementById('interactiveOutput');

input.oninput = function(event) {
	var text = input.value;

	var flipped = '';
	for (var i = text.length; i > 0; i--)
		flipped += text.substr(i - 1, 1);

	if (! flipped.length) flipped = '\u00a0';
	output.textContent = flipped;
};

slide.onSlideAppears = function() {
	input.selectionStart = 0;
	input.selectionEnd = input.value.length;
	input.oninput();
};

slide.onSlideDisappears = function() {
};

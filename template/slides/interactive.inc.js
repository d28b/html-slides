var input = document.getElementById('interactiveInput');
var output = document.getElementById('interactiveOutput');

input.oninput = function(event) {
	remote.sendState('interactiveText', input.value);
	updateFlipped();
};

slide.onSlideAppears = function() {
	remote.addStateListener(onStateChanged);
	input.selectionStart = 0;
	input.selectionEnd = input.value.length;
	input.oninput();
};

slide.onSlideDisappears = function() {
	remote.removeStateListener(onStateChanged);
};

function onStateChanged(state) {
	input.value = state.interactiveText || '';
	updateFlipped();
}

function updateFlipped() {
	var flipped = '';
	var text = input.value;
	for (var i = text.length; i > 0; i--)
		flipped += text.substr(i - 1, 1);

	if (! flipped.length) flipped = '\u00a0';
	output.textContent = flipped;
}

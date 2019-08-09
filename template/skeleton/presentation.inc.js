var main = document.getElementById('main');
var bottomSpacer = document.getElementById('bottomSpacer');
var focusedSince = 0;

document.body.onkeydown = function(event) {
	var inputFocused = document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA';
	var hasModifier = event.getModifierState('Control') || event.getModifierState('Alt') || event.getModifierState('OS') || event.getModifierState('Meta');

	if (indexHandleKey(event, inputFocused, hasModifier) || controller.handleKey(event, inputFocused, hasModifier)) {
		event.preventDefault();
		return;
	}
};

document.onfocus = function(event) {
	focusedSince = new Date().getTime();
	document.body.classList.add('focus');
};

document.onblur = function(event) {
	document.body.classList.remove('focus');
};

// Index and settings

var index = document.getElementById('index');
var indexContent = document.getElementById('indexContent');
var indexButton = document.getElementById('indexButton');

function isIndexOpen() {
	return document.body.classList.contains('openIndex');
}

function openIndex(open) {
	document.body.classList.toggle('openIndex', open);
}

indexButton.onclick = function(event) {
	event.preventDefault();
	event.stopPropagation();

	// Ignore the first click if the document just got focus
	if (focusedSince + 200 > new Date().getTime()) {
		focusedSince = 0;
		return;
	}

	openIndex(! isIndexOpen());
};

function indexHandleKey(event, inputFocused, hasModifier) {
	if (hasModifier) return;

	if (inputFocused && event.key == 'Escape') {
		document.activeElement.blur();
		return true;
	}

	if (document.activeElement.tagName == 'INPUT' && event.key == 'Enter') {
		document.activeElement.blur();
		return true;
	}

	if (event.key == 'Escape') {
		openIndex(! isIndexOpen());
		return true;
	}

	if (inputFocused) return;

	if (event.key == 'p') {
		setMode(controller.mode == 'presentation' ? 'normal' : 'presentation');
		return true;
	}

	return false;
}

function onIndexSlideClick(indexSlide) {
	var id = indexSlide.id;
	if (id.substr(0, 6) != 'index-') return;
	moveToSlideWithId(id.substr(6));
	openIndex(false);
}

// Remote

var remote = new Remote();

function Remote() {
	var remoteSend = document.getElementById('remoteSend');
	var remoteSendToken = document.getElementById('remoteSendToken');
	var remoteListen = document.getElementById('remoteListen');
	var remoteListenConfirm = document.getElementById('remoteListenConfirm');
	var remoteListenToken = document.getElementById('remoteListenToken');

	var role = 'start';
	var listenToken = localStorage.getItem('listen to token') || '';
	remoteListenToken.value = listenToken;

	var myToken = localStorage.getItem('my token');
	if (! myToken) {
		myToken = randomToken(6);
		localStorage.setItem('my token', myToken);
	}

	remoteSendToken.textContent = myToken;

	var myWriteKey = localStorage.getItem('my write key');
	if (! myWriteKey) {
		myWriteKey = randomToken(16);
		localStorage.setItem('my write key', myWriteKey);
	}

	remoteSend.onclick = function(event) {
		event.stopPropagation();
		setRole(role == 'send' ? '' : 'send');
	};

	remoteListen.onclick = function(event) {
		event.stopPropagation();
		setRole(role == 'listen' || role == 'edit token' ? '' : 'listen');
	};

	remoteListenToken.onclick = function(event) {
		event.stopPropagation();
	};

	remoteListenToken.onfocus = function(event) {
		setRole('listen');
	};

	remoteListenToken.oninput = function(event) {
		listenToken = remoteListenToken.value.trim();
		localStorage.setItem('listen to token', listenToken);
		setRole('listen');
	};

	remoteListenToken.onblur = function(event) {
		if (listenToken.length < 6) setRole('');
	};

	function setRole(newRole) {
		if (newRole == 'listen' && listenToken.length < 6) newRole = 'edit token';
		if (role == newRole) return;
		role = newRole;
		remoteSend.classList.toggle('selected', role == 'send');
		remoteListen.classList.toggle('selected', role == 'listen');
		remoteListen.classList.toggle('editToken', role == 'edit token');
		document.body.classList.toggle('remoteSend', role == 'send');
		document.body.classList.toggle('remoteListen', role == 'listen');

		if (role == 'send') {
			needsSubmission = true;
			submit();
		} else if (role == 'listen') {
			notifyListeners();
			read();
		} else if (role == 'edit token') {
			if (document.activeElement != remoteListenToken) {
				remoteListenToken.selectionStart = 0;
				remoteListenToken.selectionEnd = remoteListenToken.value.length;
				remoteListenToken.focus();
			}
		}

		if (role != 'edit token')
			localStorage.setItem('role', role);
	}

	function randomToken(len) {
		var token = '';
		for (var i = 0; i < len; i++) token += String.fromCharCode(97 + Math.floor(Math.random() * 26));
		return token;
	}

	// Sender

	var myState = {revision: 0};
	var needsSubmission = false;
	var isSubmitting = false;

	this.sendState = function(key, value) {
		if (myState[key] == value) return;
		myState.revision = new Date().getTime();
		myState[key] = value;
		localStorage.setItem('state', JSON.stringify(myState));
		needsSubmission = true;
		submit();
	};

	function submit() {
		if (isSubmitting) return;
		if (! needsSubmission) return;
		needsSubmission = false;
		if (role != 'send') return;

		isSubmitting = true;
		var request = new XMLHttpRequest();
		request.responseType = 'text';

		request.onload = function(event) {
			var success = request.status == 200 || request.status == 204;
			if (! success) return request.onerror(event);
			isSubmitting = false;
			setTimeout(submit, 20);
		};

		request.onerror = function(event) {
			isSubmitting = false;
			needsSubmission = true;
			setTimeout(submit, 1000);
		};

		request.open('PUT', 'https://viereck.ch/remote/' + myToken);
		request.setRequestHeader('Write-Key', myWriteKey);
		request.setRequestHeader('Revision', myState.revision);
		request.send(JSON.stringify(myState));
	}

	// Listener

	var isReading = false;
	var receivedState = {revision: 0, id: ''};

	function read() {
		if (isReading) return;
		if (! listenToken) return;
		if (role != 'listen') return;
		if (document.visibilityState == 'hidden') return;

		isReading = true;
		var request = new XMLHttpRequest();
		request.responseType = 'text';

		request.onload = function(event) {
			var success = request.status == 200 || request.status == 204;
			if (! success) return request.onerror(event);
			var revision = parseInt(request.getResponseHeader('revision')) || 0;
			process(revision, request.responseText);
			isReading = false;
			setTimeout(read, 1000);
		};

		request.onerror = function(event) {
			isReading = false;
			setTimeout(read, 1000);
		};

		request.open('GET', 'https://viereck.ch/remote/' + listenToken);
		request.setRequestHeader('When-Newer', receivedState.revision);
		request.send();
	}

	function process(revision, text) {
		if (revision <= receivedState.revision) return;

		var state = parseState(text);
		if (! state) return;

		state.revision = revision;
		receivedState = state;
		if (role != 'listen') return;
		notifyListeners();
	}

	window.onstorage = function(event) {
		console.log(event);
		if (event.key == 'state') return mergeState(event.newValue);
	};

	this.mergeLocalState = function() {
		mergeState(localStorage.getItem('state'));
	};

	function mergeState(text) {
		var state = parseState(text);
		if (! state) return;
		if (state.revision < receivedState.revision) return;
		receivedState = state;
		notifyListeners();
	}

	function parseState(text) {
		if (! text) return;
		try {
			var state = JSON.parse(text);
			if (state == null) return;
			if (typeof(state) != 'object') return;
			return state;
		} catch (ignore) {
			return;
		}
	}

	var stateListeners = [];

	this.addStateListener = function(handler) {
		stateListeners.push(handler);
		handler(receivedState);
	};

	this.removeStateListener = function(handler) {
		var index = stateListeners.indexOf(handler);
		if (index >= 0) stateListeners.splice(index, 1);
	};

	function notifyListeners() {
		for (var i = 0; i < stateListeners.length; i++)
			stateListeners[i](receivedState);
	}

	document.onvisibilitychange = function(event) {
		read();
	};

	// Start with the previously saved role
	setRole(localStorage.getItem('role'));
}

// Current slide

var currentSlide = main.firstElementChild;
setSlideSelected(true);

function moveToSlideWithId(id, source) {
	if (! id) return false;
	if (currentSlide.id == id) return;
	var slide = document.getElementById(id);
	if (! slide) return false;
	return moveToSlide(slide, source);
}

function moveToSlide(slide, source) {
	if (! slide) return false;
	if (currentSlide == slide) return;
	var previousSlide = currentSlide;
	setSlideSelected(false);
	currentSlide = slide;
	setSlideSelected(true);
	controller.onCurrentSlideChanged(source, previousSlide);
	remote.sendState('slide', slide.id);
	return true;
}

function setSlideSelected(selected) {
	// Slide
	currentSlide.classList.toggle('selected', selected);

	// Index slide
	var indexSlide = document.getElementById('index-' + currentSlide.id);
	if (indexSlide) indexSlide.classList.toggle('selected', selected);
}

remote.addStateListener(function(state) {
	moveToSlideWithId('' + state.slide, 'remote');
});

// Slide appearence

function setSlideVisibility(slide, isVisible) {
	if ((slide.isSlideVisible || false) == isVisible) return;
	slide.isSlideVisible = isVisible;
	setTimeout(updateRunning, 20);

	function updateRunning() {
		if (slide.isSlideVisible == (slide.isSlideRunning || false)) return;
		slide.isSlideRunning = slide.isSlideVisible;
		if (slide.isSlideRunning && slide.onSlideAppears) slide.onSlideAppears();
		if (! slide.isSlideRunning && slide.onSlideDisappears) slide.onSlideDisappears();
	}
}

// Controller

var presentationModeButton = document.getElementById('presentationModeButton');
var normalModeButton = document.getElementById('normalModeButton');

var controller = null;
setMode(localStorage.getItem('mode'));

presentationModeButton.onclick = function(event) {
	event.preventDefault();
	event.stopPropagation();
	setMode('presentation');
};

normalModeButton.onclick = function(event) {
	event.preventDefault();
	event.stopPropagation();
	setMode('normal');
}

window.onbeforeprint = function(event) {
	setMode('normal');
	openIndex(false);
};

function setMode(mode) {
	if (controller) {
		if (mode == controller.mode) return;
		controller.free();
	}

	localStorage.setItem('mode', mode);
	var isPresentation = mode == 'presentation';
	presentationModeButton.classList.toggle('selected', isPresentation);
	normalModeButton.classList.toggle('selected', ! isPresentation);
	document.body.classList.toggle('presentation', isPresentation);
	controller = isPresentation ? new PresentationMode() : new NormalMode();
	controller.onCurrentSlideChanged('mode');
}

// Normal mode

function NormalMode() {
	this.mode = 'normal';

	this.handleKey = function(event, inputFocused, hasModifier) {
		if (hasModifier) return;
		if (inputFocused) return;

		if (event.key == 'ArrowRight' || event.key == 'PageDown') {
			return moveToSlide(currentSlide.nextElementSibling);
		} else if (event.key == 'ArrowLeft' || event.key == 'PageUp') {
			return moveToSlide(currentSlide.previousElementSibling);
		}

		return false;
	};

	this.onCurrentSlideChanged = function(source) {
		if (source == 'scroll') return;
		var rect = currentSlide.getBoundingClientRect();
		window.scrollBy(0, rect.y - 20);
	};

	// Slide visibility
	var currentFirstVisible = null;
	var currentLastVisible = null;

	function updateVisibleSlides() {
		// Find the first visible slide
		var firstVisible = currentSlide;
		for (var slide = currentSlide.previousElementSibling; slide; slide = slide.previousElementSibling) {
			if (isVisible(slide)) firstVisible = slide;
			else break;
		}

		// Find the last visible slide
		var lastVisible = currentSlide;
		for (var slide = currentSlide.nextElementSibling; slide; slide = slide.nextElementSibling) {
			if (isVisible(slide)) lastVisible = slide;
			else break;
		}

		// Mark these slides as visible
		for (var slide = firstVisible; slide; slide = slide.nextElementSibling) {
			setSlideVisibility(slide, true);
			if (slide == currentFirstVisible) currentFirstVisible = null;
			if (slide == currentLastVisible) currentLastVisible = null;
			if (slide == lastVisible) break;
		}

		// Hide old slides from the beginning
		for (var slide = currentFirstVisible; slide; slide = slide.nextElementSibling) {
			if (slide == firstVisible) break;
			setSlideVisibility(slide, false);
			if (slide == currentLastVisible) { currentLastVisible = null; break; }
		}

		// Hide old slides from the end
		for (var slide = currentLastVisible; slide; slide = slide.previousElementSibling) {
			if (slide == lastVisible) break;
			setSlideVisibility(slide, false);
		}

		// Set the new visible slides
		currentFirstVisible = firstVisible;
		currentLastVisible = lastVisible;
	}

	function isVisible(slide) {
		var rect = slide.getBoundingClientRect();
		if (rect.bottom < -50) return false;
		if (rect.top > innerHeight + 50) return false;
		return true;
	}

	// Scrolling
	onscroll = function(event) {
		var slide = currentSlide;
		var rect = slide.getBoundingClientRect();

		// Move to next
		while (rect.top < -500) {
			slide = slide.nextElementSibling;
			if (slide == null) return;
			rect = slide.getBoundingClientRect();
		}

		// Move to previous
		while (rect.top > 500) {
			slide = slide.previousElementSibling;
			if (slide == null) return;
			rect = slide.getBoundingClientRect();
		}

		moveToSlide(slide, 'scroll');
		updateVisibleSlides();
	};

	// Resizing
	onresize = function(event) {
		var space = Math.round(innerHeight - 640);
		bottomSpacer.style.height = space + 'px';
		if (space < 180) {
			bottomSpacer.firstElementChild.style.display = 'none';
		} else {
			bottomSpacer.firstElementChild.style.display = '';
			bottomSpacer.firstElementChild.setAttribute('d', 'M 2,50 2,' + (space - 50));
		}

		updateVisibleSlides();
	};

	onresize();

	this.free = function() {
		onscroll = null;
		onresize = null;
	};
}

// Presentation mode

function PresentationMode() {
	this.mode = 'presentation';

	this.handleKey = function(event, inputFocused, hasModifier) {
		if (hasModifier) return;
		if (inputFocused) return;

		if (event.key == 'ArrowDown' || event.key == 'ArrowRight' || event.key == 'PageDown') {
			return moveToSlide(currentSlide.nextElementSibling);
		} else if (event.key == 'ArrowUp' || event.key == 'ArrowLeft' || event.key == 'PageUp') {
			return moveToSlide(currentSlide.previousElementSibling);
		}

		return false;
	};

	// Scaling to the maximum size
	var slideTransform = '';

	onresize = function(event) {
		var xScaling = innerWidth / 1000;
		var yScaling = innerHeight / 600;
		var scaling = Math.min(xScaling, yScaling);
		slideTransform = 'translate(-500px, -300px) translate(' + (innerWidth * 0.5) + 'px, ' + (innerHeight * 0.5) + 'px) scale(' + scaling + ')';
		currentSlide.style.transform = slideTransform;
	};

	onresize();

	this.onCurrentSlideChanged = function(source, previousSlide) {
		if (previousSlide) setSlideVisibility(previousSlide, false);
		setSlideVisibility(currentSlide, true);
		currentSlide.style.transform = slideTransform;
	}

	// Touch
	var currentTouch = null;

	document.body.ontouchstart = function(event) {
		for (var i = 0; i < event.changedTouches.length; i++) {
			var touch = event.changedTouches[i];
			currentTouch = {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
			break;
		}
	}

	document.body.ontouchmove = function(event) {
		if (! currentTouch) return;
		for (var i = 0; i < event.changedTouches.length; i++) {
			var touch = event.changedTouches[i];
			if (currentTouch.identifier != touch.identifier) continue;

			var difference = touch.clientX - currentTouch.clientX;
			var target = difference > 0 ? currentSlide.previousElementSibling : currentSlide.nextElementSibling;
			currentSlide.style.opacity = target == null ? 1 : Math.max(0.6, Math.min(1, 1 - Math.abs(difference) / 1000));
			break;
		}
	}

	document.body.ontouchend = function(event) {
		if (! currentTouch) return;
		for (var i = 0; i < event.changedTouches.length; i++) {
			var touch = event.changedTouches[i];
			if (currentTouch.identifier != touch.identifier) continue;

			currentSlide.style.opacity = 1;
			var difference = touch.clientX - currentTouch.clientX;
			if (difference > 100) moveToSlide(currentSlide.previousElementSibling);
			else if (difference < -100) moveToSlide(currentSlide.nextElementSibling);

			currentTouch = null;
			break;
		}
	}

	this.free = function() {
		onresize = null;
		document.body.ontouchstart = null;

		for (var element = main.firstElementChild; element; element = element.nextElementSibling) {
			element.style.transform = null;
			element.style.opacity = null;
		}

		setSlideVisibility(currentSlide, false);
	};
}

// Start with the previously saved local state
remote.mergeLocalState();

# HTML Presentation Slides

**html-slides** is a template to create presentation slides that run directly inside a web browser. To see such slides in action, have a look at the [demo slides](https://d28b.github.io/html-slides/demo/).

The template offers the following features:

- A **slide roll**, showing all slides
- A **presentation mode**, showing one slide at a time on the whole screen
- A **slide index**, with the possibility to jump to any slide
- **Remote control**, to switch slides from a mobile device, for example

## Prerequisites

To build the slides, [Node.js](https://nodejs.org) must be installed on the computer.

The slides can be presented with any of the major web browsers (Firefox, Chrome, Edge, Safari, Opera, ...).

## Getting started

Clone or download this repository, and start creating your presentation inside the `template` folder. You don't need anything outside of this folder, and may rename or move it.

The `template` folder contains the following files and folders:

- `slides` contains your slides.
- `index.build.html` contains the list of slides.
- `deploy` is the script which assembles your slides into a single `index.html` file.
- `index.html` is the generated presentation.
- `style` contains the CSS style file (`style.inc.css`) and fonts. You can adjust the default fonts and colors in here.
- `skeleton` contains the HTML and JavaScript code with the presentation skeleton. You don't need to modify anything in here.
- `pwa` (optional) contains resources required to turn your presentation into a [progressive web app](https://en.wikipedia.org/wiki/Progressive_web_applications). This is not necessary for a simple presentation.

## Slides

Slides are typically created by writing a few lines of HTML code, or by drawing an SVG file. For for video-only or image-only slides, the skeleton provides predefined HTML code.

The slide index file `index.build.html` looks as follows:

	<? import skeleton/slides.lib.js ?><?

	title('Title of your presentation');

	slide('slides/title.inc.html');
	slide('slides/intro.inc.html', 'Introduction');
	slide('slides/system.inc.svg', 'System');
	slide('slides/video.mp4', 'Video', 'black');
	slide('slides/next-steps.inc.html', 'Next steps');

	?><? include skeleton/slides.inc.html ?>

The first and last line import the skeleton, and must remain as-is. The center part contains the title of the presentation, and one line per slide. Each slide takes the following parameters:

1. File (required)
2. Title shown on the slide index (optional)
3. Style (optional)

The file extension determines the type of slide:

- `.inc.html` are HTML slides (see below).
- `.inc.svg` are SVG slides (see below).
- `.mp4`, `.webm`, or `.ogg` are video-only slides. They result in a video player shown on the slide. They look best with the 'black' style.
- `.png`, `.jpg`, or `.jpeg` are image-only slides. Suitable styles are 'black' (to place the image on a black background) and 'cover' (to cover the whole slide).

Slides are prepared for a size of 1000 x 600 pixels. In presentation mode, they are scaled to fit the size of the display.

### HTML slides

A HTML slide (`slides/slide-name.inc.html`) may look as follows:

	<h2>Slide title</h2>

	<ul>
	    <li>This is bullet 1<li>
	    <li>This is bullet 2<li>
	    <li>This is bullet 3<li>
	</ul>

	<p>This is a paragraph of text after the bullet points.</p>

The `<ul>` tag creates an *unordered* list, i.e. a list with bullet points. There is a corresponding `<ol>` tag, which creates a numbered (*ordered*) list.

Images can be inserted using the [*img* tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img):

	<img src="slides/elephant.jpg" class="right">

Videos can be inserted using the [*video* tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video):

	<video controls width="640">
		<source src="slides/video.mp4" type="video/mp4">
		<a href="slides/video.mp4">Play video with external player</a>
	</video>

Web browsers support a variety of [video formats](https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats). MP4, or the MPEG-4/H.264 video format, is supported by [nearly all web browsers](https://caniuse.com/#search=MPEG-4). Many browsers also play [WebM](https://caniuse.com/#search=webm) (video/webm), or [Ogg/Theora](https://caniuse.com/#search=theora) (video/ogg) files.

Similarly, audio files can be included using the [*audio* tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio).

### SVG slides

The SVG format (`slides/*slide-name*.inc.svg`) is suitable for slides with vector graphics, such as diagrams or schematics. Such slides can be drawn using [Inkscape](https://inkscape.org) or any other software capable of saving or exporting SVG files.

The SVG document (page) must be 1000 x 600 pixels in size (`width="1000" height="600"`). The file is cleaned while importing. In particular, Inkscape-specific information and default IDs (e.g., *rect1098*) are removed.

## Building the slides with *deploy*

To rebuild the slides, run

	./deploy

from the command line. The script generates *index.html*, and then waits for changes to your slides. Whenever you make changes, it rebuilds *index.html*, and you can comfortably examine your changes by reloading *index.html* in your browser.

To quit the deploy script, press `Ctrl-C`.

### Uploading the slides

The deploy script can optionally upload the slides onto a server. For that, create a script called `upload-server` next to `deploy` with the upload commands.

A typical [rsync](https://linux.die.net/man/1/rsync) upload script looks as follows:

	#! /bin/sh

	rsync -avL \\
	      --timeout 10 \\
	      --delete \\
	      --exclude '*.inc*' \\
	      --exclude '*.lib*' \\
	      --exclude '*.build*' \\
	      --exclude '*.orig' \\
	      --exclude 'deploy' \\
	      --exclude 'upload-*' \\
	      . username@server:/path/to/http/root

Once the file is saved, make it executable:

	chmod 755 upload-server

and launch the deploy script as follows:

	./deploy server

## Using the slides

### Presentation

To start the presentation, press `F11` to enabled fullscreen, and `p` to switch to *presentation mode*. Use the left/right arrow keys (or `Page Up` / `Page Down`) on the keyboard to move to the previous / next slide.

The three stripes on the upper right corner open the slide index. Clicking on any slide switches to that slide.

Should the menu button in the upper right corner turn red, the presentation has lost focus, and the arrow keys won't work. Clicking that red button will focus the presentation, and make the arrow keys work again.

### Printing

From many browsers, the slides can be printed. Each slide fits on an A4 landscape page.

### Dual screen mode

When you connect a projector as an external screen, you can display the presentation on both screens.

For that, open the same presentation in two separate browser windows (of the same browser). Place one window on the main screen, and the other window on the external screen (in fullscreen mode). The two windows will always show the same slide.

Note that interactive content may not be synchronized.

### Remote control

A presentation instance can act as remote control for another instance. This requires an internet connection, as the control messages are sent through a server (https://viereck.ch/remote/).

This can be used to switch slides from a mobile phone, for instance:

- Launch the presentation on your mobile phone. Click on the menu button, and enable **Send**. The menu button will turn blue. Take note of the send token.
- Launch the same presentation on your laptop. Click on the menu button, and enable **Listen**. Type the send token from the mobile phone. The menu button will turn orange.

When moving to a slide on the mobile phone, the laptop will now move to the same slide within about 1 second.

## Advanced topics

### Structuring the slide index

The slide index may be structured using `topic` and `subTopic`:

	<? import skeleton/slides.lib.js ?><?

	title('Title of your presentation');

	topic('Topic 1');

	subTopic('Subtopic 1');
	slide('...');
	slide('...');

	subTopic('Subtopic 2');
	slide('...');
	slide('...');

	topic('Topic 2');
	slide('...');
	slide('...');

	?><? include skeleton/slides.inc.html ?>

Topics and subtopics only appear on the slide index. They have no effect on the slides.

### Slides with JavaScript

JavaScript files named `slides/slide-name.inc.js` are automatically inserted with their respective slide. JavaScript allows to create advanced slides with simulations, animations, interactive elements, and so on.

A simple slide script may look as follows:

	var counter = document.getElementById('fancySlideCounter');
	var count = 0;

	slide.onSlideAppears = function() {
	    count += 1;
	    counter.textContent = 'This slide appeared ' + count + ' times.';
	};

	slide.onSlideDisappears = function() {
	    // ...
	};

The code is executed when the presentation is loaded. `slide` is a reference to the corresponding slide, a `<div>` element. When the slide appears on the screen, the `slide.onSlideAppears` function is called. Conversely, `slide.onSlideDisappears` is called when the slide disappears. To reduce unnecessary overhead, it is good practice to run animations only when the slide is visible. Note that multiple slides may be visible at the same time.

To avoid name clashes, the slide's JavaScript code is placed into an anonymous function. A generated slide looks as follows:

	<div class="slide">
	    <!-- The slide's HTML or SVG content -->

	    <script>
	    (function() {
	        var slide = document.currentScript.parentElement;

	        // The slide's JavaScript code
	    })();
	    </script>
	</div>

However, element id's must be unique throughout the whole HTML page. Hence, slides should prefix them with a unique slide name (`fancySlide` in the above example).

Slides can still communicate with each other through the `window` object:

	// In slide A
	var fancyState = ...;

	window.getFancyState = function() {
	    return fancyState;
	};

	// In slide B
	var state = window.getFancyState();
	...

### Transmitting state to other instance

Interactive slides can synchronize their state with other instances through remote control (see above). Note that this works for tiny amounts of data only.

The following example uses `sendState` and a state listener to synchronize the content of a text input:

	var input = document.getElementById('fancySlideInput');

	slide.onSlideAppears = function() {
	    remote.addStateListener(onStateChanged);
	};

	slide.onSlideDisappears = function() {
	    remote.removeStateListener(onStateChanged);
	};

	// Receive a state update
	function onStateChanged(state) {
		if (! state.fancySlide) return;
	    input.value = state.fancySlide.text;
	}

	// Send a state update when the text changes
	input.oninput = function() {
	    remote.sendState('fancySlide', {text: input.value});
	};

### Creating a progressive web app

[Progressive web apps (PWAs)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) are websites that can be installed like apps. To turn your slides into a PWA, copy the `pwa` folder (from the `optional` folder) into your project folder, and adapt "name" and "short_name" in `manifest.json`. You may also draw your own app icon (launcher icon), and change the background color of the launch screen.

If the `pwa` folder is present, the skeleton will add

	<link href="pwa/manifest.json" rel="manifest">

to your `index.html`.

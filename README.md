# HTML Presentation Slides

**html-slides** is a template to create presentation slides that run directly inside a web browser. To see such slides in action, have a look at the [demo slides](https://d28b.github.io/html-slides/demo/).

**Presentation features**

- Slide roll mode
- Presentation mode
- Runs locally, without internet access
- Remote control from a mobile device
- Slide printing

**Slide features**

- HTML slides with text, images, videos
- SVG slides for diagrams, vector graphics and simple animations
- Equations with MathJax
- Inclusion of external websites or content
- Advanced slides with JavaScript
	- Interactive slides
	- Advanced animations
	- 3D models
	- Live data, live diagrams

## Prerequisites

To build the presentation from your slides, [Node.js](https://nodejs.org) must be installed on the computer.

The presentation can be shown with any of the major web browsers (Firefox, Chrome, Edge, Safari, Opera, ...), and does not require any additional software.

## Getting started

Download or clone the [html-slides repository](https://github.com/d28b/html-slides), and start creating your presentation inside the `template` folder. You don't need anything outside of this folder, and may rename or move it.

The `template` folder contains the following files and folders:

- `slides` contains your slides and its media resources.
- `index.build.html` contains the list of slides.
- `deploy` assembles your slides into a single `index.html` file.
- **`index.html` is the generated presentation.**
- `style` contains the CSS style file (`style.inc.css`) and fonts. You can adjust the default fonts and colors in here.
- `skeleton` contains the HTML, CSS and JavaScript code to turn your slides into a presentation. You don't need to modify anything in here.

## Slides

A slide is typically a file with a few lines of HTML code, or a SVG file. For video-only or image-only slides, the skeleton provides predefined HTML code.

The `index.build.html` file contains the title and slide sequence of the presentation:

```javascript
<? import skeleton/presentation.lib.js ?><?

title('Title of your presentation');

slide('slides/title.inc.html');
slide('slides/intro.inc.html', 'Introduction');
slide('slides/system.inc.svg', 'System');
slide('slides/video.mp4', 'Video', 'black');
slide('slides/next-steps.inc.html', 'Next steps');

?><? include skeleton/presentation.inc.html ?>
```

The first and last line import the presentation skeleton, and must remain as-is. Each slide takes the following parameters:

1. Slide file
2. Title shown on the slide index *(optional)*
3. Style *(optional)*

The file extension determines the type of slide:

- `.inc.html` are HTML slides (see below).
- `.inc.svg` are SVG slides (see below).
- `.mp4`, `.webm`, or `.ogg` are video-only slides. They result in a video player shown on the slide. They look best with the 'black' style.
- `.png`, `.jpg`, or `.jpeg` are image-only slides. Suitable styles are 'black' (to place the image on a black background) and 'cover' (to cover the whole slide).

Slides are prepared for a size of 1000 x 600 pixels. In presentation mode, they are scaled to fit the size of the display.

### HTML slides

A simple HTML slide (`slides/slide-name.inc.html`) with bullet points look as follows:

```html
<div class="text left w600">
    <h1>Slide title</h1>

    <ul>
        <li>This is bullet 1</li>
        <li>This is bullet 2</li>
        <li>This is bullet 3</li>
    </ul>
</div>

<img class="right w400" src="slides/jigsaw.jpg">
```

The slide shows an image ([img tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img)) on the right side (400 pixels), and uses the remaining 600 pixels on the left for the slide title ([h1 tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1)) and the bullet points ([ul tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul), [ol tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol), [li tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li)).

The template contains examples for positioning text and images, and inserting tables.

### SVG slides

The SVG format (`slides/slide-name.inc.svg`) is suitable for slides with vector graphics, such as diagrams or schematics. Such slides can be drawn using [Inkscape](https://inkscape.org) or any other software capable of saving or exporting SVG files.

The SVG document (page) must be 1000 x 600 pixels in size (`width="1000" height="600"`). The SVG code undergoes some cleanup while importing. In particular, Inkscape-specific information and default IDs (e.g., *rect1098*) are removed.

## Building the slides with *deploy*

To rebuild the presentation (`index.html`), open a terminal window (command line) and run

	./deploy

The script keeps looking for changes, and rebuilds `index.html` when necessary. To quit it, press `Ctrl-C` in the terminal window.

The deploy script crudely checks your HTML code. In particular, it warns if tags are not properly closed.

### Uploading the slides

The deploy script will upload the slides onto a server, if desired. For that, create a script called `upload-server` next to `deploy` with the upload commands.

A typical [rsync](https://linux.die.net/man/1/rsync) upload script looks as follows:

```sh
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
```

Save the file, and make it executable:

	chmod 755 upload-server

To deploy and upload the slides, you may now type:

	./deploy server

## Using the slides

### Presentation

To start the presentation, press `F11` to enable fullscreen, and `p` to switch to *presentation mode*. Use the left/right arrow keys (or `Page Up` / `Page Down`) on the keyboard to move to the previous / next slide. On mobile devices, you can swipe left/right.

The menu button in the upper right corner (three stripes) opens the slide index. Clicking on any slide switches to that slide.

If you activate another window (or iframe within the slides) during the presentation, the menu button turns red to indicate that the arrow keys (to move to the next slide) don't work. Clicking that red button will focus the presentation again, and make the arrow keys work.

### Printing

Many browsers allow the slides to be printed. Each slide fits on an A4 landscape page.

### Dual screen mode

When you connect a projector as an external screen, you can display the presentation on both screens.

For that, open the same presentation in two separate browser windows (of the same browser). Place one window on the main screen, and the other window on the external screen (in fullscreen mode). The two windows will always show the same slide.

Note that interactive content may not always be synchronized.

### Remote control

A presentation running on a laptop may be remotely controlled by a mobile phone. This requires an internet connection, as the control messages are sent through a server (https://viereck.ch/remote/).

To set this up:

1. Launch the presentation on your mobile phone. Click on the menu button, and enable **Send**. Take note of the send token. The menu button will turn blue.
2. Launch the same presentation on your laptop. Click on the menu button, and enable **Listen**. Type the send token from the mobile phone. The menu button will turn orange.

## Advanced topics

### Inserting videos on HTML slides

Videos are inserted using the [*video* tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video):

```html
<video controls width="640">
    <source src="slides/video.mp4" type="video/mp4">
    <a href="slides/video.mp4">Play video with external player</a>
</video>
```

Web browsers support a variety of [video formats](https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats). MP4, or the MPEG-4/H.264 video format, is supported by [nearly all web browsers](https://caniuse.com/#search=MPEG-4). The most popular browsers also play [WebM](https://caniuse.com/#search=webm) (video/webm), or [Ogg/Theora](https://caniuse.com/#search=theora) (video/ogg) files.

Similarly, audio files are inserted using the [*audio* tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio).

A slide with a fullscreen video can simply be created from the slide index:

```javascript
slide('slides/video.mp4', 'Video', 'black');
```

### Structuring the slide index

The slide index may be structured using `topic` and `subTopic`:

```javascript
<? import skeleton/presentation.lib.js ?><?

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

?><? include skeleton/presentation.inc.html ?>
```

Topics and subtopics only appear on the slide index. They have no effect on the slides or the presentation flow.

### Slides with JavaScript

JavaScript files named `slides/slide-name.inc.js` are automatically inserted with their respective slide. JavaScript allows to create advanced slides with simulations, animations, interactive elements, and so on.

A simple slide script may look as follows:

```javascript
var counter = document.getElementById('fancySlideCounter');
var count = 0;

slide.onSlideAppears = function() {
    count += 1;
    counter.textContent = 'This slide has appeared ' + count + ' times so far.';
};

slide.onSlideDisappears = function() {
    // ...
};
```

The code is executed when the presentation is loaded. `slide` is a reference to the corresponding slide, a `<div>` element. When the slide appears on the screen, the `onSlideAppears` function is called. Conversely, `onSlideDisappears` is called when the slide disappears. It is good practice to run animations only when the slide is visible. Note that multiple slides may be visible at the same time.

To avoid variable and function name clashes, the slide's JavaScript code is placed into an anonymous function. A generated slide has the following structure:

```html
<div class="slide">
    <!-- The slide's HTML or SVG content -->

    <script>
    (function() {
        var slide = document.currentScript.parentElement;

        // The slide's JavaScript code
    })();
    </script>
</div>
```

Slides can still communicate with each other through the `window` object:

```javascript
// In slide A
var fancyState = ...;

window.getFancyState = function() {
    return fancyState;
};

// In slide B
var state = window.getFancyState();
...
```

Element id's must be unique throughout the whole HTML page. Slides should therefore prefix them with a unique slide name (`fancySlide` in the above example).

### Transmitting state to other instances

Interactive slides can synchronize their state with other instances through *remote control* (see above). Note that this is intended for tiny amounts of data only, such as a few numbers, or an element id, or a short text.

The following example uses `sendState` and a state listener to synchronize the content of a text input:

```javascript
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
    input.value = state.fancySlideText;
}

// Send a state update when the text changes
input.oninput = function() {
    remote.sendState('fancySlideText', input.value);
};
```

## More

- [Adding equations with MathJax](more/mathjax/)
- [Creating a progressive web app (PWA)](more/pwa/)

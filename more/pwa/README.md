# Turning your presentation into a progressive web app

[Progressive web apps (PWAs)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) are websites that can be installed like apps. To turn your presentation into a PWA, copy the `pwa` folder into your project folder, and adapt "name" and "short_name" in `manifest.json`. You may also draw your own app icon (launcher icon), and change the background color of the launch screen.

To activate the manifest, add the following line to your `index.build.html`:

```javascript
header('<link href="pwa/manifest.json" rel="manifest">');
```

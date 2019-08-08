# Equations with MathJax

[MathJax](https://www.mathjax.org) allows you to add LaTeX-style equations to your slides.

## Loading MathJax from the CDN

To load MathJax from their official CDN, add the following line to your `index.build.html`:

```javascript
header('<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML" async></script>');
```

## Using a local installation

If you want to use the slides offline, [download MathJax](https://github.com/mathjax/mathjax), and place it next to the `deploy` script. Call that folder `MathJax`, and add the following line to your `index.build.html`:

```javascript
header('<script src="MathJax/MathJax.js?config=TeX-MML-AM_CHTML" async></script>');
```

## Writing equations

MathJax follows pretty much the LaTeX equation syntax. Inline equations are written `\( equation \)`, and `$$ equation $$` will turn into paragraph equations:

```html
<p>
	The norm of the vector \(v = \left( \begin{array}{c} x \\ y \end{array} \right) \) can be calculated as follows:
	$$ \left| v \right| = \sqrt{ x^2 + y^2 } $$
</p>
```

Equations can appear anywhere on the slides. MathJax will format them when the presentation is loaded.

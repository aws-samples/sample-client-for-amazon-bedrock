# micromark-extension-math

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[micromark][]** extension to support math (`$C_L$`).

As there is no spec for math in markdown, this extension stays as close to
code in text and fenced code in flow in CommonMark, but using dollar signs.

## When to use this

If you’re using [`micromark`][micromark] or
[`mdast-util-from-markdown`][from-markdown], use this package.
Alternatively, if you’re using **[remark][]**, use
[`remark-math`][remark-math].

## Syntax

```markdown
Math (text) can start with one or more dollar signs, so long as they match:
With one: $\alpha$, two: $$\beta$$, or three: $$$\gamma$$$.

This is useful, because like code, typical markdown escapes don’t work.
For dollars inside math, use more dollars around it: $$\raisebox{0.25em}{$\frac
a b$}$$.

If the math starts and ends with a space (or EOL), those are removed: $$ \$ $$.

Math (flow) starts at two or more dollars:

$$
\Delta
$$

You can hide some stuff in the meta of the opening fence (but no dollars):

$$hidden information
$$

Math that doesn’t have a closing fence, still works, like fenced code:

> $$
> this is
> all math

…but at the end of their container (block quote, list item, or document), they
are closed.
```

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

[npm][]:

```sh
npm install micromark-extension-math
```

## Use

Say we have the following file, `example.md`:

```markdown
Lift($L$) can be determined by Lift Coefficient ($C_L$) like the following equation.

$$
L = \frac{1}{2} \rho v^2 S C_L
$$
```

And our script, `example.js`, looks as follows:

```js
import fs from 'fs'
import {micromark} from 'micromark'
import {math, mathHtml} from 'micromark-extension-math'

const output = micromark(fs.readFileSync('example.md'), {
  extensions: [math()],
  htmlExtensions: [mathHtml()]
})

console.log(output)
```

Now, running `node example` yields (abbreviated):

```html
<p>Lift(<span class="math math-inline"><span class="katex">…</span></span>) like the following equation.</p>
<div class="math math-display"><span class="katex-display"><span class="katex">…</span></div>
```

## API

This package exports the following identifiers: `math`, `mathHtml`.
There is no default export.

The export map supports the endorsed
[`development` condition](https://nodejs.org/api/packages.html#packages\_resolving\_user\_conditions).
Run `node --conditions development module.js` to get instrumented dev code.
Without this condition, production code is loaded.

### `math(options?)`

### `mathHtml(htmlOptions?)`

A function to create an extension for micromark to parse math (can be passed in
`extensions`) and a function that can be called to get an extension to compile
them to HTML with [KaTeX][] (can be passed in `htmlExtensions`).

##### `options`

###### `options.singleDollarTextMath`

Whether to support math (text) with a single dollar (`boolean`, default:
`true`).
Single dollars work in Pandoc and many other places, but often interfere with
“normal” dollars in text.

##### `htmlOptions`

Passed to [`katex.renderToString`][katex-options].
`displayMode` is overwritten by this plugin, to `false` for math in text, and
`true` for math in flow.

## Related

*   [`remarkjs/remark`][remark]
    — markdown processor powered by plugins
*   [`remarkjs/remark-math`][remark-math]
    — remark plugin using this to support math
*   [`micromark/micromark`][micromark]
    — the smallest commonmark-compliant markdown parser that exists
*   [`syntax-tree/mdast-util-math`][mdast-util-math]
    — mdast utility to support math
*   [`syntax-tree/mdast-util-from-markdown`][from-markdown]
    — mdast parser using `micromark` to create mdast from markdown
*   [`syntax-tree/mdast-util-to-markdown`][to-markdown]
    — mdast serializer to create markdown from mdast

## Contribute

See [`contributing.md` in `micromark/.github`][contributing] for ways to get
started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/micromark/micromark-extension-math/workflows/main/badge.svg

[build]: https://github.com/micromark/micromark-extension-math/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/micromark/micromark-extension-math.svg

[coverage]: https://codecov.io/github/micromark/micromark-extension-math

[downloads-badge]: https://img.shields.io/npm/dm/micromark-extension-math.svg

[downloads]: https://www.npmjs.com/package/micromark-extension-math

[size-badge]: https://img.shields.io/bundlephobia/minzip/micromark-extension-math.svg

[size]: https://bundlephobia.com/result?p=micromark-extension-math

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/micromark/micromark/discussions

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[contributing]: https://github.com/micromark/.github/blob/HEAD/contributing.md

[support]: https://github.com/micromark/.github/blob/HEAD/support.md

[coc]: https://github.com/micromark/.github/blob/HEAD/code-of-conduct.md

[micromark]: https://github.com/micromark/micromark

[from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[to-markdown]: https://github.com/syntax-tree/mdast-util-to-markdown

[remark]: https://github.com/remarkjs/remark

[remark-math]: https://github.com/remarkjs/remark-math

[mdast-util-math]: https://github.com/syntax-tree/mdast-util-math

[katex]: https://katex.org

[katex-options]: https://katex.org/docs/options.html

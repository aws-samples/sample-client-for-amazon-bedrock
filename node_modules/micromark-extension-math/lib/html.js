/**
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 * @typedef {import('katex').KatexOptions} KatexOptions
 */

/**
 * @typedef {Omit<KatexOptions, 'displayMode'>} Options
 */
import katex from 'katex'
/**
 * @param {Options} [options]
 * @returns {HtmlExtension}
 */

export function mathHtml(options) {
  return {
    enter: {
      mathFlow() {
        this.lineEndingIfNeeded()
        this.tag('<div class="math math-display">')
      },

      mathFlowFenceMeta() {
        this.buffer()
      },

      mathText() {
        // Double?
        this.tag('<span class="math math-inline">')
        this.buffer()
      }
    },
    exit: {
      mathFlow() {
        const value = this.resume()
        this.tag(math(value.replace(/(?:\r?\n|\r)$/, ''), true))
        this.tag('</div>')
        this.setData('mathFlowOpen')
        this.setData('slurpOneLineEnding')
      },

      mathFlowFence() {
        // After the first fence.
        if (!this.getData('mathFlowOpen')) {
          this.setData('mathFlowOpen', true)
          this.setData('slurpOneLineEnding', true)
          this.buffer()
        }
      },

      mathFlowFenceMeta() {
        this.resume()
      },

      mathFlowValue(token) {
        this.raw(this.sliceSerialize(token))
      },

      mathText() {
        const value = this.resume()
        this.tag(math(value, false))
        this.tag('</span>')
      },

      mathTextData(token) {
        this.raw(this.sliceSerialize(token))
      }
    }
  }
  /**
   * @param {string} value
   * @param {boolean} displayMode
   * @returns {string}
   */

  function math(value, displayMode) {
    return katex.renderToString(
      value,
      Object.assign({}, options, {
        displayMode
      })
    )
  }
}

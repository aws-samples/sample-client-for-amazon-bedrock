/**
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('./math-text').Options} Options
 */
import {mathFlow} from './math-flow.js'
import {mathText} from './math-text.js'
/**
 * @param {Options} [options]
 * @returns {Extension}
 */

export function math(options) {
  return {
    flow: {
      [36]: mathFlow
    },
    text: {
      [36]: mathText(options)
    }
  }
}

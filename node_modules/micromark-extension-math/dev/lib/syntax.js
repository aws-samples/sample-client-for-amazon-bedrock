/**
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('./math-text').Options} Options
 */

import {codes} from 'micromark-util-symbol/codes.js'
import {mathFlow} from './math-flow.js'
import {mathText} from './math-text.js'

/**
 * @param {Options} [options]
 * @returns {Extension}
 */
export function math(options) {
  return {
    flow: {[codes.dollarSign]: mathFlow},
    text: {[codes.dollarSign]: mathText(options)}
  }
}

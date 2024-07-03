/**
 * @param {Options} [options]
 * @returns {Extension}
 */
export function math(
  options?: import('./math-text.js').Options | undefined
): Extension
export type Extension = import('micromark-util-types').Extension
export type Options = import('./math-text').Options

/**
 * @param {Options} [options]
 * @returns {Construct}
 */
export function mathText(options?: Options | undefined): Construct
export type Construct = import('micromark-util-types').Construct
export type Resolver = import('micromark-util-types').Resolver
export type Tokenizer = import('micromark-util-types').Tokenizer
export type Previous = import('micromark-util-types').Previous
export type State = import('micromark-util-types').State
export type Token = import('micromark-util-types').Token
export type Options = {
  /**
   * Whether to support math (text) with a single dollar (`boolean`, default:
   * `true`).
   * Single dollars work in Pandoc and many other places, but often interfere
   * with “normal” dollars in text.
   */
  singleDollarTextMath?: boolean | undefined
}

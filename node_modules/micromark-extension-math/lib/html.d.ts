/**
 * @param {Options} [options]
 * @returns {HtmlExtension}
 */
export function mathHtml(options?: Options | undefined): HtmlExtension
export type HtmlExtension = import('micromark-util-types').HtmlExtension
export type KatexOptions = import('katex').KatexOptions
export type Options = Omit<KatexOptions, 'displayMode'>

/**
 * Plugin to support hard breaks without needing spaces or escapes (turns enters
 * into `<br>`s).
 *
 * @type {import('unified').Plugin<void[], Root>}
 */
export default function remarkBreaks():
  | void
  | import('unified').Transformer<import('mdast').Root, import('mdast').Root>
export type Root = import('mdast').Root
export type PhrasingContent = import('mdast').PhrasingContent

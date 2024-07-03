/**
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').Resolver} Resolver
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 * @typedef {import('micromark-util-types').Previous} Previous
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').Token} Token
 *
 * @typedef Options
 * @property {boolean} [singleDollarTextMath=true]
 *   Whether to support math (text) with a single dollar (`boolean`, default:
 *   `true`).
 *   Single dollars work in Pandoc and many other places, but often interfere
 *   with “normal” dollars in text.
 */
import {markdownLineEnding} from 'micromark-util-character'

/**
 * @param {Options} [options]
 * @returns {Construct}
 */
export function mathText(options = {}) {
  let single = options.singleDollarTextMath

  if (single === null || single === undefined) {
    single = true
  }

  return {
    tokenize: tokenizeMathText,
    resolve: resolveMathText,
    previous
  }
  /** @type {Tokenizer} */

  function tokenizeMathText(effects, ok, nok) {
    const self = this
    let sizeOpen = 0
    /** @type {number} */

    let size
    /** @type {Token} */

    let token
    return start
    /** @type {State} */

    function start(code) {
      effects.enter('mathText')
      effects.enter('mathTextSequence')
      return openingSequence(code)
    }
    /** @type {State} */

    function openingSequence(code) {
      if (code === 36) {
        effects.consume(code)
        sizeOpen++
        return openingSequence
      }

      if (sizeOpen < 2 && !single) return nok(code)
      effects.exit('mathTextSequence')
      return gap(code)
    }
    /** @type {State} */

    function gap(code) {
      if (code === null) {
        return nok(code)
      } // Closing fence?
      // Could also be data.

      if (code === 36) {
        token = effects.enter('mathTextSequence')
        size = 0
        return closingSequence(code)
      } // Tabs don’t work, and virtual spaces don’t make sense.

      if (code === 32) {
        effects.enter('space')
        effects.consume(code)
        effects.exit('space')
        return gap
      }

      if (markdownLineEnding(code)) {
        effects.enter('lineEnding')
        effects.consume(code)
        effects.exit('lineEnding')
        return gap
      } // Data.

      effects.enter('mathTextData')
      return data(code)
    } // In math.

    /** @type {State} */

    function data(code) {
      if (
        code === null ||
        code === 32 ||
        code === 36 ||
        markdownLineEnding(code)
      ) {
        effects.exit('mathTextData')
        return gap(code)
      }

      effects.consume(code)
      return data
    } // Closing fence.

    /** @type {State} */

    function closingSequence(code) {
      // More.
      if (code === 36) {
        effects.consume(code)
        size++
        return closingSequence
      } // Done!

      if (size === sizeOpen) {
        effects.exit('mathTextSequence')
        effects.exit('mathText')
        return ok(code)
      } // More or less accents: mark as data.

      token.type = 'mathTextData'
      return data(code)
    }
  }
}
/** @type {Resolver} */

function resolveMathText(events) {
  let tailExitIndex = events.length - 4
  let headEnterIndex = 3
  /** @type {number} */

  let index
  /** @type {number|undefined} */

  let enter // If we start and end with an EOL or a space.

  if (
    (events[headEnterIndex][1].type === 'lineEnding' ||
      events[headEnterIndex][1].type === 'space') &&
    (events[tailExitIndex][1].type === 'lineEnding' ||
      events[tailExitIndex][1].type === 'space')
  ) {
    index = headEnterIndex // And we have data.

    while (++index < tailExitIndex) {
      if (events[index][1].type === 'mathTextData') {
        // Then we have padding.
        events[tailExitIndex][1].type = 'mathTextPadding'
        events[headEnterIndex][1].type = 'mathTextPadding'
        headEnterIndex += 2
        tailExitIndex -= 2
        break
      }
    }
  } // Merge adjacent spaces and data.

  index = headEnterIndex - 1
  tailExitIndex++

  while (++index <= tailExitIndex) {
    if (enter === undefined) {
      if (index !== tailExitIndex && events[index][1].type !== 'lineEnding') {
        enter = index
      }
    } else if (
      index === tailExitIndex ||
      events[index][1].type === 'lineEnding'
    ) {
      events[enter][1].type = 'mathTextData'

      if (index !== enter + 2) {
        events[enter][1].end = events[index - 1][1].end
        events.splice(enter + 2, index - enter - 2)
        tailExitIndex -= index - enter - 2
        index = enter + 2
      }

      enter = undefined
    }
  }

  return events
}
/** @type {Previous} */

function previous(code) {
  // If there is a previous code, there will always be a tail.
  return (
    code !== 36 ||
    this.events[this.events.length - 1][1].type === 'characterEscape'
  )
}

/**
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 * @typedef {import('micromark-util-types').State} State
 */

import {ok as assert} from 'uvu/assert'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {constants} from 'micromark-util-symbol/constants.js'
import {types} from 'micromark-util-symbol/types.js'

/** @type {Construct} */
export const mathFlow = {
  tokenize: tokenizeMathFenced,
  concrete: true
}

/** @type {Construct} */
const nonLazyLine = {tokenize: tokenizeNonLazyLine, partial: true}

/** @type {Tokenizer} */
function tokenizeMathFenced(effects, ok, nok) {
  const self = this
  const tail = self.events[self.events.length - 1]
  const initialSize =
    tail && tail[1].type === types.linePrefix
      ? tail[2].sliceSerialize(tail[1], true).length
      : 0
  let sizeOpen = 0

  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.dollarSign, 'expected `$`')
    effects.enter('mathFlow')
    effects.enter('mathFlowFence')
    effects.enter('mathFlowFenceSequence')
    return sequenceOpen(code)
  }

  /** @type {State} */
  function sequenceOpen(code) {
    if (code === codes.dollarSign) {
      effects.consume(code)
      sizeOpen++
      return sequenceOpen
    }

    effects.exit('mathFlowFenceSequence')
    return sizeOpen < 2
      ? nok(code)
      : factorySpace(effects, metaOpen, types.whitespace)(code)
  }

  /** @type {State} */
  function metaOpen(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter('mathFlowFenceMeta')
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return meta(code)
  }

  /** @type {State} */
  function meta(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString)
      effects.exit('mathFlowFenceMeta')
      return openAfter(code)
    }

    if (code === codes.dollarSign) return nok(code)
    effects.consume(code)
    return meta
  }

  /** @type {State} */
  function openAfter(code) {
    effects.exit('mathFlowFence')
    return self.interrupt ? ok(code) : contentStart(code)
  }

  /** @type {State} */
  function contentStart(code) {
    if (code === codes.eof) {
      return after(code)
    }

    if (markdownLineEnding(code)) {
      return effects.attempt(
        nonLazyLine,
        effects.attempt(
          {tokenize: tokenizeClosingFence, partial: true},
          after,
          initialSize
            ? factorySpace(
                effects,
                contentStart,
                types.linePrefix,
                initialSize + 1
              )
            : contentStart
        ),
        after
      )(code)
    }

    effects.enter('mathFlowValue')
    return contentContinue(code)
  }

  /** @type {State} */
  function contentContinue(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit('mathFlowValue')
      return contentStart(code)
    }

    effects.consume(code)
    return contentContinue
  }

  /** @type {State} */
  function after(code) {
    effects.exit('mathFlow')
    return ok(code)
  }

  /** @type {Tokenizer} */
  function tokenizeClosingFence(effects, ok, nok) {
    let size = 0

    return factorySpace(
      effects,
      closingPrefixAfter,
      types.linePrefix,
      constants.tabSize
    )

    /** @type {State} */
    function closingPrefixAfter(code) {
      effects.enter('mathFlowFence')
      effects.enter('mathFlowFenceSequence')
      return closingSequence(code)
    }

    /** @type {State} */
    function closingSequence(code) {
      if (code === codes.dollarSign) {
        effects.consume(code)
        size++
        return closingSequence
      }

      if (size < sizeOpen) return nok(code)
      effects.exit('mathFlowFenceSequence')
      return factorySpace(effects, closingSequenceEnd, types.whitespace)(code)
    }

    /** @type {State} */
    function closingSequenceEnd(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit('mathFlowFence')
        return ok(code)
      }

      return nok(code)
    }
  }
}

/** @type {Tokenizer} */
function tokenizeNonLazyLine(effects, ok, nok) {
  const self = this

  return start

  /** @type {State} */
  function start(code) {
    assert(markdownLineEnding(code), 'expected eol')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return lineStart
  }

  /** @type {State} */
  function lineStart(code) {
    return self.parser.lazy[self.now().line] ? nok(code) : ok(code)
  }
}

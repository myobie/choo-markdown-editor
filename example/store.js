import { document as testDocument } from './test-document'
import { raf } from './raf'
import * as selection from './selection'
import { keyReturn } from './keypress'

export default (state, emitter) => {
  state.document = testDocument
  state.selection = null
  state.isEditing = false

  emitter.on('focus', () => {
    state.isEditing = true
    raf(() => {
      emitter.emit('selection:update', selection.current())
    })
  })

  emitter.on('blur', () => {
    state.isEditing = false
    state.selection = null
  })

  emitter.on('selection:update', update => {
    selection.updateState(state, update)
  })

  emitter.on('caret:set', ({ block, pos }) => {
    selection.setCaret(block, pos)
  })

  // const nbspRegExp = /^.+&nbsp;$/

  emitter.on('slurp', () => {
    // const block = state.selection.focusBlock
    // const index = state.selection.focusPartIndex
    // const part = state.selection.focusPart
    // const partEl = selection.el(block, index)
    // let text = partEl.innerText
    //
    // // there is only one empty text part, which means we are rendering it funny
    // if (block.parts.length === 1 && index === 0 && part.text === '') {
    //   const html = partEl.innerHTML
    //
    //   if (text.length > 1 && html.match(nbspRegExp)) {
    //     text = text.substr(0, text.length - 1)
    //
    //     part.text = text
    //     part.length = text.length
    //
    //     render(() => {
    //       selection.setCaret(block, index, text.length)
    //     })
    //   }
    // } else {
    //   const scanResults = scanLine(text)
    //   let needToResetBlock = false
    //
    //   if (scanResults.length === 0) {
    //     console.error('scanLine returns zero results which should be impossible')
    //   } else if (scanResults.length === 1) {
    //     const result = scanResults[0]
    //     if (part.styleType !== result.styleType) {
    //       needToResetBlock = true
    //     }
    //   } else {
    //     needToResetBlock = true
    //   }
    //
    //   if (needToResetBlock) {
    //     const currentPos = currentBlockPos()
    //     const oldPartLength = part.length
    //
    //     part.text = text
    //     part.length = text.length
    //
    //     const lengthDifference = part.length - oldPartLength
    //
    //     resetBlock(block, currentPos, lengthDifference)
    //   } else {
    //     part.text = text
    //     part.length = text.length
    //   }
    // }
  })

  // function currentBlockPos () {
  //   if (state.selection.isCollapsed) {
  //     return posInBlockAtPartAndOffset(
  //       state.selection.focusBlock,
  //       state.selection.focusPartIndex,
  //       state.selection.focusPartOffset
  //     )
  //   } else {
  //     console.error('do not support range selections for finding block pos yet')
  //   }
  // }

  emitter.on('key:return', () => {
    keyReturn(state)
    render(() => {
      selection.setCaret(state.selection.focusBlock, 0)
    })
  })

  // just in case
  document.execCommand('defaultParagraphSeparator', false, 'p')

  document.addEventListener('selectionchange', e => {
    if (state.isEditing) {
      emitter.emit('selection:update', selection.current())
    }
  })

  function render (cb) {
    if (cb && typeof cb === 'function') {
      emitter.once(state.events.RENDER, () => {
        raf(cb)
      })
    }

    emitter.emit('render')
  }
}

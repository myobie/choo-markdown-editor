import { document as testDocument } from './test-document'
import { raf } from './raf'
import * as selection from './selection'
import { keyReturn } from './keypress'
import { updatePart, reScanBlock } from './model'
import { replacePart } from './transforms'
import { isArrayEqual } from './array-utils'

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

  const nbspRegExp = /^.+&nbsp;$/

  emitter.on('slurp', () => {
    const block = state.selection.focusBlock
    const index = state.selection.focusPartIndex
    const part = state.selection.focusPart
    const partEl = selection.el(block, index)
    let text = partEl.innerText
    const html = partEl.innerHTML

    if (text.length > 1 && html.match(nbspRegExp)) {
      text = text.substr(0, text.length - 1)
    }

    const newPart = updatePart(part, text)
    replacePart(block, newPart, index)

    const oldParts = block.parts

    // mutate the block to have new parts from our markdown scanning
    reScanBlock(block)

    const oldPartsSummary = oldParts.map(p => {
      return [p.type].concat(p.styles)
    })

    const newPartsSummary = block.parts.map(p => {
      return [p.type].concat(p.styles)
    })

    if (!isArrayEqual(oldPartsSummary, newPartsSummary)) {
      console.debug('the structure of the block has changed, so rendering')
      render()
    }
  })

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

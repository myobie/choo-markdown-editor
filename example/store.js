import { document as testDocument } from './test-document'
import { raf } from './raf'
import * as sel from './selection'
import { keyBackspace, keyDelete, keyReturn } from './keypress'
import { updatePart, reScanBlock } from './model'
import { replacePart } from './transforms'
import { isArrayEqual } from './array-utils'

export default (state, emitter) => {
  state.document = testDocument
  state.selection = null
  state.isEditing = false
  state.nextSelection = null

  emitter.on('focus', () => {
    state.isEditing = true
    raf(() => {
      emitter.emit('selection:update', sel.current(state))
    })
  })

  emitter.on('blur', () => {
    state.isEditing = false
    state.selection = null
    state.nextSelection = null
  })

  emitter.on('selection:update', newSelection => {
    state.selection = newSelection
  })

  emitter.on('caret:set', ({ block, pos }) => {
    const point = sel.Point.fromBlockPos(block, pos).assignFromDocument(state.document)
    const selection = new sel.Selection(point)
    selection.render()
  })

  const nbspRegExp = /^.+&nbsp;$/

  emitter.on('slurp', () => {
    if (!state.selection.isCollapsed) {
      console.error('cannot slurp after input during a range selection yet')
    }

    const block = state.selection.end.block
    const index = state.selection.end.partIndex
    const part = state.selection.end.part
    const el = state.selection.end.el
    let text = el.innerText
    const html = el.innerHTML

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
    render()
  })

  emitter.on('key:backspace', () => {
    keyBackspace(state)
    render()
  })

  emitter.on('key:delete', () => {
    keyDelete(state)
    render()
  })

  // just in case
  document.execCommand('defaultParagraphSeparator', false, 'p')

  document.addEventListener('selectionchange', e => {
    if (state.isEditing) {
      emitter.emit('selection:update', sel.current(state))
    }
  })

  function render (cb) {
    if (cb && typeof cb === 'function') {
      emitter.once(state.events.RENDER, () => {
        raf(cb)
      })
    }

    // if there is a next selection queued up, then go ahead and make it happen
    if (state.nextSelection) {
      console.debug('will render next selection', state.nextSelection)
      emitter.once(state.events.RENDER, () => {
        const nextSelection = state.nextSelection
        state.nextSelection = null
        if (nextSelection) {
          raf(() => {
            nextSelection.render()
          })
        }
      })
    }

    emitter.emit('render')
  }
}

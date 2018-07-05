import { scanLine } from './scan-line'

export default (state, emitter) => {
  state.document = [
    {
      type: 'block',
      parts: [
        { type: 'text', styleType: 'plain', text: 'Hello world  ', length: 13 },
        { type: 'text', styleType: 'bold', text: '**hooray**', length: 10 },
        { type: 'text', styleType: 'plain', text: ' foo * bar', length: 10 }
      ]
    },
    {
      type: 'block',
      parts: [
        { type: 'text', styleType: 'plain', text: '', length: 0 }
      ]
    },
    {
      type: 'block',
      parts: [
        { type: 'text', styleType: 'plain', text: '    Nathan', length: 10 }
      ]
    }
  ]

  state.selection = null

  assignCIDs(state.document)

  state.isEditing = false

  emitter.on('focus', () => {
    state.isEditing = true
    raf(() => {
      emitter.emit('selection:update', getCurrentSelection())
    })
  })

  emitter.on('blur', () => {
    state.isEditing = false
    state.selection = null
  })

  emitter.on('selection:update', update => {
    if (state.selection === null || state.selection.anchorBlockID !== update.anchorBlockID) {
      update.anchorBlock = state.document[update.anchorBlockIndex]
    } else {
      update.anchorBlock = state.selection.anchorBlock
    }
    update.anchorPart = update.anchorBlock.parts[update.anchorPartIndex]

    if (state.selection === null || state.selection.focusBlockID !== update.focusBlockID) {
      update.focusBlock = state.document[update.focusBlockIndex]
    } else {
      update.focusBlock = state.selection.focusBlock
    }
    update.focusPart = update.focusBlock.parts[update.focusPartIndex]

    state.selection = update

    // prevent anyone from putting their cursor to the right of the nbsp that
    // is there for empty blocks
    if (state.selection.focusPartIndex === 0 && state.selection.focusPartOffset === 1) {
      // if there is only one part...
      if (state.selection.focusBlock.parts.length === 1) {
        // ...and it's empty
        if (state.selection.focusPart.text === '') {
          // move the cursor to the left of the fake nbsp
          raf(() => {
            // sel, block, part 0, character 0
            setCaret(state.selection.cache, state.selection.focusBlock, 0, 0)
          })
        }
      }
    }
  })

  const nbspRegExp = /^.+&nbsp;$/

  emitter.on('slurp', () => {
    const block = state.selection.focusBlock
    const el = findBlockEl(block)
    const index = state.selection.focusPartIndex
    const part = state.selection.focusPart
    const partEl = el.querySelector(`[data-part][data-index="${index}"]`)
    let text = partEl.innerText

    // there is only one empty text part, which means we are rendering it funny
    if (block.parts.length === 1 && index === 0 && part.text === '') {
      const html = partEl.innerHTML

      if (text.length > 1 && html.match(nbspRegExp)) {
        text = text.substr(0, text.length - 1)

        part.text = text
        part.length = text.length

        render(() => {
          setCaret(state.selection.cache, block, index, text.length)
        })
      }
    } else {
      const scanResults = scanLine(text)
      let needToResetBlock = false

      if (scanResults.length === 0) {
        console.error('scanLine returns zero results which should be impossible')
      } else if (scanResults.length === 1) {
        const result = scanResults[0]
        if (part.styleType !== result.styleType) {
          needToResetBlock = true
        }
      } else {
        needToResetBlock = true
      }

      if (needToResetBlock) {
        const currentPos = currentBlockPos()
        const oldPartLength = part.length

        part.text = text
        part.length = text.length

        const lengthDifference = part.length - oldPartLength

        resetBlock(block, currentPos, lengthDifference)
      } else {
        part.text = text
        part.length = text.length
      }
    }
  })

  function currentBlockPos () {
    if (state.selection.isCollapsed) {
      const block = state.selection.focusBlock
      const index = state.selection.focusPartIndex
      const offset = block.parts.slice(0, index).reduce((acc, p) => acc + p.length, 0)
      return offset + state.selection.focusPartOffset
    } else {
      console.error('do not support range selections for finding block pos yet')
    }
  }

  function findPosInBlock (block, pos) {
    let part
    let index
    let insideOffset = 0
    let finalOffset = 0
    let found = false

    for (let i in block.parts) {
      index = i
      part = block.parts[index]
      insideOffset += part.length

      if (pos <= insideOffset) {
        found = true
        console.log('pos', pos, 'is less than or equal to', insideOffset)
        break
      }

      finalOffset = insideOffset // get ready to loop around
    }

    if (!found) {
      console.error('for loop should never fail, but it did')
    }

    console.log('found pos in block', {part, index, offset: pos - finalOffset})

    return {
      part,
      index,
      offset: pos - finalOffset
    }
  }

  function resetBlock (block, currentPos, diff) {
    block.parts = scanBlock(block)

    let { index, offset } = findPosInBlock(block, currentPos + diff)

    render(() => {
      setCaret(state.selection.cache, block, index, offset)
    })
  }

  emitter.on('keypress:return', () => {
    if (state.selection.isCollapsed) {
      const currentBlock = state.selection.focusBlock
      const partIndex = state.selection.focusPartIndex
      const lastPartIndex = currentBlock.parts.length - 1
      const partOffset = state.selection.focusPartOffset
      const currentLength = state.selection.focusPart.length

      if (!(partIndex === lastPartIndex && partOffset === currentLength)) {
        console.error('do not support splitting blocks with return yet')
        return
      }

      const block = newEmptyBlock()
      let index = state.selection.focusBlockIndex

      // this should never happen
      if (index === -1) {
        console.error("Why can't we find the focus block?")
        index = state.document.length - 1
      }

      state.document.splice(index + 1, 0, block)

      render(() => {
        setCaret(state.selection.cache, block, 0, 0)
      })
    } else {
      console.error("I don't support hitting return with a range selected yet")
    }
  })

  // just in case
  document.execCommand('defaultParagraphSeparator', false, 'p')

  document.addEventListener('selectionchange', e => {
    if (state.isEditing) {
      emitter.emit('selection:update', getCurrentSelection())
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

function scanBlock (block) {
  const text = block.parts.map(p => p.text).join('')
  const expectedLength = block.parts.reduce((acc, p) => acc + p.length, 0)

  if (text.length !== expectedLength) {
    console.error('the concatted text is not the same length as the calculated combined lengths', text.length, expectedLength)
  }

  const results = scanLine(text)

  const newParts = []

  results.forEach(style => {
    newParts.push({
      type: 'text',
      styleType: style.styleType,
      styleSubType: style.styleSubType,
      text: style.text,
      length: style.length
    })
  })

  return newParts
}

function setCaret (sel, block, part, pos) {
  const el = findBlockEl(block)
  const partEl = el.querySelector(`[data-part][data-index="${part}"]`)

  if (partEl.childNodes.length !== 1) {
    console.error('this part has more than one text node which means something has gone very wrong')
  }

  const textNode = partEl.childNodes[0]

  console.debug('setting caret', partEl, textNode, pos)

  // must set the selection on the text node and not the part or it will
  // actually put the cursor in hard to predict places
  sel.collapse(textNode, pos)
}

function findBlockEl (blockOrID) {
  if (blockOrID._cid) {
    blockOrID = blockOrID._cid
  }

  return document.querySelector(`#editor [data-cid="${blockOrID}"]`)
}

function raf (cb) {
  window.requestAnimationFrame(cb)
}

function getCurrentSelection () {
  // the understanding is that we are always in a pre tag

  const sel = window.getSelection()

  const anchorBlockNode = sel.anchorNode.parentNode.closest('[data-block]')
  const anchorPartNode = sel.anchorNode.parentNode.closest('[data-part]')
  const anchorBlockID = anchorBlockNode.getAttribute('data-cid')
  const anchorBlockIndex = parseInt(anchorBlockNode.getAttribute('data-index'), 10)
  const anchorPartIndex = parseInt(anchorPartNode.getAttribute('data-index'), 10)
  const anchorPartOffset = sel.anchorOffset

  const focusBlockNode = sel.focusNode.parentNode.closest('[data-block]')
  const focusPartNode = sel.focusNode.parentNode.closest('[data-part]')
  const focusBlockID = focusBlockNode.getAttribute('data-cid')
  const focusBlockIndex = parseInt(focusBlockNode.getAttribute('data-index'), 10)
  const focusPartIndex = parseInt(focusPartNode.getAttribute('data-index'), 10)
  const focusPartOffset = sel.focusOffset

  const isCollapsed = sel.isCollapsed
  const isSameBlock = focusBlockID === anchorBlockID
  const isSamePart = isSameBlock && focusPartIndex === anchorPartIndex

  return {
    anchorBlockID,
    anchorBlockIndex,
    anchorPartIndex,
    anchorPartOffset,
    focusBlockID,
    focusBlockIndex,
    focusPartIndex,
    focusPartOffset,
    isCollapsed,
    isSameBlock,
    isSamePart,
    cache: sel
  }
}

function newTextPart (text) {
  return {
    type: 'text',
    styleType: 'plain',
    length: text.length,
    text
  }
}

function newEmptyBlock () {
  return {
    type: 'block',
    parts: [newTextPart('')],
    _cid: nextCID()
  }
}

let currentCID = 0
function nextCID () {
  currentCID += 1
  return 'cid-' + currentCID
}

function assignCIDs (list) {
  if (!Array.isArray(list)) { return }

  for (let block of list) {
    if (!block._cid) {
      block._cid = nextCID()
    }
  }

  return list
}

import './scan-line'

export default (state, emitter) => {
  state.document = [
    {type: 'block', parts: [{type: 'text', text: 'Hello world', length: 11}]}
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
    state.selection = update

    // prevent anyone from putting their cursor to the right of the nbsp that
    // is there for empty blocks
    if (state.selection.isCollapsed && state.selection.focusOffset === 1) {
      const block = findBlock(state.document, state.selection.focusID)
      console.debug('block', block)
      if (block.parts.length === 0) {
        setCaret(state.selection.cache, block, 0)
      }
    }
  })

  emitter.on('slurp', () => {
    const block = findBlock(state.document, state.selection.focusID)
    console.debug('block', block)
    const el = findBlockEl(block)
    console.debug('el', el)
    const index = state.selection.focusPart
    console.debug('index', index)
    const partEl = el.querySelector(`[data-part][data-index="${index}"]`)
    console.debug('partEl', partEl)

    // If we were empty and this is the first character entered, then make a
    // new part and re-render to clear the nbsp that is the placeholder for
    // empty lines
    if (block.parts.length === 0 && index === 0) {
      const text = stripSpaces(partEl.innerText)
      const newPart = newTextPart(text)
      console.debug('new part', newPart)
      block.parts.push(newPart)
      render()
      setCaret(state.selection.cache, block, 1)
    } else {
      let structureHasChanged = false

      const part = block.parts[index]

      if (partEl.getAttribute('data-part-type') === 'text') {
        part.text = partEl.innerText
        part.length = part.text.length
      } else {
        console.error('do not support non-text parts yet')
      }

      if (structureHasChanged) {
        render()
      }
    }
  })

  // const nbsp = ' '

  emitter.on('keypress:space', () => {
    if (state.selection.isCollapsed) {
      const block = findBlock(state.document, state.selection.focusID)
      const partIndex = state.selection.focusPart
      const backset = block.parts.slice(0, partIndex).reduce((acc, p) => p.length + acc, 0)
      const offset = state.selection.focusOffset - backset
      const part = block.parts[partIndex]
      const characterBefore = part.text.substr(offset - 1, 1)

      if (characterBefore === ' ') {
        // insertAtCursor(nbsp)
      } else {
        // insertAtCursor(' ')
      }
    } else {
      console.error("I don't support hitting space with a range selected yet")
    }
  })

  emitter.on('keypress:return', () => {
    if (state.selection.isCollapsed) {
      const currentBlock = findBlock(state.document, state.selection.focusID)
      const currentLength = blockLength(currentBlock)

      if (currentLength > 0 && state.selection.focusOffset !== currentLength) {
        console.debug(state.selection.focusOffset, currentLength)
        console.error('do not support splitting blocks with return yet')
        return
      }

      const block = newEmptyBlock()
      let index = findBlockIndex(state.document, state.selection.focusID)

      // this should never happen
      if (index === -1) {
        console.error("Why can't we find the focus block?")
        index = state.document.length - 1
      }

      state.document.splice(index + 1, 0, block)

      render()
      setCaret(state.selection.cache, block, 0)
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

  function render () {
    emitter.emit('render')
  }
}

function blockLength (block) {
  if (block.parts.length === 0) {
    return 0
  } else {
    return block.parts.reduce((acc, part) => {
      return acc + part.length
    }, 0)
  }
}

function setCaret (sel, block, pos) {
  raf(() => {
    const el = findBlockEl(block)
    const index = findPartIndexAtPos(block, pos)
    const partEl = el.querySelector(`[data-part][data-index="${index}"]`)
    // TODO: pos needs to combine all the part's lengths before the found part
    sel.collapse(partEl, pos)
  })
}

function findPartIndexAtPos (block, pos) {
  if (block.parts.length === 0) { return 0 }
  if (pos === 0) { return 0 }
  if (block.parts.length === 0) { return 0 }

  let count = 0
  for (let i in block.parts) {
    const p = block.parts[i]
    count += p.length
    if (pos <= count) { return i }
  }

  // This should never happen
  return block.parts[block.parts.length - 1]
}

function findBlock (doc, cid) {
  return doc.find(b => b._cid === cid)
}

function findBlockIndex (doc, cid) {
  return doc.findIndex(b => b._cid === cid)
}

function stripSpaces (string) {
  return string.replace(/&nbsp;|\u202F|\u00A0|\s/g, '')
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
  const sel = window.getSelection()

  const anchorBlockNode = sel.anchorNode.parentNode.closest('[data-block]')
  const anchorPartNode = sel.anchorNode.parentNode.closest('[data-part]')
  const anchorID = anchorBlockNode.getAttribute('data-cid')
  const anchorPart = parseInt(anchorPartNode.getAttribute('data-index'), 10)
  const anchorOffset = sel.anchorOffset

  const focusBlockNode = sel.focusNode.parentNode.closest('[data-block]')
  const focusPartNode = sel.focusNode.parentNode.closest('[data-part]')
  const focusID = focusBlockNode.getAttribute('data-cid')
  const focusPart = parseInt(focusPartNode.getAttribute('data-index'), 10)
  const focusOffset = sel.focusOffset

  const isCollapsed = sel.isCollapsed
  const isSameNode = isCollapsed || isSameBlockNode(anchorBlockNode, focusBlockNode)

  return {
    anchorID,
    anchorPart,
    anchorOffset,
    focusID,
    focusPart,
    focusOffset,
    isCollapsed,
    isSameNode,
    cache: sel
  }
}

// function isSameBlock (left, right) {
//   return left._cid === right._cid
// }

function isSameBlockNode (left, right) {
  return left.getAttribute('data-cid') === right.getAttribute('data-cid')
}

function newTextPart (text) {
  return {
    type: 'text',
    length: text.length,
    text
  }
}

function newEmptyBlock () {
  return {
    type: 'block',
    parts: [],
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

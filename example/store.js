import './scan-line'

export default (state, emitter) => {
  state.document = [
    {
      type: 'block',
      parts: [
        { type: 'text', text: 'Hello world  ', length: 12 },
        { type: 'bold', text: '**hooray**', length: 10 }
      ]
    },
    {
      type: 'block',
      parts: [
        { type: 'text', text: '', length: 0 }
      ]
    },
    {
      type: 'block',
      parts: [
        { type: 'text', text: '    Nathan', length: 10 }
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
    state.selection = update

    // prevent anyone from putting their cursor to the right of the nbsp that
    // is there for empty blocks
    if (state.selection.focusPart === 0 && state.selection.focusPartOffset === 1) {
      const block = findBlock(state.document, state.selection.focusID)

      // if there is only one part...
      if (block.parts.length === 1) {
        const part = block.parts[0]

        // ...and it's empty
        if (part.text === '') {
          // move the cursor to the left of the fake nbsp
          raf(() => {
            // sel, block, part 0, character 0
            setCaret(state.selection.cache, block, 0, 0)
          })
        }
      }
    }
  })

  const nbspRegExp = /^.+&nbsp;$/

  emitter.on('slurp', () => {
    const block = findBlock(state.document, state.selection.focusID)
    const el = findBlockEl(block)
    const index = state.selection.focusPart
    const part = block.parts[index]
    const partEl = el.querySelector(`[data-part][data-index="${index}"]`)
    let text = partEl.innerText

    // there is only one empty text part, which means we are rendering it funny
    if (block.parts.length === 1 && index === 0 && part.text === '') {
      const html = partEl.innerHTML

      console.debug('html', html)

      if (text.length > 1 && html.match(nbspRegExp)) {
        text = text.substr(0, text.length - 1)

        part.text = text
        part.length = text.length

        render(() => {
          setCaret(state.selection.cache, block, index, text.length)
        })
      }
    } else {
      part.text = text
      part.length = text.length
    }
  })
  // const spaceCharacter = ' '

  emitter.on('keypress:return', () => {
    if (state.selection.isCollapsed) {
      const currentBlock = findBlock(state.document, state.selection.focusID)
      const currentLength = blockLength(currentBlock)

      if (currentLength > 0 && state.selection.focusPartOffset !== currentLength) {
        console.debug(state.selection.focusPartOffset, currentLength)
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

function blockLength (block) {
  if (block.parts.length === 0) {
    return 0
  } else {
    return block.parts.reduce((acc, part) => {
      return acc + part.length
    }, 0)
  }
}

function setCaret (sel, block, part, pos) {
  const el = findBlockEl(block)
  const partEl = el.querySelector(`[data-part][data-index="${part}"]`)

  console.debug('setting caret', partEl, pos)

  sel.collapse(partEl, pos)
}

function findBlock (doc, cid) {
  return doc.find(b => b._cid === cid)
}

function findBlockIndex (doc, cid) {
  return doc.findIndex(b => b._cid === cid)
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
  const anchorID = anchorBlockNode.getAttribute('data-cid')
  const anchorPart = parseInt(anchorPartNode.getAttribute('data-index'), 10)
  const anchorPartOffset = sel.anchorOffset

  const focusBlockNode = sel.focusNode.parentNode.closest('[data-block]')
  const focusPartNode = sel.focusNode.parentNode.closest('[data-part]')
  const focusID = focusBlockNode.getAttribute('data-cid')
  const focusPart = parseInt(focusPartNode.getAttribute('data-index'), 10)
  const focusPartOffset = sel.focusOffset

  const isCollapsed = sel.isCollapsed
  const isSameBlock = focusID === anchorID
  const isSamePart = isSameBlock && focusPart === anchorPart

  return {
    anchorID,
    anchorPart,
    anchorPartOffset,
    focusID,
    focusPart,
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

import { findPosInBlock } from './model'

export function sel () {
  return window.getSelection()
}

export function el (blockID, partIndex) {
  // We allow people to pass in a block or block id
  if (blockID._cid !== undefined) { blockID = blockID._cid }

  const blockEl = document.querySelector(`#editor [data-block][data-cid="${blockID}"]`)

  if (!blockEl) {
    console.error('Could not find the block element', { blockID })
    return null
  }

  if (partIndex === undefined) {
    return blockEl
  }

  return blockEl.querySelector(`[data-part][data-index="${partIndex}"]`)
}

// TODO: setCaret should take no arguments and instead there should be some desired selection state that it refers to

export function setCaret (block, pos) {
  const { index, offset } = findPosInBlock(block, pos)
  const _el = el(block._cid, index)
  const _sel = sel()

  if (_el.childNodes.length !== 1) {
    console.error('this part has more than one text node which means something has gone very wrong')
  }

  const textNode = _el.childNodes[0]

  console.debug('setting caret', _el, textNode, offset)

  _sel.collapse(textNode, offset)
}

export function current () {
  // the understanding is that we are always in a pre tag

  const _sel = sel()

  const anchorBlockNode = _sel.anchorNode.parentNode.closest('[data-block]')
  const anchorPartNode = _sel.anchorNode.parentNode.closest('[data-part]')
  const anchorBlockID = anchorBlockNode.getAttribute('data-cid')
  const anchorBlockIndex = parseInt(anchorBlockNode.getAttribute('data-index'), 10)
  const anchorPartIndex = parseInt(anchorPartNode.getAttribute('data-index'), 10)
  const anchorPartOffset = _sel.anchorOffset

  const focusBlockNode = _sel.focusNode.parentNode.closest('[data-block]')
  const focusPartNode = _sel.focusNode.parentNode.closest('[data-part]')
  const focusBlockID = focusBlockNode.getAttribute('data-cid')
  const focusBlockIndex = parseInt(focusBlockNode.getAttribute('data-index'), 10)
  const focusPartIndex = parseInt(focusPartNode.getAttribute('data-index'), 10)
  const focusPartOffset = _sel.focusOffset

  const isCollapsed = _sel.isCollapsed
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
    isSamePart
  }
}

export function updateState (state, update) {
  update.anchorBlock = state.document[update.anchorBlockIndex]
  update.anchorPart = update.anchorBlock.parts[update.anchorPartIndex]

  update.focusBlock = state.document[update.focusBlockIndex]
  update.focusPart = update.focusBlock.parts[update.focusPartIndex]

  state.selection = update

  return state
}

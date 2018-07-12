import { posInBlockAtPartAndOffset, findPosInBlock } from './model'
import { findBlockIndex } from './transforms'

const aToF = 'a->f'
const fToA = 'f->a'

export class Point {
  constructor (blockID, partIndex, offset) {
    this.blockID = blockID
    this.partIndex = partIndex
    this.offset = offset
    this.block = undefined
    this.blockIndex = undefined
    this.part = undefined
    this.pos = undefined
  }

  get blockEl () { return getBlockEl(this) }
  get el () { return getPartEl(this) }

  get textNode () {
    const _el = this.el
    if (_el.childNodes.length !== 1) {
      console.error('this part has more than one text node which means something has gone very wrong', _el.childNodes)
    }
    return _el.childNodes[0]
  }

  assign ({ block, blockIndex, part, pos }) {
    if (block !== undefined) { this.block = block }
    if (blockIndex !== undefined) { this.blockIndex = blockIndex }
    if (part !== undefined) { this.part = part }
    if (pos !== undefined) { this.pos = pos }

    if (this.part === undefined && this.block !== undefined) {
      this.part = this.block.parts[this.partIndex]
    }

    if (this.pos === undefined && this.block !== undefined) {
      this.pos = posInBlockAtPartAndOffset(this.block, this.partIndex, this.offset)
    }

    return this
  }

  assignFromDocument (document) {
    let update = {}

    if (this.blockIndex === undefined) {
      update.blockIndex = findBlockIndex(document, this.blockID)
    } else {
      update.blockIndex = this.blockIndex
    }

    if (this.block === undefined) {
      update.block = document[update.blockIndex]
    }

    this.assign(update) // update this.part and this.pos over there

    return this
  }
}

Point.fromBlockPos = (block, pos) => {
  const { index, offset } = findPosInBlock(block, pos)
  const point = new Point(block._cid, index, offset)
  point.assign({ block, pos })
  return point
}

export class Selection {
  constructor (anchorPoint, focusPoint = null) {
    this.anchor = anchorPoint
    this.focus = focusPoint || anchorPoint

    if (this.isCollapsed) {
      this.direction = null
      this.begin = this.anchor
      this.end = this.anchor
    } else if (this.isSameBlock) {
      if (this.anchor.pos < this.focus.pos) {
        this.direction = aToF
        this.begin = this.anchor
        this.end = this.focus
      } else {
        this.direction = fToA
        this.begin = this.focus
        this.end = this.anchor
      }
    } else {
      if (this.anchor.blockIndex < this.focus.blockIndex) {
        this.direction = aToF
        this.begin = this.anchor
        this.end = this.focus
      } else {
        this.direction = fToA
        this.begin = this.focus
        this.end = this.anchor
      }
    }
  }

  get isSameBlock () { return this.anchor.blockID === this.focus.blockID }
  get isSamePart () { return this.isSameBlock && this.anchor.partIndex === this.focus.partIndex }
  get isCollapsed () { return this.isSamePart && this.anchor.offset === this.focus.offset }

  render () {
    const _sel = sel()

    if (this.isCollapsed) {
      _sel.collapse(this.end.textNode, this.end.offset)
    } else {
      _sel.setBaseAndExtent(this.anchor.textNode, this.anchor.offset, this.focus.textNode, this.focus.offset)
      // TODO: maybe use an older API to support IE?
    }
  }
}

function getBlockEl (point) {
  const blockEl = document.querySelector(`#editor [data-block][data-cid="${point.blockID}"]`)

  if (!blockEl) {
    console.error('Could not find the block element', point.blockID)
    return null
  }

  return blockEl
}

function getPartEl (point) {
  const blockEl = getBlockEl(point)
  if (!blockEl) { return null }

  const partEl = blockEl.querySelector(`[data-part][data-index="${point.partIndex}"]`)

  if (!partEl) {
    console.error('Could not find the part element', point.partID)
    return null
  }

  return partEl
}

function sel () {
  return window.getSelection()
}

export function current (state) {
  // the understanding is that we are always in a pre tag

  const _sel = sel()

  if (_sel.type === 'None') {
    return null
  }

  const anchorBlockNode = _sel.anchorNode.parentNode.closest('[data-block]')
  const anchorPartNode = _sel.anchorNode.parentNode.closest('[data-part]')
  const anchorBlockID = anchorBlockNode.getAttribute('data-cid')
  const anchorPartIndex = parseInt(anchorPartNode.getAttribute('data-index'), 10)
  const anchorOffset = _sel.anchorOffset

  const focusBlockNode = _sel.focusNode.parentNode.closest('[data-block]')
  const focusPartNode = _sel.focusNode.parentNode.closest('[data-part]')
  const focusBlockID = focusBlockNode.getAttribute('data-cid')
  const focusPartIndex = parseInt(focusPartNode.getAttribute('data-index'), 10)
  const focusOffset = _sel.focusOffset

  const anchorPoint = new Point(anchorBlockID, anchorPartIndex, anchorOffset)
  anchorPoint.assignFromDocument(state.document)

  const focusPoint = new Point(focusBlockID, focusPartIndex, focusOffset)
  focusPoint.assignFromDocument(state.document)

  const selection = new Selection(anchorPoint, focusPoint)

  return selection
}

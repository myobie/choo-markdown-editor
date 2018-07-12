import { blockLength } from './model'
import { deleteBlockIndexRange, deleteRange, mergeBlocks, splitBlock } from './transforms'
import { Point, Selection } from './selection'

export function keyReturn (state) {
  if (state.selection.isSameBlock) {
    const block = state.selection.end.block
    const beginPos = state.selection.begin.pos
    const endPos = state.selection.end.pos

    const { newBlock } = splitBlock(state.document, block, beginPos, endPos)

    const newPoint = Point.fromBlockPos(newBlock, 0).assignFromDocument(state.document)
    state.nextSelection = new Selection(newPoint)
  } else {
    const leftBlock = state.selection.begin.block
    const leftBlockIndex = state.selection.begin.blockIndex
    const leftPos = state.selection.begin.pos
    const lastPos = blockLength(leftBlock) - 1

    const rightBlock = state.selection.end.block
    const rightBlockIndex = state.selection.end.blockIndex
    const rightPos = state.selection.end.pos

    deleteRange(state.document, leftBlock, leftPos, leftBlock, lastPos)
    const { newBlock } = deleteRange(state.document, rightBlock, 0, rightBlock, rightPos)

    // remove anything between these two
    if (leftBlockIndex + 1 <= rightBlockIndex - 1) {
      deleteBlockIndexRange(state.document, leftBlockIndex + 1, rightBlockIndex - 1)
    }

    const newPoint = Point.fromBlockPos(newBlock, 0).assignFromDocument(state.document)
    state.nextSelection = new Selection(newPoint)
  }
}

export function keyBackspace (state) {
  if (state.selection.isCollapsed) {
    const block = state.selection.end.block
    const blockIndex = state.selection.end.blockIndex
    const pos = state.selection.end.pos

    if (pos === 0) {
      if (blockIndex === 0) { return } // do nothing if we are at the beginning of the document

      const oldBlock = state.document[blockIndex - 1]
      const { newBlock } = mergeBlocks(state.document, blockIndex - 1, blockIndex)

      const newPoint = Point.fromBlockPos(newBlock, blockLength(oldBlock)).assignFromDocument(state.document)
      state.nextSelection = new Selection(newPoint)
    } else {
      const { newBlock } = deleteRange(state.document, block, pos - 1, block, pos)

      const newPoint = Point.fromBlockPos(newBlock, pos - 1).assignFromDocument(state.document)
      state.nextSelection = new Selection(newPoint)
    }
  } else {
    removeSelectedRange(state)
  }
}

export function keyDelete (state) {
  if (state.selection.isCollapsed) {
    const block = state.selection.end.block
    const lastBlockIndex = state.document.length - 1
    const lastPos = blockLength(block) - 1
    const blockIndex = state.selection.end.blockIndex
    const pos = state.selection.end.pos

    if (pos === lastPos) {
      if (blockIndex === lastBlockIndex) { return } // do nothing if we are at the end of the document

      const { newBlock } = mergeBlocks(state.document, blockIndex, blockIndex + 1)

      const newPoint = Point.fromBlockPos(newBlock, lastPos).assignFromDocument(state.document)
      state.nextSelection = new Selection(newPoint)
    } else {
      const { newBlock } = deleteRange(state.document, block, pos, block, pos + 1)

      const newPoint = Point.fromBlockPos(newBlock, pos).assignFromDocument(state.document)
      state.nextSelection = new Selection(newPoint)
    }
  } else {
    removeSelectedRange(state)
  }
}

function removeSelectedRange (state) {
  const leftBlock = state.selection.begin.block
  const leftPos = state.selection.begin.pos

  const rightBlock = state.selection.end.block
  const rightPos = state.selection.end.pos

  const { newBlock } = deleteRange(state.document, leftBlock, leftPos, rightBlock, rightPos)

  const newPoint = Point.fromBlockPos(newBlock, leftPos).assignFromDocument(state.document)
  state.nextSelection = new Selection(newPoint)
}

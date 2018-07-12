import { blockLength, posInBlockAtPartAndOffset } from './model'
import { deleteRange, mergeBlocks, splitBlock } from './transforms'

export function keyReturn (state) {
  if (state.selection.isCollapsed) {
    const block = state.selection.focusBlock
    const index = state.selection.focusPartIndex
    const offset = state.selection.focusPartOffset
    const pos = posInBlockAtPartAndOffset(block, index, offset)

    const { newBlock } = splitBlock(state.document, block, pos)

    state.nextSelection = {
      isCollapsed: true,
      focusBlock: newBlock,
      focusPartIndex: 0,
      focusPartOffset: 0
    }
  } else {
    console.error("I don't support hitting return with a range selected yet")
  }
}

export function keyBackspace (state) {
  if (state.selection.isCollapsed) {
    const block = state.selection.focusBlock
    const blockIndex = state.selection.focusBlockIndex
    const index = state.selection.focusPartIndex
    const offset = state.selection.focusPartOffset
    const pos = posInBlockAtPartAndOffset(block, index, offset)

    if (pos === 0) {
      if (blockIndex === 0) { return } // do nothing if we are at the beginning of the document

      const oldBlock = state.document[blockIndex - 1]
      const { newBlock } = mergeBlocks(state.document, blockIndex - 1, blockIndex)

      state.nextSelection = {
        isCollapsed: true,
        focusBlock: newBlock,
        focusPos: blockLength(oldBlock)
      }
    } else {
      const { newBlock } = deleteRange(state.document, block, pos - 1, block, pos)

      state.nextSelection = {
        isCollapsed: true,
        focusBlock: newBlock,
        focusPos: pos - 1
      }
    }
  } else {
    const leftBlock = state.selection.anchorBlock
    const leftIndex = state.selection.anchorPartIndex
    const leftOffset = state.selection.anchorPartOffset
    const leftPos = posInBlockAtPartAndOffset(leftBlock, leftIndex, leftOffset)

    const rightBlock = state.selection.focusBlock
    const rightIndex = state.selection.focusPartIndex
    const rightOffset = state.selection.focusPartOffset
    const rightPos = posInBlockAtPartAndOffset(rightBlock, rightIndex, rightOffset)

    const { newBlock } = deleteRange(state.document, leftBlock, leftPos, rightBlock, rightPos)

    state.nextSelection = {
      isCollapsed: true,
      focusBlock: newBlock,
      focusPos: leftPos
    }
  }
}

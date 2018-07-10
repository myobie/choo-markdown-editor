import { newEmptyBlock } from './model'

export function keyReturn (state) {
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

    // TODO: need to update the desired selection to be collapsed and pos 0 in the focus block

    return state
  } else {
    console.error("I don't support hitting return with a range selected yet")

    return state
  }
}

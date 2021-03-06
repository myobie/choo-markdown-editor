import { newBlock, newPart, isSameBlock, blockText } from './model'

export function replacePart (block, part, index) {
  block.parts.splice(index, 1, part)
}

export function insertBlockBefore (document, block, index) {
  document.splice(index, 0, block)
}

export function insertBlockAfter (document, block, index) {
  document.splice(index + 1, 0, block)
}

export function replaceBlockAt (document, block, index) {
  document.splice(index, 1, block)
}

export function splitBlock (document, block, beginPos, endPos) {
  if (endPos === undefined) { endPos = beginPos }

  const blockIndex = findBlockIndex(document, block)
  const _text = blockText(block)

  let leftText = _text.slice(0, beginPos)
  // the parts between beginPos and endPos are lost
  let rightText = _text.slice(endPos)

  // TODO: scanLine
  // TODO: if a block had a style (like code or bullet) then copy that style
  //       and possibly a prefix to the new right block from the left
  const left = newBlock([newPart(leftText)])
  const right = newBlock([newPart(rightText)])

  replaceBlockAt(document, left, blockIndex)
  insertBlockAfter(document, right, blockIndex)

  return {
    replacementBlock: left,
    newBlock: right
  }
}

export function mergeBlocks (document, leftBlockIndex, rightBlockIndex) {
  const leftBlock = document[leftBlockIndex]
  const rightBlock = document[rightBlockIndex]

  const text = blockText(leftBlock) + blockText(rightBlock)

  const block = newBlock([newPart(text)])

  replaceBlockAt(document, block, leftBlockIndex)

  document.splice(rightBlockIndex, 1)

  return { newBlock: block }
}

export function deleteBlockIndexRange (document, leftBlockIndex, rightBlockIndex) {
  const amount = rightBlockIndex - leftBlockIndex + 1
  document.splice(leftBlockIndex, amount)
}

export function deleteRange (document, leftBlock, leftPos, rightBlock, rightPos) {
  if (isSameBlock(leftBlock, rightBlock)) {
    const index = findBlockIndex(document, leftBlock)
    let text = blockText(leftBlock)
    text = text.slice(0, leftPos) + text.slice(rightPos)
    const block = newBlock([newPart(text)])
    replaceBlockAt(document, block, index)

    return { newBlock: block }
  } else {
    const leftIndex = findBlockIndex(document, leftBlock)
    const rightIndex = findBlockIndex(document, rightBlock)

    let leftText = blockText(leftBlock)
    let rightText = blockText(rightBlock)

    let text = leftText.slice(0, leftPos) + rightText.slice(rightPos)

    // TODO: scan line
    const newFocusBlock = newBlock([newPart(text)])

    replaceBlockAt(document, newFocusBlock, leftIndex)

    const diff = rightIndex - leftIndex

    if (diff > 0) {
      document.splice(leftIndex + 1, diff)
    }

    return { newBlock: newFocusBlock }
  }
}

export function findBlockIndex (document, cid) {
  // we allow one to pass a block or a block id
  if (cid._cid !== undefined) { cid = cid._cid }

  return document.findIndex(b => b._cid === cid)
}

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

export function splitBlock (document, block, pos) {
  const blockIndex = findBlockIndex(document, block)
  console.debug({ blockIndex })
  const _text = blockText(block)

  let leftText = _text.slice(0, pos)
  let rightText = _text.slice(pos)

  console.debug('leftText', leftText, 'rightText', rightText)

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

export function deleteRange (document, leftBlock, leftPos, rightBlock, rightPos) {
  if (isSameBlock(leftBlock, rightBlock)) {
    const index = findBlockIndex(document, leftBlock)
    let text = blockText(leftBlock)
    text = text.slice(0, leftPos) + text.slice(rightPos, -1)
    const block = newBlock([newPart(text)])
    replaceBlockAt(document, block, index)
  } else {
    const leftIndex = findBlockIndex(leftBlock)
    const rightIndex = findBlockIndex(rightBlock)

    let leftText = blockText(leftBlock)
    leftText = leftText.slice(0, leftPos)
    const newLeftBlock = newBlock([newPart(leftText)])

    let rightText = blockText(rightBlock)
    rightText = rightText.slice(0, rightPos)
    const newRightBlock = newBlock([newPart(rightText)])

    replaceBlockAt(document, newLeftBlock, leftIndex)
    replaceBlockAt(document, newRightBlock, rightIndex)

    const diff = rightIndex - leftIndex

    if (diff > 0) {
      document.splice(leftIndex, diff)
    }
  }
}

function findBlockIndex (document, cid) {
  // we allow one to pass a block or a block id
  if (cid._cid !== undefined) { cid = cid._cid }

  return document.findIndex(b => b._cid === cid)
}

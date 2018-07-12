// import { scanLine } from './scan-line'

export function reScanBlock (block) {
  const text = blockText(block)
  const expectedLength = blockLength(block)

  // TODO: use assert
  if (text.length !== expectedLength) {
    console.error('the concatted text is not the same length as the calculated combined lengths', text.length, expectedLength)
  }

  // TODO: actually use scan-line
  block.parts = [newPart(text)]
}

export function updatePart (part, text, attrs = {}) {
  return Object.assign({}, part, attrs, { text, length: text.length })
}

export function newPart (text, attrs = {}) {
  return Object.assign({ styles: [] }, attrs, { text, length: text.length })
}

export function newEmptyBlock () {
  return newBlock([newPart('')])
}

export function newBlock (children) {
  return {
    type: 'block',
    parts: children,
    _cid: nextCID()
  }
}

export function blockText (block) {
  return block.parts.reduce((acc, p) => acc + p.text, '')
}

export function blockLength (block) {
  return block.parts.reduce((acc, p) => acc + p.length, 0)
}

export function isSameBlock (left, right) {
  return left._cid === right._cid
}

export function posInBlockAtPartAndOffset (block, partIndex, offset) {
  const preOffset = block.parts.slice(0, partIndex).reduce((acc, p) => acc + p.length, 0)
  return preOffset + offset
}

export function findPosInBlock (block, pos) {
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
      break
    }

    finalOffset = insideOffset // get ready to loop around
  }

  if (!found) {
    console.error('for loop should never fail, but it did')
  }

  return {
    part,
    index,
    offset: pos - finalOffset
  }
}

let currentCID = 0
function nextCID () {
  currentCID += 1
  return 'cid-' + currentCID
}

// function assignCIDs (list) {
//   if (!Array.isArray(list)) { return }
//
//   for (let block of list) {
//     if (!block._cid) {
//       block._cid = nextCID()
//     }
//   }
//
//   return list
// }

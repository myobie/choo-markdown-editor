import { scanLine } from './scan-line'

export function scanBlock (block) {
  const text = block.parts.map(p => p.text).join('')
  const expectedLength = block.parts.reduce((acc, p) => acc + p.length, 0)

  // TODO: use assert
  if (text.length !== expectedLength) {
    console.error('the concatted text is not the same length as the calculated combined lengths', text.length, expectedLength)
  }

  const results = scanLine(text)

  const newParts = []

  results.forEach(style => {
    newParts.push({
      type: 'text',
      styleType: style.styleType,
      styleSubType: style.styleSubType,
      text: style.text,
      length: style.length
    })
  })

  return newParts
}

export function newPart (text, attrs = {}) {
  return Object.assign({ styleType: 'plain' }, attrs, { text, length: text.length })
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

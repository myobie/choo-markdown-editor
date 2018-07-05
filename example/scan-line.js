// NOTE: each style regex is required to fully capture itself so it can be inserted into the larger regex
const styles = [
  { type: 'code', regex: /((``)(.+?)``)/, captures: 3, tell: { capture: 2, text: '``' }, inner: { capture: 3 } },
  { type: 'code', regex: /((`)(.+?)`)/, captures: 3, tell: { capture: 2, text: '`' }, inner: { capture: 3 } },
  { type: 'link', subType: 'imageFull', regex: /((!\[)(.+?)(]\()(.+?)\))/, captures: 5, tells: [{ capture: 2, text: '![' }, { capture: 4, text: '](' }] },
  { type: 'link', subType: 'linkFull', regex: /((\[)(.+?)(]\()(.+?)\))/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: '](' }] },
  { type: 'link', subType: 'imageRef', regex: /((!\[)(.+?)(]\[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '![' }, { capture: 4, text: '][' }] },
  { type: 'link', subType: 'imageRef', regex: /((!\[)(.+?)(] \[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '![' }, { capture: 4, text: '] [' }] },
  { type: 'link', subType: 'linkRef', regex: /((\[)(.+?)(]\[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: '][' }] },
  { type: 'link', subType: 'linkRef', regex: /((\[)(.+?)(] \[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: '] [' }] },
  { type: 'link', subType: 'ref', regex: /(^\s*(\[)(.+?)(]:\s)\s*(.+?)$)/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: ']: ' }] },
  { type: 'link', subType: 'autoLink', regex: /((<)(.+?\..+?)>)/, captures: 3, tell: { capture: 2, text: '<' }, inner: { capture: 3 } },
  { type: 'bold', regex: /((\*\*)(.+?)\*\*)/, captures: 3, requireSurroundingSpaces: true, tell: { capture: 2, text: '**' }, inner: { capture: 3 } },
  { type: 'bold', regex: /((__)(.+?)__)/, captures: 3, requireSurroundingSpaces: true, tell: { capture: 2, text: '__' }, inner: { capture: 3 } },
  { type: 'italic', regex: /((\*)(.+?)\*)/, captures: 3, requireSurroundingSpaces: true, tell: { capture: 2, text: '*' }, inner: { capture: 3 } },
  { type: 'italic', regex: /((_)(.+?)_)/, captures: 3, requireSurroundingSpaces: true, tell: { capture: 2, text: '_' }, inner: { capture: 3 } }
]

// TODO:
// * backslash escapes (\*foo\* shouldn't match anything)

// assign an offset to each style based on the # of captures preceeding it
let offset = 0
for (let style of styles) {
  style.offset = offset
  offset += style.captures
}

// match one of all the things we expect to find
const stylesRegex = new RegExp(styles.map(style => {
  return style.regex.source
}).join('|'), 'g')

function doesMatchStyle (match, style) {
  if (style.tell) {
    return doesMatchTell(match, style, style.tell)
  } else if (style.tells) {
    return style.tells.every(t => doesMatchTell(match, style, t))
  } else {
    return false
  }
}

function doesMatchTell (match, style, tell) {
  const tellIndex = style.offset + tell.capture

  if (match[tellIndex] === tell.text) {
    return true
  } else {
    return false
  }
}

export function scanLine (text) {
  if (text.length === 0) { return [] }

  let results = []
  let from = 0

  function preceededByASpace () {
    if (results.length === 0) {
      return true
    } else {
      const prevResult = results[results.length - 1]
      return prevResult.text.startsWith(' ')
    }
  }

  function proceededByASpace (match) {
    const indexAfterEndOfThisMatch = stylesRegex.lastIndex + match[0].length

    if (indexAfterEndOfThisMatch === text.length) {
      // must be the last match, so it's ok
      return true
    } else {
      const nextChar = text.substr(indexAfterEndOfThisMatch, 1)
      return nextChar === ' '
    }
  }

  let match
  while ((match = stylesRegex.exec(text)) !== null) {
    const matchedCharacters = match[0]
    const index = match.index

    if (index > from) {
      const beginningText = text.slice(from, index)
      results.push({
        styleType: 'plain',
        styleSubType: undefined,
        text: beginningText,
        index: 0,
        length: beginningText.length
      })
    }

    let neededSpaces = false
    let matchedStyle
    for (let style of styles) {
      if (doesMatchStyle(match, style)) {
        if (style.requireSurroundingSpaces && !preceededByASpace() && !proceededByASpace(match)) {
          neededSpaces = true
        } else {
          // let's go
          matchedStyle = style
          break
        }
      }
    }

    if (neededSpaces) {
      // just shove this into the last one since it didn't have a space
      const prevResult = results[results.length - 1]

      if (prevResult.styleType !== 'plain') {
        console.error('expected the previous result to be plain, but it was something else', prevResult)
      }

      prevResult.text += matchedCharacters
      prevResult.length = prevResult.text.length
    } else {
      if (!matchedStyle) {
        matchedStyle = { type: 'unknown' }
      }

      results.push({
        styleType: matchedStyle.type,
        styleSubType: matchedStyle.subType,
        text: matchedCharacters,
        index,
        length: matchedCharacters.length
      })
    }

    from = index + matchedCharacters.length
  }

  if (results.length > 0) {
    const lastItem = results[results.length - 1]
    const lastIndex = lastItem.index + lastItem.length

    if (lastIndex < text.length) {
      const lastText = text.slice(lastIndex)

      results.push({
        styleType: 'plain',
        styleSubType: undefined,
        text: lastText,
        index: lastIndex,
        length: lastText.length
      })
    }

    const finalResults = []
    let prevResult
    for (let r of results) {
      if (prevResult) {
        if (r.styleType === 'plain' && prevResult.styleType === 'plain') {
          // combine adjacent plain text parts
          prevResult.text += r.text
          prevResult.length = prevResult.text.length
        } else {
          finalResults.push(r)
        }
      } else {
        finalResults.push(r)
      }

      prevResult = r
    }

    return finalResults
  } else {
    return [{
      styleType: 'plain',
      styleSubType: undefined,
      text,
      index: 0,
      length: text.length
    }]
  }
}

window.scanLine = scanLine

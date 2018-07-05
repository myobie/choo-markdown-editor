// NOTE: each style regex is required to fully capture itself so it can be inserted into the larger regex
const styles = [
  { name: 'code', regex: /((``)(.+?)``)/, captures: 3, tell: { capture: 2, text: '``' }, inner: { capture: 3 } },
  { name: 'code', regex: /((`)(.+?)`)/, captures: 3, tell: { capture: 2, text: '`' }, inner: { capture: 3 } },
  { name: 'imageFull', regex: /((!\[)(.+?)(]\()(.+?)\))/, captures: 5, tells: [{ capture: 2, text: '![' }, { capture: 4, text: '](' }] },
  { name: 'linkFull', regex: /((\[)(.+?)(]\()(.+?)\))/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: '](' }] },
  { name: 'imageRef', regex: /((!\[)(.+?)(]\[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '![' }, { capture: 4, text: '][' }] },
  { name: 'imageRef', regex: /((!\[)(.+?)(] \[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '![' }, { capture: 4, text: '] [' }] },
  { name: 'linkRef', regex: /((\[)(.+?)(]\[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: '][' }] },
  { name: 'linkRef', regex: /((\[)(.+?)(] \[)(.*?)])/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: '] [' }] },
  { name: 'ref', regex: /(^\s*(\[)(.+?)(]:\s)\s*(.+?)$)/, captures: 5, tells: [{ capture: 2, text: '[' }, { capture: 4, text: ']: ' }] },
  { name: 'autoLink', regex: /((<)(.+?\..+?)>)/, captures: 3, tell: { capture: 2, text: '<' }, inner: { capture: 3 } },
  { name: 'bold', regex: /((\*\*)(.+?)\*\*)/, captures: 3, tell: { capture: 2, text: '**' }, inner: { capture: 3 } },
  { name: 'bold', regex: /((__)(.+?)__)/, captures: 3, tell: { capture: 2, text: '__' }, inner: { capture: 3 } },
  { name: 'italic', regex: /((\*)(.+?)\*)/, captures: 3, tell: { capture: 2, text: '*' }, inner: { capture: 3 } },
  { name: 'italic', regex: /((_)(.+?)_)/, captures: 3, tell: { capture: 2, text: '_' }, inner: { capture: 3 } }
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

  let match
  while ((match = stylesRegex.exec(text)) !== null) {
    const matchedCharacters = match[0]
    const index = match.index

    if (index > from) {
      const beginningText = text.slice(from, index)
      results.push({ type: 'plain', text: beginningText, index: 0, length: beginningText.length })
    }

    let matchedStyle
    for (let style of styles) {
      if (doesMatchStyle(match, style)) {
        matchedStyle = style
        break
      }
    }

    if (!matchedStyle) {
      matchedStyle = { name: 'unknown' }
    }

    const length = matchedCharacters.length

    results.push({
      type: matchedStyle.name,
      text: matchedCharacters,
      index,
      length
    })

    from = index + length
  }

  if (results.length > 0) {
    const lastItem = results[results.length - 1]
    const lastIndex = lastItem.index + lastItem.length

    if (lastIndex < text.length) {
      const lastText = text.slice(lastIndex)

      results.push({
        type: 'plain',
        text: lastText,
        index: lastIndex,
        length: lastText.length
      })
    }

    return results
  } else {
    return [{ type: 'text', text, index: 0, length: text.length }]
  }
}

window.scanLine = scanLine

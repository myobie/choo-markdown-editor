// NOTE: each style regex is required to fully capture itself so it can be inserted into the larger regex
const styles = [
  { name: 'code', regex: /((`)(.+?)`)/, captures: 3, tell: { capture: 2, text: '`' } },
  { name: 'emptyBold', regex: /(\*\*\*\*)/, captures: 1, tell: { capture: 1, text: '****' } },
  { name: 'bold', regex: /((\*\*)(.+?)\*\*)/, captures: 3, tell: { capture: 2, text: '**' } },
  { name: 'bold', regex: /((__)(.+?)__)/, captures: 3, tell: { capture: 2, text: '__' } },
  { name: 'italic', regex: /((\*)(.+?)\*)/, captures: 3, tell: { capture: 2, text: '*' } },
  { name: 'italic', regex: /((_)(.+?)_)/, captures: 3, tell: { capture: 2, text: '_' } }
]

// assign an offset to each style based on the # of captures preceeding it
let offset = 0
for (let style of styles) {
  style.offset = offset
  offset += style.captures
}

console.debug('styles', styles)

// match one of all the things we expect to find
const stylesRegex = new RegExp(styles.map(style => {
  return style.regex.source
}).join('|'), 'g')

console.debug('styles regex', stylesRegex)

export function scanLine (text) {
  if (text.length === 0) { return [] }

  let results = []
  let from = 0

  let match
  while ((match = stylesRegex.exec(text)) !== null) {
    console.debug('match', match)

    const matchedCharacters = match[0]
    const index = match.index

    if (index > from) {
      const beginningText = text.slice(from, index)
      results.push({ type: 'plain', text: beginningText, index: 0, length: beginningText.length })
    }

    let matchedStyle
    for (let style of styles) {
      const tellIndex = style.offset + style.tell.capture
      console.debug('tell index', tellIndex)
      const value = match[tellIndex]
      console.debug('value', value)
      if (value === style.tell.text) {
        matchedStyle = style
        break
      }
    }

    console.debug('matched style', matchedStyle)

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

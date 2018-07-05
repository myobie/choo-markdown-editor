const html = require('nanohtml')
const raw = require('nanohtml/raw')
const css = require('sheetify')

const styles = css`
  :host {
    min-height: 50vh;
  }

  :host:focus {
    outline: none;
  }

  :host {
    font-family: SF Mono, Consolas, monaco, monospace;
    font-size: 16px;
  }

  :host p {
    line-height: 1.3;
    margin: 0;
  }

  :host p pre {
    white-space: pre-wrap;       /* Since CSS 2.1 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */
  }
`

function classesForStyle (style) {
  if (style === 'plain') { return '' }
  if (style === 'bold') { return 'b' }
  if (style === 'italic') { return 'i' }
  if (style === 'link') { return 'underline' }

  console.error('do not understand style', style)
  return ''
}

function content (block) {
  return block.parts.map((part, index) => {
    let text = part.text

    if (text === '') {
      text = raw('&nbsp;')
    }

    const additionalClasses = classesForStyle(part.styleType)

    return html`
      <pre class="di ${additionalClasses}" data-part=true data-part-type="text" data-index=${index} data-length=${part.text.length}>${text}</pre>
    `
  })
}

export default (state, emit) => {
  return html`
    <div
      id="editor"
      contenteditable=true
      onfocus=${focus}
      onblur=${blur}
      onkeydown=${keydown}
      onkeypress=${keypress}
      oninput=${input}
      oncompositionstart=${compositionstart}
      oncompositionupdate=${compositionupdate}
      oncompositionend=${compositionend}
      class=${styles}>
      ${state.document.map((block, index) => {
        return html`
          <p data-block=true data-cid=${block._cid} data-index=${index}>
            ${content(block)}
          </p>
        `
      })}
    </div>
  `

  function focus (e) {
    emit('focus')
  }

  function blur (e) {
    emit('blur')
  }

  function keydown (e) {
    console.debug('keydown', e)

    // TODO: backspacing the only character will remove the pre, we should do that ourselves and re-render

    if ((e.code === 'Backspace' || e.code === 'Delete') && !state.selection.isCollapsed) {
      e.preventDefault()
      console.error('do not support deleting a range selection yet')
      return
    }

    if (e.code === 'Backspace' && state.selection.anchorPartOffset === 0) {
      e.preventDefault()
      console.error('cannot backspace at the left most side of a part yet')
      return
    }

    if (e.code === 'Backspace' && state.selection.anchorBlock.parts.length === 1 && state.selection.anchorPartIndex === 0 && state.selection.anchorPartOffset === 1 && state.selection.anchorPart.length === 1) {
      e.preventDefault()
      console.error('cannot remove all text in the only part of a block yet')
      return
    }

    if (e.code === 'Enter') {
      e.preventDefault()
      emit('keypress:return')
      return
    }

    // if (e.code === 'Space') {
    //   e.preventDefault()
    //   emit('keypress:space')
    //   return
    // }

    if (e.code === 'KeyV' && e.metaKey === true) {
      e.preventDefault()
      console.error('cannot paste yet')
    }
  }

  function keypress (e) {
    console.debug('keypress', e)
  }

  function input (e) {
    console.debug('input', e)

    emit('slurp')
  }

  function compositionstart (e) {
    console.debug('compositionstart', e)
  }

  function compositionupdate (e) {
    console.debug('compositionupdate', e)
  }

  function compositionend (e) {
    console.debug('compositionend', e)
  }
}

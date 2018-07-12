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
    white-space: pre-wrap;
  }
`

function classesForStyle (styles) {
  let classes = []

  if (styles.includes('bold')) { classes.push('b') }
  if (styles.includes('italic')) { classes.push('i') }
  if (styles.includes('link')) { classes.push('underline') }

  return classes.join(' ')
}

function content (block, emit) {
  return block.parts.map((part, index) => {
    let text = part.text

    if (text === '') {
      text = raw('&nbsp;')
    }

    const additionalClasses = classesForStyle(part.styles)

    return html`
      <pre class="di ${additionalClasses}" data-part=true data-part-type="text" data-index=${index} data-length=${part.text.length}>${text}</pre>
    `
  })
}

function renderBlock (block, index, state, emit) {
  return html`
    <p data-block=true data-cid=${block._cid} data-index=${index}>
      ${content(block, emit)}
    </p>
  `
}

function renderEmptyBlock (block, index, state, emit) {
  return html`
    <p onclick=${click} data-block=true data-cid=${block._cid} data-index=${index}>
      <pre class="di" data-part=true data-part-type="text" data-index="0" data-length="0">${raw('&nbsp;')}</pre>
    </p>
  `

  function click (e) {
    console.debug('click', e)
    e.preventDefault()
    emit('caret:set', { block, pos: 0 })
  }
}

// TODO: how to use the mutation observer?

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
        if (block.parts.length === 1 && block.parts[0].text === '') {
          return renderEmptyBlock(block, index, state, emit)
        } else {
          return renderBlock(block, index, state, emit)
        }
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

    const browser = { isMac: true } // TODO: detect browser

    // https://github.com/ProseMirror/prosemirror-view/blob/master/src/capturekeys.js#L215-L236

    const code = e.code
    // TODO: assign code from e.keyCode if e.code is missing

    if (code === 'Backspace' || (browser.isMac && code === 'keyH' && e.ctrlKey)) {
      e.preventDefault()
      emit('key:backspace', e)
      return
    }

    if (code === 'Delete' || (browser.isMac && code === 'keyD' && e.ctrlKey)) {
      e.preventDefault()
      emit('key:delete', e)
      return
    }

    if (code === 'Enter') {
      e.preventDefault()
      emit('key:return', e)
      return
    }

    if (code === 'Escape') {
      e.preventDefault()
      emit('key:escape', e)
      return
    }

    // NOTE: Maybe we need to emit something so we can potentially scroll the view?
    // if (code === 'ArrowUp') {
    //   e.preventDefault()
    //   emit('key:up', e)
    //   return
    // }
    //
    // if (code === 'ArrowRight') {
    //   e.preventDefault()
    //   emit('key:right', e)
    //   return
    // }
    //
    // if (code === 'ArrowDown') {
    //   e.preventDefault()
    //   emit('key:down', e)
    //   return
    // }
    //
    // if (code === 'ArrowLeft') {
    //   e.preventDefault()
    //   emit('key:left', e)
    //   return
    // }

    if ((e.code === 'KeyV' && e.ctrlKey) || (browser.isMac && e.code === 'KeyV' && e.metaKey === true)) {
      e.preventDefault()
      emit('key:paste', e)
      return
    }

    if ((e.code === 'KeyZ' && e.ctrlKey) || (browser.isMac && e.code === 'KeyZ' && e.metaKey === true)) {
      e.preventDefault()
      emit('key:undo', e)
      return
    }

    if ((e.code === 'KeyY' && e.ctrlKey) || (browser.isMac && e.code === 'KeyY' && e.metaKey === true)) {
      e.preventDefault()
      emit('key:redo', e)
      return
    }

    if ((e.code === 'KeyB' && e.ctrlKey) || (browser.isMac && e.code === 'KeyB' && e.metaKey === true)) {
      e.preventDefault()
      emit('key:bold', e)
      return
    }

    if ((e.code === 'KeyI' && e.ctrlKey) || (browser.isMac && e.code === 'KeyI' && e.metaKey === true)) {
      e.preventDefault()
      emit('key:italic', e)
      return
    }

    // TODO: other keyboard shortcuts for other things
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

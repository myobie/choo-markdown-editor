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
`

function content (block) {
  if (block.parts.length === 0) {
    return html`
      <span data-part=true data-part-type="text" data-index=0 data-length=0>${raw('&nbsp;')}</span>
    `
  } else {
    return block.parts.map((part, index) => {
      if (part.type === 'text') {
        return html`
          <span data-part=true data-part-type="text" data-index=${index} data-length=${part.text.length}>${part.text}</span>
        `
      } else {
        console.error('there is not template support for parts that are not text yet')
        return ''
      }
    })
  }
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
      ${state.document.map(block => {
        return html`
          <p data-block=true data-cid=${block._cid}>
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
  }

  function keypress (e) {
    console.debug('keypress', e)

    if (e.code === 'Enter') {
      e.preventDefault()
      emit('keypress:return')
    }
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

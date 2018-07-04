import choo from 'choo'
import editableView from './example/editable-view'
import store from './example/store'

// must use require because they are transformed away
const html = require('nanohtml')
const css = require('sheetify')

css('tachyons')

const app = choo()

if (process.env.NODE_ENV !== 'production') {
  const dev = require('choo-devtools')
  app.use(dev())
}

app.use(store)

const styles = css`
  :host {
    width: 100%;
    height: 100%;
  }
`

app.route('*', (state, emit) => html`
  <body class="sans-serif ${styles}">
    <header class="measure center mb4">
      <h1 class="ma0 pa1">Edit the document below</h1>
    </header>
    <main>
      <section class="measure center min-vh-100">
        ${editableView(state, emit)}
      </section>
    </main>
  </body>
`)

app.mount('body')

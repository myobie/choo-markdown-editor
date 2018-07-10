export function raf (cb) {
  window.requestAnimationFrame(cb)
}

export function debounce (cb) {
  let isScheduled = false

  return (...args) => {
    if (!isScheduled) {
      isScheduled = true

      raf(() => {
        isScheduled = false
        cb(...args)
      })
    }
  }
}

// Imperative toast API — non-component module to satisfy react-refresh
// Import toast() from here in pages/components; Toast.jsx imports
// registerToastDispatch from here to wire up the container.

let _dispatch = null

export function registerToastDispatch(fn) {
  _dispatch = fn
}

export function toast(message, type = 'success') {
  _dispatch?.({ message, type, id: Date.now() })
}

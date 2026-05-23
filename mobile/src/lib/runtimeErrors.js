const listeners = new Set()

let currentRuntimeError = null
let globalHandlerInstalled = false

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch (error) {
      console.warn('Runtime error listener failed', error)
    }
  })
}

function normalizeRuntimeError(error, isFatal = false) {
  const message = error?.message || String(error) || 'Unknown runtime error'
  const stack = typeof error?.stack === 'string' ? error.stack : ''

  return {
    isFatal: Boolean(isFatal),
    message,
    stack
  }
}

export function getRuntimeError() {
  return currentRuntimeError
}

export function subscribeToRuntimeError(listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function clearRuntimeError() {
  currentRuntimeError = null
  notifyListeners()
}

export function reportRuntimeError(error, isFatal = false) {
  currentRuntimeError = normalizeRuntimeError(error, isFatal)
  notifyListeners()
}

export function installGlobalErrorHandler() {
  if (globalHandlerInstalled) {
    return
  }

  globalHandlerInstalled = true

  const defaultHandler =
    typeof global.ErrorUtils?.getGlobalHandler === 'function'
      ? global.ErrorUtils.getGlobalHandler()
      : null

  if (typeof global.ErrorUtils?.setGlobalHandler !== 'function') {
    return
  }

  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.warn('Global runtime error captured', error)
    reportRuntimeError(error, isFatal)

    if (__DEV__ && typeof defaultHandler === 'function') {
      defaultHandler(error, isFatal)
    }
  })
}

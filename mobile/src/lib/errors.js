const DEFAULT_FALLBACK = 'Неизвестная ошибка.'

export function getErrorMessage(error, fallback = DEFAULT_FALLBACK) {
  if (!error) {
    return fallback
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error?.details === 'string' && error.details.trim()) {
    return error.details.trim()
  }

  if (typeof error?.error_description === 'string' && error.error_description.trim()) {
    return error.error_description.trim()
  }

  try {
    const serialized = JSON.stringify(error)
    return serialized && serialized !== '{}' ? serialized : fallback
  } catch {
    return fallback
  }
}

export function getAlertDescription(error, fallback = DEFAULT_FALLBACK) {
  const message = getErrorMessage(error, fallback)

  if (message.length <= 240) {
    return message
  }

  return `${message.slice(0, 237)}...`
}

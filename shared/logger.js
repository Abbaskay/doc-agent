const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const currentLevel = LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL] ?? LOG_LEVELS.info

function timestamp() {
  return new Date().toISOString().slice(11, 23)
}

function formatMsg(level, tag, msg, data) {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${tag}]`
  if (data) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data, null, 0).slice(0, 500)
      return `${prefix} ${msg} ${str}`
    } catch {
      return `${prefix} ${msg} [unserializable data]`
    }
  }
  return `${prefix} ${msg}`
}

export const logger = {
  debug(tag, msg, data) {
    if (currentLevel > LOG_LEVELS.debug) return
    const f = formatMsg('debug', tag, msg, data)
    if (import.meta.env.DEV) console.debug(f)
  },

  info(tag, msg, data) {
    if (currentLevel > LOG_LEVELS.info) return
    const f = formatMsg('info', tag, msg, data)
    if (import.meta.env.DEV) console.info(f)
  },

  warn(tag, msg, data) {
    if (currentLevel > LOG_LEVELS.warn) return
    const f = formatMsg('warn', tag, msg, data)
    console.warn(f)
  },

  error(tag, msg, data) {
    const f = formatMsg('error', tag, msg, data)
    console.error(f)
  },

  api(tag, method, url, status, duration, data) {
    const level = status >= 400 ? 'error' : 'info'
    this[level](tag, `${method} ${url} -> ${status} (${duration}ms)`, data)
  },
}

export function createApiLogger(apiName, axiosInstance) {
  axiosInstance.interceptors.request.use((config) => {
    config._logStart = performance.now()
    logger.info(apiName, `→ ${config.method.toUpperCase()} ${config.url}`, {
      data: config.data ? String(config.data).slice(0, 200) : undefined,
    })
    return config
  })

  axiosInstance.interceptors.response.use(
    (response) => {
      const duration = Math.round(performance.now() - (response.config._logStart || 0))
      logger.api(apiName, response.config.method.toUpperCase(), response.config.url, response.status, duration)
      return response
    },
    (error) => {
      const duration = Math.round(performance.now() - (error.config?._logStart || 0))
      logger.api(apiName, error.config?.method?.toUpperCase() || '?', error.config?.url || '?', error.response?.status || 0, duration, {
        message: error.message,
      })
      return Promise.reject(error)
    }
  )

  return axiosInstance
}

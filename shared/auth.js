import { reactive } from 'vue'

const planLimits = {
  free: { generated: 5, exports: 2 },
  pro: { generated: 100, exports: 999 },
  business: { generated: 9999, exports: 9999 },
}

export function createAuthStore(storageKey, options = {}) {
  const withBilling = options.withBilling ?? false
  const defaultUsage = { generated: 0, exported: 0, periodStart: null }

  function load() {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  }

  function save() {
    const data = { token: store.token, user: store.user }
    if (withBilling) {
      data.subscription = store.subscription
      data.usage = store.usage
    }
    localStorage.setItem(storageKey, JSON.stringify(data))
  }

  const saved = load()

  const base = {
    token: saved?.token || null,
    user: saved?.user || null,

    get isAuthenticated() {
      return !!this.token
    },

    login(token, user, ...args) {
      this.token = token
      this.user = user
      if (withBilling) {
        this.subscription = args[0] || null
      }
      save()
    },

    logout() {
      this.token = null
      this.user = null
      if (withBilling) {
        this.subscription = null
        this.usage = { ...defaultUsage }
      }
      localStorage.removeItem(storageKey)
    },
  }

  if (withBilling) {
    base.subscription = saved?.subscription || null
    base.usage = saved?.usage || { ...defaultUsage }
    Object.defineProperties(base, {
      plan: {
        get() { return this.subscription?.plan || 'free' },
      },
      usageLimit: {
        get() { return planLimits[this.plan] || planLimits.free },
      },
      isOverLimit: {
        get() { return this.usage.generated >= this.usageLimit.generated },
      },
    })
    base.updateUsage = function (usage) {
      Object.assign(this.usage, usage)
      save()
    }
    base.updateSubscription = function (subscription) {
      this.subscription = subscription
      save()
    }
  }

  const store = reactive(base)
  return store
}

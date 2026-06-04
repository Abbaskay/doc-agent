<template>
  <div class="callback-page">
    <div class="callback-card">
      <div class="callback-spinner"></div>
      <p v-if="!error">Completing sign in…</p>
      <p v-else class="callback-error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { authState } from '../store/auth.js'
import { socialAuth } from '../services/api.js'

export default {
  name: 'AuthCallbackView',
  data() {
    return { error: '' }
  },
  async mounted() {
    const token = this.$route.query.token
    const userParam = this.$route.query.user
    const subscription = this.$route.query.subscription
    const code = this.$route.query.code
    const provider = this.$route.query.provider || 'google'
    const errorQuery = this.$route.query.error

    if (errorQuery) {
      this.error = errorQuery === 'access_denied'
        ? `${provider} sign in was cancelled.`
        : 'Something went wrong. Please try again.'
      return
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        const sub = subscription ? JSON.parse(decodeURIComponent(subscription)) : null
        authState.login(token, user, sub)
        this.$router.push(this.$route.query.redirect || '/app')
        return
      } catch {
        this.error = 'Failed to complete sign in.'
        return
      }
    }

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        authState.login(token, {
          id: payload.sub,
          name: payload.name || 'User',
          email: payload.email || '',
        })
        this.$router.push(this.$route.query.redirect || '/app')
        return
      } catch {
        this.error = 'Failed to complete sign in.'
        return
      }
    }

    if (code) {
      try {
        const res = await socialAuth().exchangeCode(provider, code)
        authState.login(res.data.token, res.data.user, res.data.subscription)
        if (res.data.usage) authState.updateUsage(res.data.usage)
        this.$router.push(this.$route.query.redirect || '/app')
        return
      } catch {
        this.error = 'Failed to exchange authorization code.'
        return
      }
    }

    this.error = 'Invalid callback response.'
  },
}
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
}
.callback-card {
  background: var(--card);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
}
.callback-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.callback-error { color: var(--red); }
</style>

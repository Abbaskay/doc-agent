<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link :to="{ name: 'Welcome' }" class="auth-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </router-link>
      <h2 class="auth-title">Sign in</h2>
      <p class="auth-sub">Sign in to your DocAgent account</p>
      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="fg">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="fg">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Enter password" required />
        </div>
        <div v-if="error" class="fe">{{ error }}</div>
        <button type="submit" class="fs" :disabled="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
      </form>
      <p class="af">Don't have an account? <router-link :to="{ name: 'Signup' }">Sign up</router-link></p>
    </div>
  </div>
</template>

<script>
import { authState } from '../store/auth.js'
export default {
  name: 'LoginView',
  data() {
    return { email: '', password: '', loading: false, error: '' }
  },
  methods: {
    async handleLogin() {
      this.loading = true; this.error = ''
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password }),
        })
        const data = await res.json()
        if (data.token) {
          authState.login(data.token, data.user)
          this.$router.push(this.$route.query.redirect || '/app')
        } else {
          this.error = data.message || 'Invalid credentials'
          this.loading = false
        }
      } catch {
        this.error = 'Connection error'
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.auth-page { height: 100dvh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
.auth-card { width: 100%; max-width: 380px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; }
.auth-back { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: var(--text-muted); text-decoration: none; margin-bottom: 20px; }
.auth-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.auth-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
.auth-form { display: flex; flex-direction: column; gap: 14px; }
.fg { display: flex; flex-direction: column; gap: 5px; }
.fg label { font-size: 12px; font-weight: 500; color: var(--text-muted); }
.fg input { padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 14px; font-family: inherit; outline: none; }
.fg input:focus { border-color: var(--accent); }
.fe { font-size: 12px; color: #ff453a; padding: 8px 10px; background: rgba(255,69,58,0.06); border-radius: 6px; }
.fs { padding: 10px; border-radius: 6px; border: none; background: var(--accent); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
.fs:disabled { opacity: 0.4; cursor: not-allowed; }
.af { text-align: center; margin-top: 20px; font-size: 12px; color: var(--text-muted); }
.af a { color: var(--accent); text-decoration: none; }
</style>

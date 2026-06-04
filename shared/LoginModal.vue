<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <button class="modal-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="modal-header">
          <div class="modal-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h2>Sign in to continue</h2>
          <p class="modal-subtitle">Sign in to use {{ agentName }}. Your account works across all agents.</p>
        </div>
        <form class="modal-form" @submit.prevent="handleLogin">
          <div v-if="error" class="form-error">{{ error }}</div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-input" placeholder="you@example.com" required autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-input" placeholder="Enter your password" required autocomplete="current-password">
          </div>
          <button type="submit" class="form-submit" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
        <div class="modal-divider"><span>or continue with</span></div>
        <button class="google-btn" @click="handleGoogle" :disabled="loading">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>
        <p class="modal-footer">
          Don't have an account?
          <a :href="signupUrl" target="_blank" rel="noopener">Create one</a>
        </p>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'LoginModal',
  props: {
    visible: { type: Boolean, default: false },
    agentName: { type: String, default: '' },
  },
  emits: ['close', 'logged-in'],
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: '',
    }
  },
  computed: {
    apiUrl() { return import.meta.env.VITE_API_URL || 'http://localhost:8000' },
    signupUrl() { return (import.meta.env.VITE_SA_FRONTEND_URL || 'http://localhost:5173') + '/signup' },
  },
  methods: {
    async handleLogin() {
      this.loading = true; this.error = ''
      try {
        const res = await fetch(this.apiUrl + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password }),
        })
        const data = await res.json()
        if (data.token) {
          this.$emit('logged-in', { token: data.token, user: data.user })
          this.reset()
        } else {
          this.error = data.message || 'Invalid credentials'
        }
      } catch {
        this.error = 'Connection error. Please try again.'
      } finally { this.loading = false }
    },
    handleGoogle() {
      const popup = window.open(
        this.apiUrl + '/api/auth/google/redirect',
        'google-auth',
        'width=600,height=700'
      )
      const handler = (event) => {
        if (event.data?.type === 'auth_callback' && event.data.token) {
          window.removeEventListener('message', handler)
          this.$emit('logged-in', { token: event.data.token, user: event.data.user })
          this.reset()
        }
      }
      window.addEventListener('message', handler)
      const poll = setInterval(() => {
        if (popup?.closed) { clearInterval(poll); window.removeEventListener('message', handler) }
      }, 500)
    },
    reset() {
      this.email = ''; this.password = ''; this.error = ''; this.loading = false
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-container {
  width: 100%; max-width: 400px;
  background: #0c0c11; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 32px; position: relative;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
}
.modal-close {
  position: absolute; top: 12px; right: 12px;
  width: 30px; height: 30px; border-radius: 50%;
  border: none; background: transparent;
  color: rgba(255,255,255,0.3); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }
.modal-header { text-align: center; margin-bottom: 24px; }
.modal-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(94,158,255,0.15), rgba(94,92,230,0.15));
  border: 1px solid rgba(94,158,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(94,158,255,0.8); margin: 0 auto 14px;
}
.modal-header h2 { font-size: 20px; font-weight: 700; color: #f5f5f7; margin-bottom: 6px; }
.modal-subtitle { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.5; }
.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-label { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.5); }
.form-input {
  padding: 11px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: #f5f5f7; font-size: 14px;
  font-family: inherit; outline: none; transition: border-color 0.2s;
}
.form-input:focus { border-color: rgba(94,158,255,0.3); }
.form-input::placeholder { color: rgba(255,255,255,0.2); }
.form-error { font-size: 12px; color: #ff453a; padding: 8px 10px; background: rgba(255,69,58,0.06); border-radius: 6px; }
.form-submit {
  padding: 11px; border-radius: 8px; border: none;
  background: rgba(94,158,255,0.9); color: white;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; font-family: inherit;
}
.form-submit:hover { background: rgba(94,158,255,1); }
.form-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; font-size: 11px; color: rgba(255,255,255,0.2); }
.modal-divider::before, .modal-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
.google-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.15s; font-family: inherit;
}
.google-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
.google-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-footer { text-align: center; margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.3); }
.modal-footer a { color: rgba(94,158,255,0.8); text-decoration: none; font-weight: 500; }
.modal-footer a:hover { text-decoration: underline; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-container, .modal-leave-to .modal-container { transform: scale(0.95) translateY(10px); }
</style>

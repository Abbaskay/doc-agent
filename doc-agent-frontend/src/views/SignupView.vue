<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link :to="{ name: 'Welcome' }" class="auth-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </router-link>
      <h2 class="auth-title">Create an account</h2>
      <p class="auth-sub">Sign up to get started with DocAgent</p>
      <p class="redirect-msg">Please visit the <a href="http://localhost:5173/signup" target="_blank">Super Agent signup page</a> to create your account. Your account works across all agents.</p>
      <p class="af">Already have an account? <router-link :to="{ name: 'Login' }">Sign in</router-link></p>
    </div>
  </div>
</template>

<script>
export default { name: 'SignupView' }
</script>

<style scoped>
.auth-page { height: 100dvh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
.auth-card { width: 100%; max-width: 380px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; text-align: center; }
.auth-back { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: var(--text-muted); text-decoration: none; margin-bottom: 20px; text-align: left; width: 100%; }
.auth-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.auth-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
.redirect-msg { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; }
.redirect-msg a { color: var(--accent); text-decoration: none; font-weight: 500; }
.af { font-size: 12px; color: var(--text-muted); }
.af a { color: var(--accent); text-decoration: none; }
</style>

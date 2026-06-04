<template>
  <div class="welcome">
    <header class="wl-header">
      <div class="wl-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>DocAgent</span>
      </div>
      <div class="wl-header-right">
        <router-link :to="{ name: 'Login' }" class="wl-link">Sign in</router-link>
        <router-link :to="{ name: 'Signup' }" class="wl-btn">Get Started</router-link>
      </div>
    </header>

    <main class="wl-main">
      <div class="wl-hero">
        <div class="wl-badge">AI-Powered Document Studio</div>
        <h1>Create professional documents<br/>in seconds, not hours.</h1>
        <p class="wl-sub">Describe what you need — a resume, invoice, proposal, email — and AI generates it. Edit, refine, export. All in one place.</p>
        <div class="wl-actions">
          <router-link :to="{ name: 'Signup' }" class="wl-primary">Get Started Free</router-link>
          <router-link :to="{ name: 'Login' }" class="wl-secondary">Sign In</router-link>
        </div>
        <div class="wl-cred">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Test: <strong>admin@docagent.com</strong> / <strong>admin123</strong></span>
        </div>
      </div>

      <div class="wl-features">
        <div class="wl-feature">
          <div class="wlf-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <h3>7 Document Types</h3>
          <p>Resumes, cover letters, invoices, proposals, reports, emails, and technical docs.</p>
        </div>
        <div class="wl-feature">
          <div class="wlf-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          <h3>AI-Powered Quality</h3>
          <p>Smart validation, content scoring, and tone controls ensure professional results.</p>
        </div>
        <div class="wl-feature">
          <div class="wlf-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
          <h3>Chat to Refine</h3>
          <p>Edit, improve, or rewrite with AI chat. Apply tone presets with one click.</p>
        </div>
        <div class="wl-feature">
          <div class="wlf-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg></div>
          <h3>Export Anywhere</h3>
          <p>Download as PDF, DOCX, HTML, or copy as plain text or rich HTML.</p>
        </div>
      </div>
    </main>

    <footer class="wl-footer">
      <p>DocAgent — AI-powered document studio</p>
    </footer>
  </div>
</template>

<script>
export default { name: 'WelcomeView' }
</script>

<style scoped>
.welcome { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }
.wl-header { display: flex; align-items: center; padding: 16px 32px; border-bottom: 1px solid var(--border); background: rgba(6,6,8,0.85); backdrop-filter: blur(20px); }
.wl-logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 17px; }
.wl-logo svg { width: 20px; height: 20px; }
.wl-header-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.wl-link { font-size: 13px; color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
.wl-link:hover { color: var(--accent); }
.wl-btn { padding: 6px 18px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
.wl-btn:hover { background: var(--accent-hover); }
.wl-main { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 60px 24px 40px; }
.wl-hero { text-align: center; max-width: 640px; margin-bottom: 60px; }
.wl-badge { display: inline-block; padding: 5px 14px; border-radius: 999px; background: var(--accent-glow); border: 1px solid rgba(107,139,168,0.2); color: var(--accent); font-size: 12px; font-weight: 600; margin-bottom: 16px; }
.wl-hero h1 { font-family: var(--font-display); font-size: clamp(32px, 4vw, 52px); font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }
.wl-sub { font-size: 16px; color: var(--text-muted); line-height: 1.6; margin-bottom: 28px; }
.wl-actions { display: flex; gap: 12px; justify-content: center; }
.wl-primary { padding: 12px 28px; border-radius: var(--radius-sm); background: var(--accent); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
.wl-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
.wl-secondary { padding: 12px 28px; border-radius: var(--radius-sm); border: 1px solid var(--border); color: var(--text); font-size: 15px; font-weight: 500; text-decoration: none; transition: all 0.2s; }
.wl-secondary:hover { border-color: var(--accent); color: var(--accent); }
.wl-cred { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); font-size: 11px; color: var(--text-dim); cursor: default; }
.wl-cred svg { color: var(--accent); }
.wl-cred strong { color: var(--accent); }
.wl-features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 640px; width: 100%; }
.wl-feature { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; transition: border-color 0.2s; }
.wl-feature:hover { border-color: var(--accent); }
.wlf-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--accent-glow); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; color: var(--accent); }
.wl-feature h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.wl-feature p { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
.wl-footer { text-align: center; padding: 24px; font-size: 11px; color: var(--text-dim); border-top: 1px solid var(--border); }
</style>

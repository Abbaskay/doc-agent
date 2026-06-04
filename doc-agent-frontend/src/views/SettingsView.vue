<template>
  <div class="settings-page">
    <header class="settings-header">
      <router-link :to="{ name: 'App' }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to app
      </router-link>
      <div class="settings-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>DocAgent</span>
      </div>
    </header>
    <main class="settings-main">
      <aside class="settings-sidebar">
        <button :class="['ss-item', { active: tab === 'profile' }]" @click="tab = 'profile'">Profile</button>
        <button :class="['ss-item', { active: tab === 'billing' }]" @click="tab = 'billing'">Billing</button>
      </aside>
      <div class="settings-content">

        <!-- Profile -->
        <div v-if="tab === 'profile'" class="sc-section">
          <h2>Profile</h2>
          <p class="sc-sub">Your information is used to autofill new documents</p>
          <div class="sc-field">
            <label>Full Name</label>
            <input v-model="profile.name" type="text" placeholder="e.g. John Doe" />
          </div>
          <div class="sc-field">
            <label>Email</label>
            <input v-model="profile.email" type="email" placeholder="john@example.com" />
          </div>
          <div class="sc-field">
            <label>Phone</label>
            <input v-model="profile.phone" type="text" placeholder="+1 (555) 123-4567" />
          </div>
          <div class="sc-field">
            <label>Company</label>
            <input v-model="profile.company" type="text" placeholder="Your company name" />
          </div>
          <div class="sc-field">
            <label>Job Title</label>
            <input v-model="profile.title" type="text" placeholder="e.g. Software Engineer" />
          </div>
          <div class="sc-field">
            <label>Location</label>
            <input v-model="profile.location" type="text" placeholder="City, State" />
          </div>
          <div class="sc-field">
            <label>Website</label>
            <input v-model="profile.website" type="text" placeholder="https://yoursite.com" />
          </div>
          <button class="sc-save" @click="saveProfile">Save Changes</button>
          <p v-if="saved" style="color:var(--green);font-size:12px;margin-top:8px">Profile saved!</p>
        </div>

        <!-- Billing -->
        <div v-if="tab === 'billing'" class="sc-section">
          <h2>Billing</h2>
          <p class="sc-sub">Manage your subscription and usage</p>
          <div class="sc-plan-card">
            <div class="spc-info">
              <span class="spc-label">Current Plan</span>
              <span class="spc-name">{{ planLabel }}</span>
            </div>
            <router-link :to="{ name: 'Pricing' }" class="spc-action">Change Plan</router-link>
          </div>
          <div class="sc-usage">
            <h3>Monthly Usage</h3>
            <div class="su-bar">
              <div class="su-fill" :style="{ width: usagePercent + '%', background: isOverLimit ? 'var(--red)' : 'var(--accent)' }"></div>
            </div>
            <p class="su-text">
              {{ usage.generated }} / {{ limit.generated }} documents generated
              <span v-if="isOverLimit" style="color:var(--red)"> — upgrade to generate more</span>
            </p>
          </div>
          <button class="sc-manage" @click="manageBilling" :disabled="plan === 'free'">
            Manage Billing
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<script>
import { authState } from '../store/auth.js'
import { userProfile } from '../store/profile.js'
import api, { billingAPI } from '../services/api.js'

export default {
  name: 'SettingsView',
  data() {
    return {
      tab: this.$route.query.upgrade ? 'billing' : 'profile',
      profile: { name: '', email: '', phone: '', company: '', title: '', location: '', website: '' },
      loading: false, saved: false,
    }
  },
  computed: {
    plan() { return authState.plan },
    planLabel() { return { free: 'Free', pro: 'Pro', business: 'Business' }[this.plan] || 'Free' },
    usage() { return authState.usage },
    limit() { return authState.usageLimit },
    usagePercent() { return Math.min((this.usage.generated / this.limit.generated) * 100, 100) },
    isOverLimit() { return authState.isOverLimit },
  },
  created() {
    const p = userProfile.data || {}
    this.profile = {
      name: p.name || authState.user?.name || '',
      email: p.email || authState.user?.email || '',
      phone: p.phone || '',
      company: p.company || '',
      title: p.title || '',
      location: p.location || '',
      website: p.website || '',
    }
  },
  methods: {
    saveProfile() {
      userProfile.update(this.profile)
      this.saved = true
      setTimeout(() => { this.saved = false }, 2500)
    },
    async manageBilling() {
      try {
        const res = await billingAPI().createPortalSession()
        window.open(res.data.url, '_blank')
      } catch {
        window.open('https://example.com/billing', '_blank')
      }
    },
  },
}
</script>

<style scoped>
.settings-page { min-height: 100vh; display: flex; flex-direction: column; }
.settings-header { display: flex; align-items: center; gap: 12px; padding: 16px 32px; border-bottom: 1px solid var(--border); }
.settings-header a { display: flex; align-items: center; gap: 6px; color: var(--text-muted); text-decoration: none; font-size: 13px; }
.settings-header a:hover { color: var(--accent); }
.settings-logo { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-weight: 700; font-size: 15px; margin-left: auto; }
.settings-main { display: flex; flex: 1; max-width: 800px; margin: 0 auto; width: 100%; padding: 32px 24px; gap: 32px; }
.settings-sidebar { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
.ss-item { padding: 8px 12px; border-radius: var(--radius-sm); border: none; background: none; color: var(--text-muted); font-size: 13px; text-align: left; cursor: pointer; font-family: var(--font); transition: all 0.15s; }
.ss-item:hover { background: rgba(255,255,255,0.04); color: var(--text); }
.ss-item.active { background: var(--accent-glow); color: var(--accent); }
.settings-content { flex: 1; }
.sc-section h2 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.sc-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
.sc-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
.sc-field label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.sc-field input { padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 14px; outline: none; font-family: var(--font); }
.sc-field input:focus { border-color: var(--accent); }
.sc-save { padding: 10px 20px; border-radius: var(--radius-sm); border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font); }
.sc-save:hover { background: var(--accent-hover); }
.sc-plan-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.spc-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); display: block; margin-bottom: 2px; }
.spc-name { font-size: 18px; font-weight: 700; }
.spc-action { font-size: 13px; color: var(--accent); text-decoration: none; }
.spc-action:hover { text-decoration: underline; }
.sc-usage { margin-bottom: 24px; }
.sc-usage h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.su-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; margin-bottom: 6px; }
.su-fill { height: 100%; border-radius: 999px; transition: width 0.3s; }
.su-text { font-size: 12px; color: var(--text-muted); }
.sc-manage { padding: 10px 20px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font); }
.sc-manage:hover { border-color: var(--accent); color: var(--accent); }
.sc-manage:disabled { opacity: 0.4; cursor: not-allowed; }
</style>

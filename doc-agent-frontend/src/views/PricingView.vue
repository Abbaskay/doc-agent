<template>
  <div class="pricing-page">
    <header class="pricing-header">
      <router-link :to="{ name: 'App' }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </router-link>
      <div class="pricing-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>DocAgent</span>
      </div>
    </header>
    <main class="pricing-main">
      <h1>Simple, transparent pricing</h1>
      <p class="pricing-sub">Choose the plan that fits your needs</p>
      <div class="pricing-grid">
        <div v-for="plan in plans" :key="plan.id" :class="['pricing-card', { popular: plan.popular }]">
          <div class="pc-badge" v-if="plan.popular">Most Popular</div>
          <h2>{{ plan.name }}</h2>
          <div class="pc-price"><span class="pc-amount">${{ plan.price }}</span><span class="pc-period">/month</span></div>
          <p class="pc-desc">{{ plan.desc }}</p>
          <ul class="pc-features">
            <li v-for="f in plan.features" :key="f">{{ f }}</li>
          </ul>
          <button :class="['pc-btn', { active: plan.id === currentPlan }]" :disabled="plan.id === currentPlan" @click="selectPlan(plan)">
            {{ plan.id === currentPlan ? 'Current Plan' : 'Upgrade' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { authState } from '../store/auth.js'

export default {
  name: 'PricingView',
  data() {
    return {
      plans: [
        { id: 'free', name: 'Free', price: 0, desc: 'For getting started', popular: false, features: ['5 document generations/mo', '2 export formats (PDF, TXT)', 'Basic templates', 'No file upload'] },
        { id: 'pro', name: 'Pro', price: 19, desc: 'For professionals', popular: true, features: ['100 document generations/mo', 'All export formats (PDF, DOCX, HTML)', 'All 7 document types', 'File upload (PDF, DOCX, TXT)', 'Priority support'] },
        { id: 'business', name: 'Business', price: 49, desc: 'For teams & power users', popular: false, features: ['Unlimited generations', 'All export formats', 'Priority AI processing', 'Team collaboration (coming soon)', 'Dedicated support'] },
      ],
    }
  },
  computed: {
    currentPlan() { return authState.plan },
  },
  methods: {
    selectPlan(plan) {
      if (plan.id === this.currentPlan) return
      if (!authState.isAuthenticated) {
        this.$router.push({ name: 'Login', query: { redirect: this.$route.fullPath } })
        return
      }
      this.$router.push({ name: 'Settings', query: { upgrade: plan.id } })
    },
  },
}
</script>

<style scoped>
.pricing-page { min-height: 100vh; display: flex; flex-direction: column; }
.pricing-header { display: flex; align-items: center; gap: 12px; padding: 16px 32px; border-bottom: 1px solid var(--border); }
.pricing-header a { display: flex; align-items: center; gap: 6px; color: var(--text-muted); text-decoration: none; font-size: 13px; }
.pricing-header a:hover { color: var(--accent); }
.pricing-logo { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-weight: 700; font-size: 15px; margin-left: auto; }
.pricing-main { flex: 1; padding: 48px 24px 80px; max-width: 960px; margin: 0 auto; width: 100%; }
.pricing-main h1 { text-align: center; font-family: var(--font-display); font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
.pricing-sub { text-align: center; color: var(--text-muted); margin-bottom: 40px; font-size: 15px; }
.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.pricing-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; position: relative; transition: border-color 0.2s; }
.pricing-card.popular { border-color: var(--accent); background: var(--elevated); }
.pc-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; }
.pricing-card h2 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.pc-price { margin-bottom: 4px; }
.pc-amount { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
.pc-period { font-size: 13px; color: var(--text-muted); margin-left: 4px; }
.pc-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
.pc-features { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 10px; }
.pc-features li { font-size: 13px; color: var(--text-muted); padding-left: 20px; position: relative; }
.pc-features li::before { content: '✓'; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
.pc-btn { width: 100%; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: var(--font); }
.pc-btn:hover { border-color: var(--accent); color: var(--accent); }
.pc-btn.active { border-color: var(--accent); background: var(--accent-glow); color: var(--accent); cursor: default; }
.pc-btn:disabled { opacity: 0.5; }
</style>

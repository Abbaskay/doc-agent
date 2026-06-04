<template>
  <div class="dash-page">
    <header class="dash-header">
      <div class="dash-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>DocAgent</span>
      </div>
      <div class="dash-header-right">
        <router-link :to="{ name: 'Pricing' }" class="dh-link">Pricing</router-link>
        <template v-if="isAuthenticated">
          <div class="user-menu" ref="dashUserMenu">
            <button @click="userMenuOpen = !userMenuOpen" class="user-trigger">
              <span class="user-avatar">{{ userInitial }}</span>
              <span class="user-name">{{ authState.user?.name || 'User' }}</span>
            </button>
            <Transition name="menu">
              <div class="user-dropdown" v-if="userMenuOpen">
                <div class="ud-user">
                  <span class="ud-name">{{ authState.user?.name || 'User' }}</span>
                  <span class="ud-email">{{ authState.user?.email || '' }}</span>
                </div>
                <router-link :to="{ name: 'Settings' }" class="ud-item" @click="userMenuOpen = false">Settings</router-link>
                <router-link :to="{ name: 'Pricing' }" class="ud-item" @click="userMenuOpen = false">Billing & Plan</router-link>
                <div class="ud-divider"></div>
                <button class="ud-item ud-logout" @click="handleLogout">Sign out</button>
              </div>
            </Transition>
          </div>
        </template>
        <template v-else>
          <router-link :to="{ name: 'Login' }" class="dh-link">Sign in</router-link>
          <router-link :to="{ name: 'Signup' }" class="dh-btn">Get Started</router-link>
        </template>
      </div>
    </header>

    <main class="dash-main">
      <div class="dash-top">
        <h1>My Documents</h1>
        <router-link :to="{ name: 'App' }"><button class="dt-create">+ New Document</button></router-link>
      </div>

      <div class="dash-controls">
        <div class="dc-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" placeholder="Search documents..." />
        </div>
        <select v-model="sortBy" class="dc-sort">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
          <option value="type">Type</option>
        </select>
      </div>

      <div v-if="filtered.length === 0" class="dash-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" style="opacity:0.15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <p v-if="search">No documents match "{{ search }}"</p>
        <p v-else>No documents yet. Create your first one!</p>
        <router-link :to="{ name: 'App' }"><button class="dt-create" v-if="!search">+ Create Document</button></router-link>
      </div>

      <div v-else class="dash-grid">
        <div v-for="doc in filtered" :key="doc.id" class="dash-card" @click="openDoc(doc)">
          <div class="dc-icon" :style="{ color: typeColor(doc.type) }">
            <component :is="typeIcon(doc.type)" :size="22" :stroke-width="1.5" />
          </div>
          <div class="dc-body">
            <div class="dc-name-row">
              <span class="dc-name">{{ doc.name }}</span>
              <span class="dc-type">{{ docLabels[doc.type] || doc.type }}</span>
            </div>
            <span class="dc-date">{{ fmtDate(doc.updatedAt || doc.createdAt) }}</span>
          </div>
          <div class="dc-actions" @click.stop>
            <button class="dca-btn" @click="renameDoc(doc)" title="Rename">✎</button>
            <button class="dca-btn" @click="dupDoc(doc)" title="Duplicate">⧉</button>
            <button class="dca-btn dca-del" @click="deleteDoc(doc)" title="Delete">✕</button>
          </div>
        </div>
      </div>
    </main>

    <div class="toast" :class="toast.visible ? 'show' : ''" :style="{ background: toast.color }">{{ toast.text }}</div>
  </div>
</template>

<script>
import { authState } from '../store/auth.js'
import { docStore } from '../store/documents.js'
import { FileText, FileEdit, Presentation, BarChart3, Receipt, Mail, BookOpen } from 'lucide-vue-next'

const docLabels = {
  resume: 'Resume', cover_letter: 'Cover Letter', proposal: 'Proposal',
  report: 'Report', invoice: 'Invoice', email: 'Email',
  documentation: 'Documentation', generic: 'Document',
}

const typeIcons = {
  resume: FileText, cover_letter: FileEdit, proposal: Presentation,
  report: BarChart3, invoice: Receipt, email: Mail, documentation: BookOpen, generic: FileText,
}

const typeColors = {
  resume: '#6b8ba8', cover_letter: '#8b6ba8', proposal: '#a88b6b',
  report: '#6ba87b', invoice: '#a86b6b', email: '#6ba8a8', documentation: '#8b8ba8', generic: '#8e8e93',
}

export default {
  name: 'DashboardView',
  components: { FileText, FileEdit, Presentation, BarChart3, Receipt, Mail, BookOpen },
  data() {
    return { search: '', sortBy: 'newest', userMenuOpen: false, toast: { text: '', visible: false, color: '#34c759' } }
  },
  computed: {
    isAuthenticated() { return authState.isAuthenticated },
    authState() { return authState },
    userInitial() { return (authState.user?.name || 'U')[0].toUpperCase() },
    docLabels() { return docLabels },
    filtered() {
      let list = docStore.list()
      if (this.search) {
        const q = this.search.toLowerCase()
        list = list.filter(d => d.name?.toLowerCase().includes(q) || (docLabels[d.type] || '').toLowerCase().includes(q))
      }
      const sorts = {
        newest: (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt),
        oldest: (a, b) => (a.updatedAt || a.createdAt) - (b.updatedAt || b.createdAt),
        name: (a, b) => (a.name || '').localeCompare(b.name || ''),
        type: (a, b) => (docLabels[a.type] || '').localeCompare(docLabels[b.type] || ''),
      }
      return list.sort(sorts[this.sortBy] || sorts.newest)
    },
  },
  methods: {
    typeIcon(type) { return typeIcons[type] || FileText },
    typeColor(type) { return typeColors[type] || '#8e8e93' },
    fmtDate(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    },
    toastMsg(text, color = '#34c759') {
      this.toast = { text, visible: true, color }
      setTimeout(() => { this.toast.visible = false }, 2500)
    },
    openDoc(doc) {
      window.location.href = '/app?resume=' + doc.id
    },
    renameDoc(doc) {
      const name = prompt('Document name:', doc.name || '')
      if (name && name.trim() && name !== doc.name) {
        docStore.renameDocument(doc.id, name.trim())
        this.toastMsg('Renamed')
      }
    },
    dupDoc(doc) {
      docStore.duplicateDocument(doc.id)
      this.toastMsg('Duplicated')
    },
    deleteDoc(doc) {
      if (confirm(`Delete "${doc.name || 'Untitled'}"?`)) {
        docStore.deleteDocument(doc.id)
        this.toastMsg('Deleted')
      }
    },
    handleLogout() {
      this.userMenuOpen = false
      authState.logout()
      this.$router.push({ name: 'Welcome' })
    },
  },
  mounted() {
    document.addEventListener('click', (e) => {
      if (this.userMenuOpen && !this.$refs.dashUserMenu?.contains(e.target)) this.userMenuOpen = false
    })
  },
}
</script>

<style scoped>
.dash-page { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }
.dash-header { display: flex; align-items: center; padding: 14px 32px; border-bottom: 1px solid var(--border); background: rgba(6,6,8,0.85); backdrop-filter: blur(20px); }
.dash-logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 16px; }
.dash-logo svg { color: var(--accent); }
.dash-header-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.dh-link { font-size: 13px; color: var(--text-muted); text-decoration: none; }
.dh-link:hover { color: var(--accent); }
.dh-btn { padding: 6px 16px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; }
.dh-btn:hover { background: var(--accent-hover); }
.user-menu { position: relative; }
.user-trigger { display: flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; border-radius: 999px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-family: var(--font); }
.user-trigger:hover { border-color: var(--accent); }
.user-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.user-name { font-size: 12px; color: var(--text); font-weight: 500; }
.user-dropdown { position: absolute; top: 100%; right: 0; margin-top: 6px; background: var(--elevated); border: 1px solid var(--border-light); border-radius: var(--radius); box-shadow: 0 12px 40px rgba(0,0,0,0.4); min-width: 200px; z-index: 100; padding: 4px; backdrop-filter: blur(20px); }
.ud-user { padding: 10px 12px 6px; }
.ud-name { display: block; font-size: 13px; font-weight: 600; }
.ud-email { display: block; font-size: 11px; color: var(--text-dim); margin-top: 1px; }
.ud-item { display: flex; width: 100%; padding: 8px 12px; border: none; background: none; font-size: 12px; cursor: pointer; border-radius: 6px; color: var(--text); text-decoration: none; transition: background 0.15s; font-family: var(--font); }
.ud-item:hover { background: rgba(255,255,255,0.04); }
.ud-logout { color: var(--red); }
.ud-divider { height: 1px; background: var(--border); margin: 3px 0; }

.dash-main { flex: 1; max-width: 900px; margin: 0 auto; width: 100%; padding: 32px 24px 60px; }
.dash-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.dash-top h1 { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
.dt-create { padding: 8px 18px; border-radius: var(--radius-sm); border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font); transition: all 0.2s; }
.dt-create:hover { background: var(--accent-hover); }
.dash-controls { display: flex; gap: 12px; margin-bottom: 24px; }
.dc-search { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0 12px; }
.dc-search svg { color: var(--text-dim); flex-shrink: 0; }
.dc-search input { flex: 1; border: none; background: none; outline: none; padding: 10px 0; font-size: 13px; color: var(--text); font-family: var(--font); }
.dc-search input::placeholder { color: var(--text-dim); }
.dc-sort { padding: 8px 28px 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--card); color: var(--text); font-size: 12px; cursor: pointer; outline: none; font-family: var(--font); appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236e6e73'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; }

.dash-empty { text-align: center; padding: 60px 20px; color: var(--text-dim); }
.dash-empty p { font-size: 14px; margin-top: 12px; }
.dash-empty .dt-create { margin-top: 16px; }

.dash-grid { display: flex; flex-direction: column; gap: 6px; }
.dash-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-sm); background: var(--card); border: 1px solid var(--border); cursor: pointer; transition: all 0.15s; }
.dash-card:hover { border-color: var(--accent); background: var(--elevated); }
.dc-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); flex-shrink: 0; }
.dc-body { flex: 1; min-width: 0; }
.dc-name-row { display: flex; align-items: baseline; gap: 8px; }
.dc-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dc-type { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.3px; flex-shrink: 0; }
.dc-date { display: block; font-size: 11px; color: var(--text-dim); margin-top: 2px; }
.dc-actions { display: flex; gap: 2px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
.dash-card:hover .dc-actions { opacity: 1; }
.dca-btn { width: 28px; height: 28px; border-radius: 6px; border: none; background: none; color: var(--text-dim); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.dca-btn:hover { background: rgba(255,255,255,0.06); color: var(--text); }
.dca-del:hover { color: var(--red); background: rgba(255,69,58,0.08); }

.toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(16px); padding: 10px 22px; border-radius: 999px; color: #fff; font-size: 13px; font-weight: 500; z-index: 9999; opacity: 0; transition: all 0.35s cubic-bezier(0.16,1,0.3,1); pointer-events: none; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>

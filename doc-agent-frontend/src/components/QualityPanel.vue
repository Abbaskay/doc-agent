<template>
  <div class="quality-panel">
    <div class="qp-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      <span>Document Quality</span>
      <span class="qp-score-badge" :class="scoreClass">{{ overallScore }}/100</span>
    </div>

    <!-- Schema validation -->
    <div v-if="validations.length" class="qp-section">
      <div class="qp-s-title">Validation</div>
      <div v-for="(v, i) in visibleValidations" :key="i" :class="['qp-issue', v.severity]">
        <span class="qpi-icon">{{ v.severity === 'error' ? '!' : '•' }}</span>
        <span class="qpi-text">{{ v.message }}</span>
      </div>
      <button v-if="validations.length > 3 && !showAllValidations" class="qp-more" @click="showAllValidations = true">+{{ validations.length - 3 }} more</button>
      <button v-else-if="showAllValidations && validations.length > 3" class="qp-more" @click="showAllValidations = false">Show fewer</button>
    </div>

    <!-- Content scoring -->
    <div v-if="categories.length" class="qp-section">
      <div class="qp-s-title">Scoring</div>
      <div v-for="(c, i) in categories" :key="i" class="qp-cat">
        <div class="qpc-top">
          <span class="qpc-label">{{ c.label }}</span>
          <span class="qpc-score" :class="catClass(c.score)">{{ c.score }}</span>
        </div>
        <div class="qpc-bar"><div class="qpc-fill" :style="{ width: c.score + '%', background: catColor(c.score) }"></div></div>
      </div>
    </div>

    <!-- Improvement suggestions -->
    <div v-if="suggestions.length" class="qp-section">
      <div class="qp-s-title">Suggestions</div>
      <div v-for="(s, i) in visibleSuggestions" :key="i" class="qp-sug">
        <span class="qps-bullet">→</span>
        <span class="qps-text">{{ s }}</span>
      </div>
      <button v-if="suggestions.length > 4 && !showAllSugs" class="qp-more" @click="showAllSugs = true">+{{ suggestions.length - 4 }} more</button>
      <button v-else-if="showAllSugs && suggestions.length > 4" class="qp-more" @click="showAllSugs = false">Show fewer</button>
    </div>

    <!-- Tone presets -->
    <div class="qp-section">
      <div class="qp-s-title">Tone / Style</div>
      <div class="qp-tones">
        <button v-for="t in tonePresets" :key="t.id" class="qp-tone" @click="$emit('applyTone', t)" :title="t.desc">
          {{ t.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { tonePresets } from '../services/tones.js'

export default {
  name: 'QualityPanel',
  props: {
    overallScore: { type: Number, default: 0 },
    validations: { type: Array, default: () => [] },
    categories: { type: Array, default: () => [] },
    suggestions: { type: Array, default: () => [] },
  },
  emits: ['applyTone'],
  data() {
    return { tonePresets, showAllValidations: false, showAllSugs: false }
  },
  computed: {
    scoreClass() {
      const s = this.overallScore
      return s >= 80 ? 'score-good' : s >= 50 ? 'score-ok' : 'score-bad'
    },
    visibleValidations() {
      return this.showAllValidations ? this.validations : this.validations.slice(0, 3)
    },
    visibleSuggestions() {
      return this.showAllSugs ? this.suggestions : this.suggestions.slice(0, 4)
    },
  },
  methods: {
    catClass(s) { return s >= 80 ? 'score-good' : s >= 50 ? 'score-ok' : 'score-bad' },
    catColor(s) { return s >= 80 ? '#34c759' : s >= 50 ? '#ff9f0a' : '#ff453a' },
  },
}
</script>

<style scoped>
.quality-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; font-size: 12px; }
.qp-header { display: flex; align-items: center; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--border); font-weight: 600; font-size: 12px; }
.qp-header svg { color: var(--accent); }
.qp-score-badge { margin-left: auto; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.score-good { background: rgba(52,199,89,0.12); color: #34c759; }
.score-ok { background: rgba(255,159,10,0.12); color: #ff9f0a; }
.score-bad { background: rgba(255,69,58,0.12); color: #ff453a; }
.qp-section { padding: 8px 12px; border-bottom: 1px solid var(--border); }
.qp-section:last-child { border-bottom: none; }
.qp-s-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-dim); margin-bottom: 6px; }
.qp-issue { display: flex; gap: 6px; padding: 3px 0; font-size: 11px; line-height: 1.4; }
.qp-issue.error .qpi-icon { color: var(--red); }
.qp-issue.warning .qpi-icon { color: #ff9f0a; }
.qpi-icon { flex-shrink: 0; width: 14px; text-align: center; font-weight: 700; }
.qpi-text { color: var(--text-muted); }
.qp-cat { margin-bottom: 6px; }
.qpc-top { display: flex; justify-content: space-between; margin-bottom: 2px; }
.qpc-label { font-size: 11px; color: var(--text-muted); }
.qpc-score { font-size: 11px; font-weight: 700; }
.qpc-bar { height: 3px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
.qpc-fill { height: 100%; border-radius: 999px; transition: width 0.4s; }
.qp-sug { display: flex; gap: 6px; padding: 2px 0; font-size: 11px; line-height: 1.4; }
.qps-bullet { color: var(--accent); flex-shrink: 0; }
.qps-text { color: var(--text-muted); }
.qp-more { font-size: 10px; color: var(--accent); background: none; border: none; cursor: pointer; padding: 3px 0; font-family: var(--font); }
.qp-more:hover { text-decoration: underline; }
.qp-tones { display: flex; flex-wrap: wrap; gap: 4px; }
.qp-tone { padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); background: transparent; font-size: 10px; cursor: pointer; color: var(--text-muted); transition: all 0.15s; font-family: var(--font); }
.qp-tone:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
</style>

const actionVerbs = new Set([
  'achieved', 'accelerated', 'built', 'created', 'delivered', 'designed', 'developed',
  'drove', 'established', 'generated', 'grew', 'implemented', 'improved', 'increased',
  'initiated', 'launched', 'led', 'managed', 'optimized', 'organized', 'pioneered',
  'produced', 'reduced', 'scaled', 'spearheaded', 'streamlined', 'strengthened',
  'transformed', 'upgraded',
])

function countMetrics(text) {
  const m = text.match(/\d+[%x×kKmMmbB]?|\$[\d,]+(\.\d+)?|[\d,]+\s*(percent|users|customers|clients|revenue|cost|speed|time)/gi)
  return m ? m.length : 0
}

function analyzeBullets(bullets) {
  return (bullets || []).map((b, i) => {
    const t = b.trim()
    const firstWord = t.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') || ''
    const hasActionVerb = actionVerbs.has(firstWord)
    const metrics = countMetrics(t)
    const length = t.length
    const isWeak = length < 30 || (!hasActionVerb && metrics === 0)
    return {
      index: i, text: t, hasActionVerb, metrics, length, isWeak,
      suggestions: isWeak
        ? [length < 30 ? 'Add more detail' : null, !hasActionVerb ? 'Start with a strong action verb' : null, metrics === 0 ? 'Include measurable impact' : null].filter(Boolean)
        : [],
    }
  })
}

function analyzeDates(experiences) {
  const issues = []
  const dates = (experiences || []).map(e => ({ start: e.start_date || '', end: e.end_date || '', company: e.company || '' })).filter(d => d.start)
  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i].end && dates[i + 1].start && dates[i].end < dates[i + 1].start) {
      const gapMonths = monthDiff(dates[i].end, dates[i + 1].start)
      if (gapMonths > 3) {
        issues.push(`Employment gap of ~${gapMonths} months between ${dates[i].company} and ${dates[i + 1].company}`)
      }
    }
  }
  if (dates.length >= 2) {
    const sorted = [...dates].sort((a, b) => (a.start || '').localeCompare(b.start || ''))
    if (dates.some((d, i) => d.start !== sorted[i].start)) {
      issues.push('Experience entries are not in chronological order')
    }
  }
  return issues
}

function analyzeRepetition(bullets) {
  const words = (bullets || []).flatMap(b => b.split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 4))
  const freq = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  return Object.entries(freq).filter(([, c]) => c >= 3).map(([w]) => `"${w}" appears ${freq[w]} times — consider synonyms`)
}

export function scoreDoc(data, type) {
  if (!data || typeof data !== 'object') return { overall: 0, categories: [], issues: [] }
  const issues = []
  const categories = []

  if (type === 'resume') return scoreResume(data, issues, categories)
  if (type === 'cover_letter') return scoreCoverLetter(data, issues, categories)
  if (type === 'invoice') return scoreInvoice(data, issues, categories)
  if (type === 'email') return scoreEmail(data, issues, categories)
  if (type === 'proposal' || type === 'report') return scoreProseDoc(data, issues, categories)
  return { overall: 70, categories: [{ label: 'Structure', score: 70 }], issues: [] }
}

function scoreResume(data, issues, categories) {
  const exps = Array.isArray(data.experience) ? data.experience : []
  const allBullets = exps.flatMap(e => (Array.isArray(e.bullets) ? e.bullets : []))

  const bulletAnalysis = analyzeBullets(allBullets)
  const weakBullets = bulletAnalysis.filter(b => b.isWeak)
  const metricBullets = bulletAnalysis.filter(b => b.metrics > 0)
  const bulletScore = allBullets.length ? Math.round((metricBullets.length / allBullets.length) * 60 + Math.max(0, 40 - weakBullets.length * 10)) : 0
  categories.push({ label: 'Bullet Quality', score: bulletScore })
  weakBullets.forEach(b => issues.push(`Bullet ${b.index + 1}: ${b.suggestions.join('; ')}`))

  const skills = Array.isArray(data.skills) ? data.skills : []
  const skillsScore = skills.length >= 5 ? 90 : skills.length >= 3 ? 70 : skills.length >= 1 ? 50 : 0
  categories.push({ label: 'Skills Coverage', score: skillsScore })
  if (skills.length < 3) issues.push('List at least 3-5 relevant skills')

  const summary = data.professional_summary || data.summary || ''
  const summaryLen = summary.length
  const summaryScore = summaryLen > 100 ? 90 : summaryLen > 50 ? 60 : summaryLen > 0 ? 30 : 0
  categories.push({ label: 'Summary Substance', score: summaryScore })
  if (summaryLen < 50) issues.push('Professional summary is too short — add 2-3 sentences')

  const dateIssues = analyzeDates(exps)
  dateIssues.forEach(i => issues.push(i))

  const repIssues = analyzeRepetition(allBullets)
  repIssues.forEach(i => issues.push(i))

  const overall = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length)
  return { overall, categories, issues }
}

function scoreCoverLetter(data, issues, categories) {
  const paras = Array.isArray(data.body_paragraphs) ? data.body_paragraphs : []
  const paraScore = paras.length >= 3 ? 90 : paras.length >= 2 ? 70 : paras.length >= 1 ? 40 : 0
  categories.push({ label: 'Paragraph Count', score: paraScore })
  if (paras.length < 3) issues.push('Cover letter should have at least 3 paragraphs')
  const totalLen = paras.join(' ').length
  if (totalLen < 400) issues.push('Cover letter is too short — expand your arguments')
  categories.push({ label: 'Length', score: totalLen > 400 ? 90 : totalLen > 200 ? 60 : 30 })
  return { overall: Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length), categories, issues }
}

function scoreInvoice(data, issues, categories) {
  const items = Array.isArray(data.items) ? data.items : []
  const itemScore = items.length >= 4 ? 90 : items.length >= 2 ? 70 : items.length >= 1 ? 40 : 0
  categories.push({ label: 'Line Items', score: itemScore })
  if (items.length < 3) issues.push('Add more line items for clarity')
  const hasTax = data.tax_rate !== undefined && data.tax_rate !== null
  categories.push({ label: 'Tax Details', score: hasTax ? 90 : 30 })
  if (!hasTax) issues.push('Consider adding tax rate')
  return { overall: Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length), categories, issues }
}

function scoreEmail(data, issues, categories) {
  const body = Array.isArray(data.body) ? data.body : []
  const len = body.join(' ').length
  categories.push({ label: 'Body Length', score: len > 200 ? 90 : len > 100 ? 60 : 30 })
  if (len < 100) issues.push('Email body is too short')
  categories.push({ label: 'Structure', score: (data.subject && data.greeting && data.closing) ? 90 : 50 })
  if (!data.subject) issues.push('Missing subject line')
  return { overall: Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length), categories, issues }
}

function scoreProseDoc(data, issues, categories) {
  const sectionCount = Array.isArray(data.sections) ? data.sections.length : 0
  categories.push({ label: 'Sections', score: sectionCount >= 3 ? 90 : sectionCount >= 1 ? 60 : 0 })
  if (sectionCount < 2) issues.push('Add more sections for better structure')
  return { overall: Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length), categories, issues }
}

function monthDiff(a, b) {
  const [ay, am] = a.split('-').map(Number)
  const [by, bm] = b.split('-').map(Number)
  if (!ay || !by) return 0
  return (by - ay) * 12 + (bm - am)
}

const STORAGE_KEY = 'docagent_profile'

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

let profile = load()

export const userProfile = {
  get data() { return profile ? { ...profile } : null },

  get(field) { return profile?.[field] || '' },

  update(updates) {
    profile = { ...(profile || {}), ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  },

  autofill(docType, prompt) {
    if (!profile) return prompt
    const p = profile
    let filled = prompt
    const subs = {
      '{{name}}': p.name || '',
      '{{email}}': p.email || '',
      '{{phone}}': p.phone || '',
      '{{company}}': p.company || '',
      '{{title}}': p.title || '',
      '{{location}}': p.location || '',
      '{{website}}': p.website || '',
    }
    for (const [key, val] of Object.entries(subs)) {
      if (val) filled = filled.replaceAll(key, val)
    }
    return filled
  },

  mergeInto(docData) {
    if (!profile || !docData) return docData
    const p = profile
    const filled = { ...docData }
    if (!filled.full_name && p.name) filled.full_name = p.name
    if (!filled.email && p.email) filled.email = p.email
    if (!filled.phone && p.phone) filled.phone = p.phone
    if (!filled.location && p.location) filled.location = p.location
    if (!filled.business_name && p.company) filled.business_name = p.company
    if (!filled.sender_name && p.name) filled.sender_name = p.name
    if (!filled.sender_email && p.email) filled.sender_email = p.email
    if (!filled.prepared_by && p.name) filled.prepared_by = p.name
    if (!filled.author && p.name) filled.author = p.name
    return filled
  },
}

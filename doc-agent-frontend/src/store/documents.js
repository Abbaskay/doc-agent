const STORAGE_KEY = 'docagent_documents'

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function save(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

let docs = load()

export const docStore = {
  get all() { return docs },

  list() { return [...docs] },

  get(id) { return docs.find(d => d.id === id) || null },

  saveDocument(doc) {
    const idx = docs.findIndex(d => d.id === doc.id)
    if (idx >= 0) {
      docs[idx] = { ...docs[idx], ...doc, updatedAt: Date.now() }
    } else {
      docs.unshift({ ...doc, id: doc.id || crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() })
    }
    save(docs)
    return docs[0]
  },

  deleteDocument(id) {
    docs = docs.filter(d => d.id !== id)
    save(docs)
  },

  duplicateDocument(id) {
    const orig = docs.find(d => d.id === id)
    if (!orig) return null
    const dup = { ...orig, id: crypto.randomUUID(), name: orig.name + ' (copy)', createdAt: Date.now(), updatedAt: Date.now() }
    docs.unshift(dup)
    save(docs)
    return dup
  },

  renameDocument(id, name) {
    const doc = docs.find(d => d.id === id)
    if (doc) { doc.name = name; doc.updatedAt = Date.now(); save(docs) }
  },
}

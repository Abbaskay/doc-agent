const STORAGE_KEY = 'docagent_prompts'
const MAX = 20

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function save(prompts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
}

let prompts = load()

export const promptHistory = {
  get all() { return [...prompts] },

  add(text, type) {
    prompts = prompts.filter(p => p.text !== text)
    prompts.unshift({ text, type, date: Date.now() })
    if (prompts.length > MAX) prompts = prompts.slice(0, MAX)
    save(prompts)
  },

  clear() {
    prompts = []
    save(prompts)
  },
}

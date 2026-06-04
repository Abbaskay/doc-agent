const USERS_KEY = 'docagent_users'
const SESSION_KEY = 'docagent_auth'

function getUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

const defaults = [
  { id: 'admin-001', name: 'Admin', email: 'admin@docagent.com', password: 'admin123', role: 'admin' },
  { id: 'demo-001', name: 'Demo User', email: 'demo@docagent.com', password: 'demo123', role: 'user' },
]

if (!localStorage.getItem(USERS_KEY)) {
  saveUsers(defaults)
}

function createSession(user) {
  const { password, ...safe } = user
  const session = {
    token: 'mock-token-' + Date.now() + '-' + Math.random().toString(36).slice(2),
    user: safe,
    subscription: { plan: 'free' },
    usage: { generated: 0, exported: 0, periodStart: new Date().toISOString().slice(0, 7) },
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export const mockAuth = {
  login(email, password) {
    const users = getUsers()
    const user = users.find(u => u.email === email.toLowerCase().trim())
    if (!user) return { ok: false, error: 'No account found with this email' }
    if (user.password !== password) return { ok: false, error: 'Incorrect password' }
    return { ok: true, ...createSession(user) }
  },

  register(name, email, password) {
    const users = getUsers()
    const emailLower = email.toLowerCase().trim()
    if (users.find(u => u.email === emailLower)) {
      return { ok: false, error: 'An account with this email already exists' }
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters' }
    }
    const newUser = {
      id: 'user-' + Date.now(),
      name: name.trim() || 'User',
      email: emailLower,
      password,
      role: 'user',
    }
    users.push(newUser)
    saveUsers(users)
    return { ok: true, ...createSession(newUser) }
  },

  getDefaultAdmin() {
    return { email: 'admin@docagent.com', password: 'admin123' }
  },

  getDefaultDemo() {
    return { email: 'demo@docagent.com', password: 'demo123' }
  },
}

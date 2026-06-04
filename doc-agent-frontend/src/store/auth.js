import { createAuthStore } from '@shared/auth.js'

export const authState = createAuthStore('docagent_auth', { withBilling: true })

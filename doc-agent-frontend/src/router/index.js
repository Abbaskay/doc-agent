import { createRouter, createWebHistory } from 'vue-router'
import { authState } from '../store/auth.js'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: () => import('../views/WelcomeView.vue'),
  },
  {
    path: '/app',
    name: 'App',
    component: { template: '<div></div>' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('../views/PricingView.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallbackView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../views/SignupView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const authRoutes = ['Dashboard', 'Settings']
router.beforeEach((to, from, next) => {
  const isAuthenticated = authState.isAuthenticated

  if (authRoutes.includes(to.name) && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router

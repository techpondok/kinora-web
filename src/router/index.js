import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/RegisterPage.vue'),
  },
  {
    path: '/open-app',
    name: 'OpenApp',
    component: () => import('../pages/OpenAppPage.vue'),
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../pages/ForgotPasswordPage.vue'),
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../pages/HelpPage.vue'),
  },
  {
    path: '/help/category/:slug',
    name: 'HelpCategory',
    component: () => import('../pages/HelpCategoryPage.vue'),
    props: true,
  },
  {
    path: '/help/report-bug',
    name: 'ReportBug',
    component: () => import('../pages/ReportBugPage.vue'),
  },
  {
    path: '/help/request-feature',
    name: 'RequestFeature',
    component: () => import('../pages/RequestFeaturePage.vue'),
  },
  {
    path: '/help/contact',
    name: 'Contact',
    component: () => import('../pages/ContactPage.vue'),
  },
  {
    path: '/help/my-tickets',
    name: 'MyTickets',
    component: () => import('../pages/MyTicketsPage.vue'),
  },
  {
    path: '/help/account-access',
    name: 'AccountAccess',
    component: () => import('../pages/ReportBugPage.vue'),
  },
  {
    path: '/privacy-policy',
    redirect: '/privacy',
  },
  {
    path: '/privacy',
    name: 'PrivacyPolicy',
    component: () => import('../pages/LegalPage.vue'),
    props: { slug: 'privacy-policy' },
  },
  {
    path: '/terms-and-conditions',
    redirect: '/terms',
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../pages/LegalPage.vue'),
    props: { slug: 'terms-and-conditions' },
  },
  {
    path: '/portal',
    name: 'UserPortal',
    component: () => import('../pages/UserPortalPage.vue'),
    meta: { requiresAuth: true, userOnly: true },
  },
  {
    path: '/security',
    name: 'SecuritySessions',
    component: () => import('../pages/SecuritySessionsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/DashboardPage.vue'),
    meta: { requiresAuth: true, adminOnly: true },
  },
  {
    path: '/articles',
    name: 'Articles',
    component: () => import('../pages/ArticlesPage.vue'),
    props: { type: 'article' },
  },
  {
    path: '/articles/:slug',
    name: 'ArticleDetail',
    component: () => import('../pages/ArticleDetailPage.vue'),
    props: { type: 'article' },
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('../pages/ArticlesPage.vue'),
    props: { type: 'news' },
  },
  {
    path: '/news/:slug',
    name: 'NewsDetail',
    component: () => import('../pages/ArticleDetailPage.vue'),
    props: { type: 'news' },
  },
  {
    path: '/consultant/login',
    name: 'ConsultantLogin',
    component: () => import('../pages/consultant/ConsultantLoginPage.vue'),
  },
  {
    path: '/consultant/dashboard',
    name: 'ConsultantDashboard',
    component: () => import('../pages/consultant/DashboardOverview.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/consultations',
    name: 'ConsultantConsultations',
    component: () => import('../pages/consultant/ConsultationsListPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/consultations/:consultationId',
    name: 'ConsultantConsultationDetail',
    component: () => import('../pages/ConsultantChatPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/consultations/:consultationId/chat',
    name: 'ConsultantConsultationChat',
    component: () => import('../pages/ConsultantChatPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/clients',
    name: 'ConsultantClients',
    component: () => import('../pages/consultant/ClientsPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/schedule',
    name: 'ConsultantSchedule',
    component: () => import('../pages/consultant/SchedulePage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/services',
    name: 'ConsultantServices',
    component: () => import('../pages/consultant/ServicesPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/notes',
    name: 'ConsultantNotes',
    component: () => import('../pages/consultant/NotesPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/earnings',
    name: 'ConsultantEarnings',
    component: () => import('../pages/consultant/EarningsPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/withdrawals',
    name: 'ConsultantWithdrawals',
    component: () => import('../pages/consultant/WithdrawalsPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/reviews',
    name: 'ConsultantReviews',
    component: () => import('../pages/consultant/ReviewsPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/notifications',
    name: 'ConsultantNotifications',
    component: () => import('../pages/consultant/NotificationsPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/profile',
    name: 'ConsultantProfile',
    component: () => import('../pages/consultant/ProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/consultant/settings',
    name: 'ConsultantSettings',
    component: () => import('../pages/consultant/SettingsPage.vue'),
    meta: { requiresAuth: true, consultantOnly: true },
  },
  {
    path: '/consultant/sessions',
    name: 'ConsultantSessions',
    component: () => import('../pages/ConsultantSessionsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/consultant/chat/:sessionId',
    name: 'ConsultantChat',
    component: () => import('../pages/ConsultantChatPage.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

async function isAdminOrFounder(userId) {
  // Server-side validation via SECURITY DEFINER RPC
  const { data } = await supabase.rpc('validate_session')
  if (!data || !data.valid) return false
  return data.is_founder || data.is_admin
}

async function isConsultant(userId) {
  const { data } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', userId)
    .maybeSingle()
  return !!data
}

router.beforeEach(async (to, _from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  // Protected route without session → login
  if (to.meta.requiresAuth && !session) {
    return next({ name: 'Login' })
  }

  // Admin-only route: check admin access
  if (to.meta.adminOnly && session) {
    const isAdmin = await isAdminOrFounder(session.user.id)
    if (!isAdmin) {
      const isCons = await isConsultant(session.user.id)
      return next(isCons ? { name: 'ConsultantDashboard' } : { name: 'UserPortal' })
    }
  }

  // User-only route: redirect admin/consultant
  if (to.meta.userOnly && session) {
    const isAdmin = await isAdminOrFounder(session.user.id)
    if (isAdmin) return next({ name: 'Dashboard' })
    const isCons = await isConsultant(session.user.id)
    if (isCons) return next({ name: 'ConsultantDashboard' })
  }

  // Consultant-only route
  if (to.meta.consultantOnly && session) {
    const isCons = await isConsultant(session.user.id)
    if (!isCons) {
      // Not a consultant - redirect to consultant registration page (not admin/user portal)
      return next({ name: 'ConsultantLogin' })
    }
  }

  // Guest route (login page) with active session → redirect appropriately
  if (to.meta.guest && session) {
    const isAdmin = await isAdminOrFounder(session.user.id)
    if (isAdmin) return next({ name: 'Dashboard' })
    const isCons = await isConsultant(session.user.id)
    if (isCons) return next({ name: 'ConsultantDashboard' })
    return next({ name: 'UserPortal' })
  }

  next()
})

export default router

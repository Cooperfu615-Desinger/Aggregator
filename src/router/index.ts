import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
// Configure NProgress
NProgress.configure({ showSpinner: false })

/**
 * Route Configuration
 * - Master Admin routes: /admin/* → uses MasterLayout (Dark Theme)
 * - Merchant routes: /merchant/* → uses MerchantLayout (Light Theme)
 * - Auth routes: /login → No layout
 */

const routes: RouteRecordRaw[] = [
    // ================== ROOT REDIRECT ==================
    {
        path: '/',
        name: 'root',
        redirect: _ => {
            const token = localStorage.getItem('auth_token')
            const role = localStorage.getItem('auth_role')

            if (!token) return '/login'
            return role === 'MASTER' ? '/admin/dashboard' : '/merchant/dashboard'
        }
    },

    // ================== MASTER ADMIN ROUTES ==================
    {
        path: '/admin',
        component: () => import('../layouts/MasterLayout.vue'),
        redirect: '/admin/dashboard',
        meta: { requiresAuth: true, role: 'master' },
        children: [
            {
                path: 'dashboard',
                name: 'admin-dashboard',
                component: () => import('../views/Master/Dashboard/Overview.vue'),
                meta: { title: 'menu.dashboard', roles: ['admin'] } // i18n key
            },
            // Downstream Management (下游管理)
            {
                path: 'merchant/list',
                name: 'merchant-list',
                component: () => import('../views/Master/Merchant/List.vue'),
                meta: { title: 'menu.merchantList', roles: ['admin'] }
            },
            {
                path: 'merchant/create',
                name: 'merchant-create',
                component: () => import('../views/Master/Merchant/Create.vue'),
                meta: { title: 'menu.createMerchant', roles: ['admin'] }
            },
            // Upstream Management (上游管理)
            {
                path: 'game-center/providers',
                name: 'provider-list',
                component: () => import('../views/Master/GameCenter/ProviderList.vue'),
                meta: { title: 'menu.providerList', roles: ['admin'] }
            },
            {
                path: 'game-center/list',
                name: 'game-center',
                component: () => import('../views/Master/GameCenter/GameList.vue'),
                meta: { title: 'menu.gameList', roles: ['admin'] }
            },
            // Finance & Settlement (財務與清算)
            {
                path: 'data-center/bet-log',
                name: 'BetLog',
                component: () => import('../views/Master/DataCenter/BetLog.vue'),
                meta: { title: 'menu.betLog', roles: ['admin'] }
            },
            {
                path: 'data-center/report',
                name: 'FinancialReport',
                component: () => import('../views/Master/DataCenter/Report.vue'),
                meta: { title: 'menu.financialReport', roles: ['admin'] }
            },
            {
                path: 'finance/invoices',
                name: 'InvoiceManager',
                component: () => import('../views/Master/Finance/InvoiceManager.vue'),
                meta: { title: 'menu.invoiceManager', roles: ['admin'] }
            },
            {
                path: 'finance/funds',
                name: 'FundManagement',
                component: () => import('../views/Master/Finance/FundManagement.vue'),
                meta: { title: 'menu.fundManagement', roles: ['admin'] }
            },
            // Risk & System (風控與系統)
            {
                path: 'system/staff',
                name: 'StaffList',
                component: () => import('../views/Master/System/StaffList.vue'),
                meta: { title: 'menu.staffList', roles: ['admin'] }
            },
            {
                path: 'system/job-levels',
                name: 'JobLevelList',
                component: () => import('../views/Master/System/JobLevelList.vue'),
                meta: { title: 'menu.jobLevels', roles: ['admin'] }
            },
            {
                path: 'system/audit-logs',
                name: 'AuditLogs',
                component: () => import('../views/Master/System/AuditLogs.vue'),
                meta: { title: 'menu.auditLogs', roles: ['admin'] }
            },
            {
                path: 'system/settings',
                name: 'SystemSettings',
                component: () => import('../views/Master/System/Settings.vue'),
                meta: { title: 'menu.systemSettings', roles: ['admin'] }
            }
        ]
    },

    // ================== MERCHANT ROUTES ==================
    {
        path: '/merchant',
        component: () => import('../layouts/MerchantLayout.vue'),
        redirect: '/merchant/dashboard',
        meta: { requiresAuth: true, role: 'merchant' },
        children: [
            // Overview (概覽)
            {
                path: 'dashboard',
                name: 'merchant-dashboard',
                component: () => import('../views/Merchant/Dashboard/Index.vue'),
                meta: { title: 'merchant.dashboard.title', roles: ['agent', 'merchant'] }
            },
            // Game Management (遊戲管理)
            {
                path: 'games',
                name: 'merchant-games',
                component: () => import('../views/Merchant/Game/MyGames.vue'),
                meta: { title: 'merchant.games.title', roles: ['agent', 'merchant'] }
            },
            // Report Center (報表中心)
            {
                path: 'reports/daily',
                name: 'DailyReport',
                component: () => import('../views/Merchant/Reports/RevenueReport.vue'),
                meta: { title: 'merchant.reports.daily', roles: ['agent', 'merchant'] }
            },
            {
                path: 'reports/win-loss',
                name: 'WinLossReport',
                component: () => import('../views/Merchant/Reports/WinLoss.vue'),
                meta: { title: 'merchant.reports.winLoss', roles: ['agent', 'merchant'] }
            },
            {
                path: 'reports/bet-query',
                name: 'merchant-bet-query',
                component: () => import('../views/Merchant/Reports/BetQuery.vue'),
                meta: { title: 'merchant.reports.betQuery', roles: ['agent', 'merchant'] }
            },
            {
                path: 'finance/invoices',
                name: 'MerchantInvoices',
                component: () => import('../views/Merchant/Finance/MyInvoices.vue'),
                meta: {
                    title: 'merchant.invoices.title',
                    requiresAuth: true,
                    roles: ['agent']
                }
            },
            {
                path: 'finance/funds',
                name: 'MerchantFunds',
                component: () => import('../views/Merchant/Finance/FundManagement.vue'),
                meta: {
                    title: 'merchant.fundRecord.title',
                    requiresAuth: true,
                    roles: ['agent']
                }
            },
            // Organization (組織管理)
            {
                path: 'organization/sub-list',
                name: 'sub-agent-list',
                component: () => import('../views/Merchant/Organization/SubAgentList.vue'),
                meta: { title: 'merchant.org.subAgents', roles: ['agent', 'merchant'] }
            },
            // Developer (開發者)
            {
                path: 'developer',
                name: 'DeveloperCenter',
                component: () => import('../views/Merchant/Developer/Index.vue'),
                meta: { title: 'merchant.developer.title', roles: ['agent', 'merchant'] }
            }
        ]
    },

    // ================== AUTH ROUTES ==================
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/Auth/index.vue'),
        meta: { title: 'common.login' }
    },

    // ================== FALLBACK ==================
    {
        // Catch All -> 404
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/Error/404.vue'),
        meta: { title: 'common.404' }
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

/**
 * Global Navigation Guard
 * Implements authentication and role-based access control
 * 
 * Rules:
 * 1. /login is always accessible (whitelist)
 * 2. Protected routes require authentication
 * 3. MERCHANT users cannot access /admin/* routes
 * 4. MASTER users can access all routes (god mode)
 */
router.beforeEach(async (to, _from, next) => {
    // Start progress bar
    NProgress.start()

    // Dynamic import to avoid circular dependency
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()

    const isAuthenticated = authStore.isAuthenticated
    const isLoginPath = to.path === '/login'

    // 1. Logged in users shouldn't see login page
    if (isLoginPath && isAuthenticated) {
        return next(authStore.userRole === 'MASTER' ? '/admin/dashboard' : '/merchant/dashboard')
    }

    // 2. Public paths (currently only /login)
    if (isLoginPath || to.name === 'NotFound') {
        return next()
    }

    // 3. Auth Check - Redirect to login if not authenticated
    if (!isAuthenticated) {
        return next(`/login?redirect=${to.fullPath}`)
    }

    // 4. Role Guard
    const routeRole = to.matched.find(record => record.meta.role)?.meta.role as string | undefined

    // MASTER can access everything
    if (authStore.userRole === 'MASTER') {
        return next()
    }

    // MERCHANT cannot access master routes
    if (routeRole === 'master' && authStore.userRole === 'MERCHANT') {
        return next('/merchant/dashboard')
    }

    next()
})

router.afterEach((to) => {
    // Finish progress bar
    NProgress.done()

    // Update document title
    const title = to.meta.title ? `${to.meta.title} - Antigravity` : 'Antigravity'
    document.title = title
})

export default router


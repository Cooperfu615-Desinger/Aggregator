import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: () => import('../layouts/MainLayout.vue'),
            redirect: '/admin/dashboard',
            children: [
                // ================== ADMIN ROUTES ==================
                {
                    path: 'admin/dashboard',
                    name: 'admin-dashboard',
                    component: () => import('../views/Admin/Dashboard/Overview.vue'),
                    meta: { title: 'Dashboard', roles: ['admin'] }
                },
                {
                    path: 'admin/merchant/list',
                    name: 'merchant-list',
                    component: () => import('../views/Admin/Merchant/List.vue'),
                    meta: { title: 'Merchant List', roles: ['admin'] }
                },
                {
                    path: 'admin/merchant/create',
                    name: 'merchant-create',
                    component: () => import('../views/Admin/Merchant/Create.vue'),
                    meta: { title: 'Create Merchant', roles: ['admin'] }
                },
                // Removed redundant config route as it's now a modal
                {
                    path: 'admin/game-center/providers',
                    name: 'provider-list',
                    component: () => import('../views/Admin/GameCenter/ProviderList.vue'),
                    meta: { title: 'Provider Management', roles: ['admin'] }
                },
                {
                    path: 'admin/game-center/list',
                    name: 'game-center',
                    component: () => import('../views/Admin/GameCenter/GameList.vue'),
                    meta: { title: 'Game Center', roles: ['admin'] }
                },
                {
                    path: 'admin/data-center/bet-log',
                    name: 'BetLog',
                    component: () => import('../views/Admin/DataCenter/BetLog.vue'),
                    meta: { title: 'Bet Log Query', roles: ['admin'] }
                },
                {
                    path: 'admin/data-center/report',
                    name: 'FinancialReport',
                    component: () => import('../views/Admin/DataCenter/Report.vue'),
                    meta: { title: 'Financial Report', roles: ['admin'] }
                },

                // ================== AGENT ROUTES ==================
                {
                    path: 'agent/dashboard',
                    name: 'agent-dashboard',
                    component: () => import('../views/Agent/Dashboard/Index.vue'),
                    meta: { title: 'Agent Dashboard', roles: ['agent'] }
                },
                {
                    path: 'agent/organization/sub-list',
                    name: 'sub-agent-list',
                    component: () => import('../views/Agent/Organization/SubAgentList.vue'),
                    meta: { title: 'Sub-Agent List', roles: ['agent'] }
                },
                {
                    path: 'agent/reports',
                    name: 'agent-reports',
                    component: () => import('../views/Agent/Reports/Index.vue'),
                    meta: { title: 'Agent Reports', roles: ['agent'] }
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login/index.vue')
        }
    ]
})

export default router

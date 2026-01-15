import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: () => import('../layouts/MainLayout.vue'),
            redirect: '/dashboard',
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('../views/Dashboard/Overview.vue')
                },
                {
                    path: 'merchant/list',
                    name: 'merchant-list',
                    component: () => import('../views/Merchant/List.vue')
                },
                {
                    path: 'merchant/create',
                    name: 'merchant-create',
                    component: () => import('../views/Merchant/Create.vue')
                },
                {
                    path: 'merchant/config/:id',
                    name: 'merchant-config',
                    component: () => import('../views/Merchant/Configuration.vue')
                },
                {
                    path: 'data-center/round-search',
                    name: 'round-search',
                    component: () => import('../views/DataCenter/RoundSearch.vue')
                },
                // Placeholder for Game Center
                {
                    path: 'game-center/list',
                    name: 'game-center',
                    component: () => import('../views/GameCenter/List.vue')
                }
            ]
        },
        // Login route would go here outside MainLayout
    ]
})

export default router

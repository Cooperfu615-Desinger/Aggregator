import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/merchant/list'
        },
        {
            path: '/merchant/list',
            name: 'merchant-list',
            component: () => import('../views/Merchant/List.vue')
        },
        {
            path: '/merchant/create',
            name: 'merchant-create',
            component: () => import('../views/Merchant/Create.vue')
        },
        {
            path: '/merchant/config/:id',
            name: 'merchant-config',
            component: () => import('../views/Merchant/Configuration.vue')
        }
    ]
})

export default router

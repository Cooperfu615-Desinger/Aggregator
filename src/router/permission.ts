import router from './index'
import { useAuthStore } from '../stores/auth'

const whiteList = ['/login']

router.beforeEach((to, _, next) => {
    const authStore = useAuthStore()
    const hasToken = !!authStore.token

    if (hasToken) {
        if (to.path === '/login') {
            next({ path: '/' })
        } else {
            next()
        }
    } else {
        if (whiteList.includes(to.path)) {
            next()
        } else {
            next(`/login?redirect=${to.path}`)
        }
    }
})

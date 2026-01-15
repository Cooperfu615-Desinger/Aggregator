import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('auth_token'))
    const user = ref<any>(JSON.parse(localStorage.getItem('auth_user') || 'null'))

    const login = (newToken: string, userInfo: any) => {
        token.value = newToken
        user.value = userInfo
        localStorage.setItem('auth_token', newToken)
        localStorage.setItem('auth_user', JSON.stringify(userInfo))
    }

    const logout = () => {
        token.value = null
        user.value = null
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
    }

    return {
        token,
        user,
        login,
        logout
    }
})

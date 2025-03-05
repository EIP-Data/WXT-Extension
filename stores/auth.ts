import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()
    const route = useRoute()
    const isAuthenticated = ref(!!localStorage.getItem('authToken'))

    const login = (token: string) => {
        localStorage.setItem('authToken', token)
        isAuthenticated.value = true
        router.replace(route.query.redirect?.toString() || '/')
    }

    const logout = () => {
        localStorage.removeItem('authToken')
        isAuthenticated.value = false
        router.replace(route.query.redirect?.toString() || '/login')
    }

    return { isAuthenticated, login, logout }
})

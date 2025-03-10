import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from "@/utils/api"
import { UserPreferences } from "@/types/types"
import { storage } from 'wxt/storage'
import i18n from '@/utils/i18n' // Import i18n instance directly

const preferences = ref({} as UserPreferences)

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()
    const route = useRoute()
    const isAuthenticated = ref(!!localStorage.getItem('authToken'))

    const getCurrentLocale = () => i18n.global.locale.value
    const setLocale = (lang: string) => {
        i18n.global.locale.value = lang
    }

    const login = async (token: string) => {
        localStorage.setItem('authToken', token)
        isAuthenticated.value = true
        try {
            const response = await api.get('/preferences')
            preferences.value = response.data.preferences
            await storage.setItem('local:user-lang', preferences.value.language)
            setLocale(preferences.value.language)
        } catch (error) {
            console.error('Failed to load preferences:', error)
        }
        await router.replace(route.query.redirect?.toString() || '/')
    }

    const initLanguage = async () => {
        const lang = await storage.getItem('local:user-lang')
        if (lang?.value) setLocale(lang.value)
    }

    const logout = () => {
        localStorage.removeItem('authToken')
        isAuthenticated.value = false
        router.replace(route.query.redirect?.toString() || '/login')
    }

    return {
        isAuthenticated,
        login,
        logout,
        initLanguage,
        currentLocale: getCurrentLocale // Expose if needed
    }
})

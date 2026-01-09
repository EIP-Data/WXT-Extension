// stores/auth.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import apiHandler from "@/utils/api"
import { UserPreferences } from "@/types/types";
import { storage } from '#imports';
import i18n from '@/utils/i18n';

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter();
    const route = useRoute();

    // State
    const isAuthenticated = ref(false);
    const preferences = ref({} as UserPreferences);

    // Initialize Auth State (Async)
    const initAuth = async () => {
        const token = await storage.getItem<string>('local:authToken');
        isAuthenticated.value = !!token;

        if (token) {
            // Note: pass this token in every apiProxy request
        }

        const lang = await storage.getItem<string>('local:user-lang');
        if (lang) {
            i18n.global.locale.value = lang;
        }
    };

    const login = async (token: string) => {
        await storage.setItem('local:authToken', token);
        isAuthenticated.value = true;

        try {
            const response = await apiHandler.get('/preferences', {
                headers: { Authorization: `Bearer ${token}` }
            });

            preferences.value = response.preferences;

            await storage.setItem('local:user-lang', preferences.value.language);
            i18n.global.locale.value = preferences.value.language;
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }

        const redirectPath = route.query.redirect?.toString() || '/';
        await router.replace(redirectPath);
    };

    const logout = async () => {
        await storage.removeItem('local:authToken');
        isAuthenticated.value = false;
        await router.replace('/login');
    };

    return {
        isAuthenticated,
        login,
        logout,
        initAuth,
        preferences
    };
});

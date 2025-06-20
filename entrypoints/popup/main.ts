import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createPinia } from 'pinia'
import i18n from "@/utils/i18n";
import { createRouter, createWebHashHistory } from 'vue-router'
import Toast from 'vue-toast-notification'
import Home from '@/components/Home.vue';
import Login from '@/components/Login.vue';
import Preferences from '@/components/Preferences.vue';
import 'vue-toast-notification/dist/theme-bootstrap.css';
import {useAuthStore} from "@/stores/auth";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home,
            meta: { requiresAuth: true },
            alias: '/home'
        },
        {
            path: '/login',
            name: 'Login',
            component: Login,
            meta: { requiresAuth: false }
        },
        {
            path: '/preferences',
            name: 'Preferences',
            component: Preferences,
            meta: { requiresAuth: true }
        }
    ],
    scrollBehavior(to, from) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const container = document.getElementById('scroll-container')
                if (container) {
                    container.scrollTop = 0
                }
                resolve(false)
            })
        })
    }
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('authToken')
    if (to.meta.requiresAuth && !isAuthenticated) {
        next({
            path: '/login',
            query: { redirect: to.fullPath }
        })
    } else if (to.name === 'Login' && isAuthenticated) {
        next('/')
    } else {
        next()
    }
})


const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Toast, {
    transition: 'Vue-Toastification__bounce',
    maxToasts: 2,
    newestOnTop: true
});
app.use(i18n);
const auth = useAuthStore()
auth.initLanguage()
app.mount('#app');

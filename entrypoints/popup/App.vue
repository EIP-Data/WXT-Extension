<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ChevronDownIcon, Cog6ToothIcon,SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { ref, computed, provide, watchEffect } from 'vue'

const { t } = useI18n()
const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const showSettings = ref(false)
const selectedMenuItem = ref('')
const isAuthenticated = computed(() => !localStorage.getItem('authToken'))

const menuItems = computed(() => [
  { id: 'home', label: t('menu.home'), route: '/', requiresAuth: true },
  { id: 'preferences', label: t('menu.preferences'), route: '/preferences', requiresAuth: true },
  { id: 'language', label: t('menu.language'), submenu: ['en', 'fr'], requiresAuth: false },
  {
    id: 'auth',
    label: isAuthenticated.value ? t('menu.logout') : t('menu.login'),
    action: () => isAuthenticated.value ? logout() : router.push('/login'),
    requiresAuth: false
  },
].filter(item => !item.requiresAuth || isAuthenticated.value))

const switchLanguage = (lang: 'en' | 'fr') => {
  locale.value = lang
  localStorage.setItem('user-lang', lang)
  selectedMenuItem.value = ''
}

const login = (token: string) => {
  localStorage.setItem('authToken', token)
  router.replace(route.query.redirect?.toString() || '/')
}

const logout = () => {
  localStorage.removeItem('authToken')
  router.replace('/login')
}

provide('auth', { isAuthenticated, login, logout })

const handleMenuAction = (itemId: string) => {
  const menuItem = menuItems.value.find(item => item.id === itemId)
  if (!menuItem) return

  if (menuItem.route) {
    router.push(menuItem.route)
    showSettings.value = false
  }
  else if (menuItem.action) {
    menuItem.action()
    showSettings.value = false
  }
  else if (menuItem.submenu) {
    selectedMenuItem.value = selectedMenuItem.value === itemId ? '' : itemId
  }
  else {
    console.error('No action defined for menu item', menuItem)
  }
}

onMounted(() => {
  if (!isAuthenticated.value && route.meta.requiresAuth) {
    router.replace('/login')
  }
})
</script>

<template>
  <div class="w-[400px] min-h-[400px] p-4
           bg-gradient-to-br from-blue-50 to-indigo-100
           dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900
           relative transition-colors duration-200">
  <div v-if="isAuthenticated" class="flex justify-end p-2">
      <button
          @click="showSettings = !showSettings"
          class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700/50
             rounded-full transition-colors duration-200"
      >
        <Cog6ToothIcon class="w-6 h-6 text-gray-600 dark:text-gray-300"/>
      </button>
    </div>

    <transition name="slide">
      <div
          v-if="showSettings && isAuthenticated"
          class="absolute right-4 top-16 w-64
           bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900
           border border-gray-100 dark:border-gray-700
           rounded-lg shadow-xl backdrop-blur-sm"
      >
        <div class="p-4 space-y-2">
          <template v-for="item in menuItems" :key="item.id">
            <div
                v-if="item.id !== 'auth' || !isAuthenticated"
                @click="handleMenuAction(item.id)"
                class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                :class="{ 'bg-gray-50 dark:hover:bg-gray-700': route.path === item.route }"
            >
              <span>{{ item.label }}</span>
              <ChevronDownIcon
                  v-if="item.submenu"
                  class="w-4 h-4 transform transition-transform"
                  :class="{ 'rotate-180': selectedMenuItem === item.id }"
              />
            </div>

            <transition name="fade">
              <div
                  v-if="selectedMenuItem === 'language' && item.id === 'language'"
                  class="ml-4 space-y-2"
              >
                <div
                    v-for="lang in item.submenu"
                    :key="lang"
                    @click="switchLanguage(lang)"
                    class="p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60
                   rounded-lg cursor-pointer transition-colors
                   bg-blue-50 dark:bg-gray-700/30"
                    :class="{ 'bg-blue-50 dark:bg-gray-500': locale === lang }"
                >
                  {{ lang.toUpperCase() }}
                </div>
              </div>
            </transition>
          </template>
        </div>
      </div>
    </transition>

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>


<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

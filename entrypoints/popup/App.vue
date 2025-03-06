<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ChevronDownIcon, Cog6ToothIcon, HomeIcon, AdjustmentsHorizontalIcon, LanguageIcon } from '@heroicons/vue/24/outline'
import { ref, computed, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const showSettings = ref(false)
const selectedMenuItem = ref('')
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => {
  showSettings.value = false
})

onMounted(() => {
  const lang = localStorage.getItem('user-lang') as 'en' | 'fr'
  if (lang) {
    locale.value = lang
  }
})

const menuItems = computed(() => [
  { id: 'home', label: t('menu.home'), route: '/', requiresAuth: true, icon: HomeIcon },
  { id: 'preferences', label: t('menu.preferences'), route: '/preferences', requiresAuth: true, icon: AdjustmentsHorizontalIcon },
  {
    id: 'auth',
    label: auth.isAuthenticated ? t('menu.logout') : t('menu.login'),
    action: () => auth.isAuthenticated ? auth.logout() : router.push('/login'),
    requiresAuth: false
  },
].filter(item => !item.requiresAuth || auth.isAuthenticated))

const switchLanguage = (lang: 'en' | 'fr') => {
  locale.value = lang
  localStorage.setItem('user-lang', lang)
  selectedMenuItem.value = ''
}

watch(
    [() => route.meta.requiresAuth, () => auth.isAuthenticated],
    ([requiresAuth, authenticated]) => {
      if (requiresAuth && !authenticated) {
        router.replace('/login')
      }
    },
    { immediate: true }
)

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
  else {
    console.error('No action defined for menu item', menuItem)
  }
}
</script>

<template>
  <div class="w-[400px] h-[600px] relative shadow-xl dark:border-gray-700
             bg-gradient-to-br from-blue-50 to-indigo-100
             dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900
             flex flex-col overflow-hidden">
  >

  <div v-if="auth.isAuthenticated" class="flex justify-end p-2">
        <button
            @click.stop="showSettings = !showSettings"
            class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700/50
               rounded-full transition-colors duration-200"
        >
          <Cog6ToothIcon class="w-6 h-6 text-gray-600 dark:text-gray-300"/>
        </button>
      </div>

      <transition name="slide">
        <div
            v-if="showSettings && auth.isAuthenticated"
            ref="dropdownRef"
            class="absolute right-4 top-16 w-64
             bg-white dark:bg-gray-950 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900
             border border-gray-100 dark:border-gray-700
             rounded-lg shadow-xl backdrop-blur-sm z-50 dark:text-gray-300"
        >
          <div class="p-4 space-y-2">
            <template v-for="item in menuItems" :key="item.id">
              <div
                  v-if="item.id !== 'auth' || !auth.isAuthenticated"
                  @click.stop="handleMenuAction(item.id)"
                  class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                  :class="{ 'bg-gray-50 dark:bg-gray-700': route.path === item.route }"
              >
                <template v-if="item.id === 'home'">
                  <HomeIcon class="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </template>
                <template v-if="item.id === 'preferences'">
                  <AdjustmentsHorizontalIcon class="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </template>
                <template v-if="item.id === 'language'">
                  <svg class="w-5 h-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                  </svg>
                </template>

                <span class="flex-1">{{ item.label }}</span>
                <ChevronDownIcon
                    v-if="item.submenu"
                    class="w-4 h-4 transform transition-transform"
                    :class="{ 'rotate-180': selectedMenuItem === item.id }"
                />
              </div>
            </template>
            <div v-if="auth.isAuthenticated" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div
                  @click.stop="auth.logout(); showSettings = false"
                  class="p-3 text-center cursor-pointer transition-colors
                         bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700
                         text-white rounded-lg"
              >
                {{ t('menu.logout') }}
              </div>
            </div>
          </div>
        </div>
      </transition>
    <div id="scroll-container" class="max-h-100 overflow-y-auto
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in" @after-enter="handleScrollReset">
          <component :is="Component" class="h-full" />
        </transition>
      </router-view>
    </div>
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

import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';
import vueI18n from '@intlify/unplugin-vue-i18n/vite';
// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    define: {
      'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(process.env.VITE_API_ENDPOINT)
    },
    plugins: [
      // See https://vue-i18n.intlify.dev/guide/advanced/optimization.html
      vueI18n({
        include: 'assets/locales/*.json',
      }),
    ],
  }),
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: [
      "scripting",
      "activeTab",
      "storage",
    ],
    host_permissions: ["<all_urls>",
        '*://localhost/*' ],
  },
  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')]
    }
  },
  web_accessible_resources: [
    {
      resources: ['popup.html'],
      matches: ['<all_urls>']
    }
  ]
});

import { defineConfig } from 'wxt';

import vueI18n from '@intlify/unplugin-vue-i18n/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    define: {
      'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(process.env.VITE_API_ENDPOINT),
    },
    css: {
      postcss: {
        plugins: [require('tailwindcss'), require('autoprefixer')],
      },
    },
    plugins: [
      // See https://vue-i18n.intlify.dev/guide/advanced/optimization.html
      vueI18n({
        include: 'assets/locales/*.json',
      }),
    ] as any,
  }),
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',

    // IMPORTANT: define action so browser.action exists
    action: {
      default_title: '__MSG_extName__',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '96': 'icon/96.png',
        '128': 'icon/128.png',
      },
    },

    permissions: ['scripting', 'activeTab', 'storage', 'tabs', 'webRequest', 'notifications'],
    host_permissions: ['<all_urls>'],
  },
});

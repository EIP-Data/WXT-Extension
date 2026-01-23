import { createApp } from 'vue';
import OverlayApp from '@/components/OverlayApp.vue';
import { createPinia } from 'pinia';
import i18n, { loadUserLanguage } from '@/utils/i18n';
import Toast from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
import VueApexCharts from 'vue3-apexcharts';
import { useAuthStore } from '@/stores/auth';
import '@/assets/style.css';

let overlayApp: any = null;
let uiInstance: any = null;

export default defineContentScript({
    matches: ['<all_urls>'],
    cssInjectionMode: 'ui',

    async main(ctx) {
        await loadUserLanguage();

        const ui = await createShadowRootUi(ctx, {
            name: 'datalyz-overlay',
            position: 'inline',
            anchor: 'body',
            zIndex: 2147483647,

            onMount: (container) => {
                // ✅ Add dark mode support to shadow root
                const shadowHost = container.parentElement;
                if (shadowHost) {
                    shadowHost.setAttribute('data-wxt-shadow-root', 'true');

                    // Load dark mode preference
                    browser.storage.local.get(['darkMode']).then((result) => {
                        if (result.darkMode) {
                            shadowHost.classList.add('dark');
                        }
                    });
                }

                const app = createApp(OverlayApp);
                app.use(createPinia());
                app.use(i18n);
                app.use(VueApexCharts);
                app.use(Toast, {
                    transition: 'Vue-Toastification__bounce',
                    maxToasts: 2,
                    newestOnTop: true,
                });

                const authStore = useAuthStore();
                authStore.initAuth();

                overlayApp = app;
                app.mount(container);
                return app;
            },

            onRemove: (app) => {
                app?.unmount();
            },
        });

        uiInstance = ui;
        ui.mount();

        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'TOGGLE_OVERLAY') {
                window.dispatchEvent(new CustomEvent('datalyz:toggle'));
                sendResponse({ success: true });
            }
        });

        console.log('✅ Datalyz Overlay Content Script Ready');
    },
});

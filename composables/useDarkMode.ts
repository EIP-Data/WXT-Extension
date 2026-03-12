import { ref, watch, onMounted } from 'vue';

const isDark = ref(false);

export function useDarkMode() {
    const toggleDarkMode = () => {
        isDark.value = !isDark.value;
        applyTheme();
    };

    const applyTheme = () => {
        // ✅ Apply directly to the shadow host element
        const shadowRoot = document.querySelector('datalyz-overlay')?.shadowRoot;
        if (shadowRoot) {
            const container = shadowRoot.querySelector(':host') || shadowRoot.host;

            if (isDark.value) {
                // Add dark class to the root element inside shadow DOM
                const rootDiv = shadowRoot.querySelector('[class*="fixed"]');
                if (rootDiv) {
                    rootDiv.classList.add('dark');
                }
            } else {
                const rootDiv = shadowRoot.querySelector('[class*="fixed"]');
                if (rootDiv) {
                    rootDiv.classList.remove('dark');
                }
            }
        }

        // Save preference
        browser.storage.local.set({ darkMode: isDark.value });
    };

    const loadTheme = async () => {
        const result = await browser.storage.local.get(['darkMode']);
        isDark.value = result.darkMode ?? false;
        setTimeout(() => applyTheme(), 100); // Small delay to ensure DOM is ready
    };

    onMounted(() => {
        loadTheme();
    });

    watch(isDark, () => {
        applyTheme();
    });

    return {
        isDark,
        toggleDarkMode,
        loadTheme,
    };
}

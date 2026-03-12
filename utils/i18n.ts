import { createI18n } from 'vue-i18n';
import type schema from '@/assets/locales/en.json';
import { storage } from '#imports';
import messages from '@intlify/unplugin-vue-i18n/messages';

export type I18nSchema = typeof schema;
export type I18nLocales = 'en' | 'fr';

const i18n = createI18n<[I18nSchema], I18nLocales>({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: messages as Record<I18nLocales, I18nSchema>,
});

export default i18n;

// 3. Export a separate async function to update the locale
export async function loadUserLanguage() {
    const savedLang = await storage.getItem<string>('local:user-lang');

    const userLocale = savedLang || browser.i18n.getUILanguage().slice(0, 2);

    // Update the global locale
    if (i18n.global.locale.value !== userLocale) {
        i18n.global.locale.value = userLocale as I18nLocales;
    }
}

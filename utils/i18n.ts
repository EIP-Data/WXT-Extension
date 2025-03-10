import { createI18n } from 'vue-i18n';
import type schema from '~/assets/locales/en.json';
import messages from '@intlify/unplugin-vue-i18n/messages';

export type I18nSchema = typeof schema;
export type I18nLocales = 'en' | 'fr';

const getInitialLocale = async () => {
    const savedLang = await storage.getItem<string>('local:user-lang')
    return savedLang?.value ?? browser.i18n.getUILanguage().slice(0, 2)
}

export default createI18n<[I18nSchema], I18nLocales>({
    legacy: false,
    locale: await getInitialLocale(),
    fallbackLocale: 'en',
    messages: messages as Record<I18nLocales, I18nSchema>,
});
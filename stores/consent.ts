import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiHandler from '@/utils/api';

/** Bump this string whenever the consent text changes to re-prompt users. */
export const CONSENT_VERSION = '1.0';

interface ConsentRecord {
    hasConsented: boolean;
    consentTimestamp: number;
    consentVersion: string;
}

export const useConsentStore = defineStore('consent', () => {
    // null  = not yet decided (first install or cleared)
    // false = explicitly declined
    // true  = explicitly accepted
    const hasConsented = ref<boolean | null>(null);
    const consentTimestamp = ref<number | null>(null);
    const consentVersion = ref<string>(CONSENT_VERSION);

    /** Read persisted consent decision from storage. Call before mounting the UI. */
    const initConsent = async (): Promise<void> => {
        const result = await browser.storage.local.get(['userConsent']);
        const stored: ConsentRecord | undefined = result.userConsent;
        if (stored !== undefined) {
            hasConsented.value = stored.hasConsented;
            consentTimestamp.value = stored.consentTimestamp;
            consentVersion.value = stored.consentVersion ?? CONSENT_VERSION;
        }
        // hasConsented stays null when no record exists (first install)
    };

    /** User clicked Accept — save decision, then enable tracking in the background. */
    const grantConsent = async (): Promise<void> => {
        const now = Date.now();
        hasConsented.value = true;
        consentTimestamp.value = now;
        consentVersion.value = CONSENT_VERSION;

        // Persist BEFORE messaging the background so its consent guard passes
        await browser.storage.local.set({
            userConsent: {
                hasConsented: true,
                consentTimestamp: now,
                consentVersion: CONSENT_VERSION,
            } as ConsentRecord,
        });

        await browser.runtime.sendMessage({ action: 'TOGGLE_TRACKING', data: { enabled: true } });
    };

    /** User clicked Decline (or revoked via Settings) — disable tracking and wipe data. */
    const revokeConsent = async (): Promise<void> => {
        const now = Date.now();
        hasConsented.value = false;
        consentTimestamp.value = now;

        await browser.storage.local.set({
            userConsent: {
                hasConsented: false,
                consentTimestamp: now,
                consentVersion: CONSENT_VERSION,
            } as ConsentRecord,
        });

        // Disable tracking first, then wipe all collected analytics
        await browser.runtime.sendMessage({ action: 'TOGGLE_TRACKING', data: { enabled: false } });
        await browser.runtime.sendMessage({ action: 'CLEAR_ADS_ANALYTICS' });
    };

    /**
     * GDPR Art. 17 erasure request.
     * Clears all local data, resets consent state, and requests server-side deletion.
     */
    const requestErasure = async (): Promise<void> => {
        // Clear all locally held data via background
        await browser.runtime.sendMessage({ action: 'CLEAR_ADS_ANALYTICS' });
        await browser.storage.local.remove(['userConsent', 'authToken', 'adsAnalytics']);

        hasConsented.value = null;
        consentTimestamp.value = null;

        // Best-effort server-side erasure
        try {
            await apiHandler.delete('/user/data');
        } catch (error) {
            console.error('Server-side erasure request failed:', error);
        }
    };

    return {
        hasConsented,
        consentTimestamp,
        consentVersion,
        initConsent,
        grantConsent,
        revokeConsent,
        requestErasure,
    };
});


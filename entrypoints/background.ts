import i18n from "@/utils/i18n";
import { easyListManager } from "@/utils/easyListParser";
import { categorizeAdType } from "@/utils/adCategories";

interface AdData {
    type: 'ad_detected';
    adType: string;
    publisher: string;
    network: string;
    url: string;
    domain: string;
    timestamp: number;
    filter?: string;
    metadata?: any;
}

export default defineBackground(() => {
    let isTrackingEnabled = true;
    const adsStore: AdData[] = [];

    console.log('Background script initializing...');

    // Initialize EasyList
    easyListManager.initialize().then(() => {
        console.log('EasyList ready');
    });

    // Load initial state from storage
    browser.storage.local.get(['trackingEnabled']).then((result) => {
        isTrackingEnabled = result.trackingEnabled ?? true;
    });

    // Listen for web requests to detect ads using EasyList
    if (browser.webRequest && browser.webRequest.onBeforeRequest) {
        browser.webRequest.onBeforeRequest.addListener(
            (details) => {
                if (!isTrackingEnabled) return;

                const sourceUrl = details.initiator || details.documentUrl || '';

                // Check if URL matches EasyList filters
                const isAd = easyListManager.isAdRequest(details.url, sourceUrl, details.type);

                if (isAd) {
                    const matchedFilter = easyListManager.getMatchingFilter(details.url, sourceUrl);
                    const url = new URL(details.url);

                    const adData: AdData = {
                        type: 'ad_detected',
                        adType: matchedFilter
                            ? easyListManager.categorizeAdFromFilter(matchedFilter, details.url)
                            : categorizeAdType(url),
                        publisher: extractPublisher(details),
                        network: matchedFilter
                            ? easyListManager.extractAdNetwork(matchedFilter)
                            : 'Unknown',
                        url: details.url,
                        domain: url.hostname,
                        timestamp: Date.now(),
                        filter: matchedFilter || undefined,
                        metadata: {
                            method: details.method,
                            type: details.type,
                            initiator: details.initiator
                        }
                    };

                    storeAdData(adData);
                }
            },
            { urls: ["<all_urls>"] },
            []
        );
    }

    function extractPublisher(details: any): string {
        if (details.initiator) {
            try {
                const initiatorUrl = new URL(details.initiator);
                return initiatorUrl.hostname;
            } catch (e) {
                return 'Unknown';
            }
        }
        return 'Unknown';
    }

    async function storeAdData(adData: AdData) {
        adsStore.push(adData);

        const result = await browser.storage.local.get(['adsAnalytics']);
        const existingAds = result.adsAnalytics || [];
        existingAds.push(adData);

        const trimmed = existingAds.slice(-500);
        await browser.storage.local.set({ adsAnalytics: trimmed });

        console.log('Ad detected:', adData.network, '-', adData.adType);

        try {
            await browser.runtime.sendMessage({
                action: 'AD_DETECTED',
                data: adData
            });
        } catch (e) {
            // Popup not open
        }
    }

    browser.runtime.onMessage.addListener(
        (message: { action: string; data?: any }, sender, sendResponse) => {
            (async () => {
                try {
                    switch (message.action) {
                        case 'UPDATE_EASYLIST': {
                            await easyListManager.updateFilters();
                            sendResponse({ success: true });
                            break;
                        }

                        case 'GET_ADS_ANALYTICS': {
                            const result = await browser.storage.local.get(['adsAnalytics']);
                            const ads = result.adsAnalytics || [];
                            const stats = aggregateAdStats(ads);
                            sendResponse({ data: ads, stats });
                            break;
                        }

                        case 'TOGGLE_TRACKING': {
                            isTrackingEnabled = message.data.enabled;
                            await browser.storage.local.set({ trackingEnabled: isTrackingEnabled });
                            sendResponse({ success: true, enabled: isTrackingEnabled });
                            break;
                        }

                        case 'GET_TRACKING_STATE': {
                            sendResponse({ enabled: isTrackingEnabled });
                            break;
                        }

                        case 'CLEAR_ADS_ANALYTICS': {
                            await browser.storage.local.set({ adsAnalytics: [] });
                            adsStore.length = 0;
                            sendResponse({ success: true });
                            break;
                        }

                        default:
                            sendResponse({ error: 'Unknown action' });
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                    sendResponse({ success: false, error: String(error) });
                }
            })();

            return true;
        }
    );

    function aggregateAdStats(ads: AdData[]) {
        const stats = {
            totalAds: ads.length,
            byNetwork: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            byPublisher: {} as Record<string, number>,
            recentAds: ads.slice(-50)
        };

        ads.forEach(ad => {
            stats.byNetwork[ad.network] = (stats.byNetwork[ad.network] || 0) + 1;
            stats.byType[ad.adType] = (stats.byType[ad.adType] || 0) + 1;
            stats.byPublisher[ad.publisher] = (stats.byPublisher[ad.publisher] || 0) + 1;
        });

        return stats;
    }
});

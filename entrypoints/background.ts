import { easyListManager } from "@/utils/easyListParser";
import { categorizeAdType } from "@/utils/adCategories";
import axios from 'axios';

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

    // 1. Initialize EasyList
    easyListManager.initialize().then(() => {
        console.log('EasyList ready');
    });

    // 2. Load initial state
    browser.storage.local.get(['trackingEnabled']).then((result) => {
        isTrackingEnabled = result.trackingEnabled ?? true;
    });

    // 3. Helper Functions
    async function storeAdData(adData: AdData) {
        adsStore.push(adData);

        const result = await browser.storage.local.get(['adsAnalytics']);
        const existingAds = result.adsAnalytics || [];
        existingAds.push(adData);

        // Keep last 500 ads
        const trimmed = existingAds.slice(-500);
        await browser.storage.local.set({ adsAnalytics: trimmed });

        console.log('Ad stored:', adData.network, '-', adData.adType);

        // Notify UI if open
        try {
            // We use a different action name to avoid infinite loops if the UI listens to AD_DETECTED
            await browser.runtime.sendMessage({
                action: 'AD_STORED_UPDATE',
                data: adData
            });
        } catch (e) {
            // UI not open, ignore
        }
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

    // 4. MAIN MESSAGE LISTENER
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // API Proxy - needs async response
        if (message.action === 'API_PROXY_REQUEST') {
            const { url, method, data, headers, baseURL } = message.data;
            const client = axios.create({ baseURL, headers });

            client.request({ url, method, data })
                .then((response) => {
                    sendResponse({ success: true, data: { data: response.data, status: response.status } });
                })
                .catch((error) => {
                    console.error("Background API Fetch Error:", error);
                    sendResponse({ success: false, error: error.message || 'Unknown network error' });
                });

            return true; // ✅ Only return true for API_PROXY_REQUEST
        }

        // Other Actions - handle synchronously or with async/await
        const handleAsync = async () => {
            try {
                switch (message.action) {
                    case 'AD_DETECTED':
                        await storeAdData(message.data);
                        sendResponse({ success: true });
                        break;

                    case 'REPORT_ADS':
                        if (message.data && message.data.ads) {
                            for (const ad of message.data.ads) {
                                await storeAdData(ad);
                            }
                        }
                        sendResponse({ success: true });
                        break;

                    case 'UPDATE_EASYLIST':
                        await easyListManager.updateFilters();
                        sendResponse({ success: true });
                        break;

                    case 'GET_ADS_ANALYTICS':
                        const result = await browser.storage.local.get(['adsAnalytics']);
                        const ads = result.adsAnalytics || [];
                        const stats = aggregateAdStats(ads);
                        sendResponse({ data: ads, stats });
                        break;

                    case 'TOGGLE_TRACKING':
                        isTrackingEnabled = message.data.enabled;
                        await browser.storage.local.set({ trackingEnabled: isTrackingEnabled });
                        sendResponse({ success: true, enabled: isTrackingEnabled });
                        break;

                    case 'GET_TRACKING_STATE':
                        sendResponse({ enabled: isTrackingEnabled });
                        break;

                    case 'CLEAR_ADS_ANALYTICS':
                        await browser.storage.local.set({ adsAnalytics: [] });
                        adsStore.length = 0;
                        sendResponse({ success: true });
                        break;

                    default:
                        // Don't handle unknown actions
                        break;
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ success: false, error: String(error) });
            }
        };

        if (['AD_DETECTED', 'REPORT_ADS', 'UPDATE_EASYLIST', 'GET_ADS_ANALYTICS',
            'TOGGLE_TRACKING', 'GET_TRACKING_STATE', 'CLEAR_ADS_ANALYTICS'].includes(message.action)) {
            handleAsync();
            return true;
        }
        return false;
    });

    // 5. Web Request Listener (Network detection)
    if (browser.webRequest && browser.webRequest.onBeforeRequest) {
        browser.webRequest.onBeforeRequest.addListener(
            (details) => {
                if (!isTrackingEnabled) return;

                const sourceUrl = details.initiator || details.documentUrl || '';
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

    // 6. Click Listener
    browser.action.onClicked.addListener((tab) => {
        if (!tab.id || !tab.url) return;

        // Detect restricted URLs
        const restrictedProtocols = ['about:', 'chrome:', 'edge:', 'moz-extension:', 'chrome-extension:'];
        const isRestricted = restrictedProtocols.some(protocol => tab.url!.startsWith(protocol));

        if (isRestricted) {
            // Show notification that extension can't run here
            browser.notifications?.create({
                type: 'basic',
                iconUrl: 'icon/128.png',
                title: 'Datalyz',
                message: 'Extension cannot run on this page due to browser security. Please navigate to a regular website.',
            });
            return;
        }

        // Send toggle message
        browser.tabs.sendMessage(tab.id, { action: 'TOGGLE_OVERLAY' }).catch(() => {});
    });
});

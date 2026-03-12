import { easyListManager } from "@/utils/easyListParser";
import { categorizeAdType } from "@/utils/adCategories";
import { analyzeTracker, extractTargetingParams } from "@/utils/trackerAnalyzer";
import { batchQueue } from "@/utils/batchQueue";
import type { AdData, BatchPayload } from "@/types/types";
import apiHandler from "@/utils/api";
import axios from 'axios';

export default defineBackground(() => {
    let isTrackingEnabled = true;
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

    function detectNetworkFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.toLowerCase();

            // Direct domain matching
            if (domain.includes('doubleclick')) return 'Google DoubleClick';
            if (domain.includes('googlesyndication')) return 'Google Ads';
            if (domain.includes('googleadservices')) return 'Google Ads';
            if (domain.includes('facebook')) return 'Facebook Ads';
            if (domain.includes('amazon-adsystem')) return 'Amazon Ads';
            if (domain.includes('taboola')) return 'Taboola';
            if (domain.includes('outbrain')) return 'Outbrain';
            if (domain.includes('criteo')) return 'Criteo';
            if (domain.includes('adnxs') || domain.includes('appnexus')) return 'AppNexus/Xandr';
            if (domain.includes('adsrvr')) return 'The Trade Desk';
            if (domain.includes('rubiconproject') || domain.includes('rfihub')) return 'Rubicon/Magnite';
            if (domain.includes('pubmatic')) return 'PubMatic';
            if (domain.includes('openx')) return 'OpenX';
            if (domain.includes('casalemedia') || domain.includes('indexexchange')) return 'Index Exchange';

            return 'Unknown Network';
        } catch {
            return 'Unknown Network';
        }
    }

    // 4. Store ad data in batch queue instead of directly
    async function storeAdData(adData: AdData) {
        await batchQueue.addData(adData);

        // Still store locally for real-time UI display
        const result = await browser.storage.local.get(['adsAnalytics']);
        const existingAds = result.adsAnalytics || [];
        existingAds.push(adData);

        // Keep last 500 ads locally for UI
        const trimmed = existingAds.slice(-500);
        await browser.storage.local.set({ adsAnalytics: trimmed });

        console.log('Ad queued:', adData.network, '-', adData.adType);

        // Notify UI
        try {
            await browser.runtime.sendMessage({
                action: 'AD_STORED_UPDATE',
                data: adData
            });
        } catch (e) {
            // UI not open, ignore
        }
    }

    function aggregateAdStats(ads: AdData[]) {
        const stats = {
            totalAds: ads.length,
            byNetwork: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            byPublisher: {} as Record<string, number>,
            byTracker: {} as Record<string, number>,
            recentAds: ads.slice(-50)
        };

        ads.forEach(ad => {
            stats.byNetwork[ad.network] = (stats.byNetwork[ad.network] || 0) + 1;
            stats.byType[ad.adType] = (stats.byType[ad.adType] || 0) + 1;
            stats.byPublisher[ad.publisher] = (stats.byPublisher[ad.publisher] || 0) + 1;
            if (ad.tracker) {
                const key = `${ad.tracker.category} (${ad.tracker.vendor || 'Unknown'})`;
                stats.byTracker[key] = (stats.byTracker[key] || 0) + 1;
            }
        });

        return stats;
    }

    // 5. MAIN MESSAGE LISTENER
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // ✅ API Proxy - needs async response (RESTORE THIS)
        if (message.action === 'API_PROXY_REQUEST') {
            const { url, method, data, headers, baseURL } = message.data;
            const client = axios.create({ baseURL, headers });

            client.request({ url, method, data })
                .then((response) => {
                    sendResponse({
                        success: true,
                        data: { data: response.data, status: response.status },
                        status: response.status
                    });
                })
                .catch((error) => {
                    console.error("Background API Fetch Error:", error);
                    sendResponse({
                        success: false,
                        error: error.response?.data?.message || error.message || 'Unknown network error',
                        status: error.response?.status || 500,
                        data: error.response?.data
                    });
                });

            return true; // ✅ Keep channel open for async response
        }

        // Other Actions - handle synchronously or with async/await
        const handleAsync = async () => {
            try {
                switch (message.action) {
                    case 'AD_DETECTED': {
                        await storeAdData(message.data);
                        sendResponse({ success: true });
                        break;
                    }

                    case 'REPORT_ADS': {
                        if (message.data && message.data.ads) {
                            for (const ad of message.data.ads) {
                                await storeAdData(ad);
                            }
                        }
                        sendResponse({ success: true });
                        break;
                    }

                    case 'UPDATE_EASYLIST': {
                        await easyListManager.updateFilters();
                        sendResponse({ success: true });
                        break;
                    }

                    case 'GET_ADS_ANALYTICS': {
                        const result = await browser.storage.local.get(['adsAnalytics']);
                        const ads = result.adsAnalytics || [];
                        const stats = aggregateAdStats(ads);
                        const queueStats = await batchQueue.getQueueStats();
                        sendResponse({ data: ads, stats, queueStats });
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
                        await batchQueue.clearQueue();
                        sendResponse({ success: true });
                        break;
                    }

                    case 'FORCE_SYNC': {
                        await batchQueue.flushBatch();
                        await batchQueue.processQueue();
                        sendResponse({ success: true });
                        break;
                    }

                    case 'GET_QUEUE_STATS': {
                        const queueStats = await batchQueue.getQueueStats();
                        sendResponse({ success: true, stats: queueStats });
                        break;
                    }

                    case 'SEND_BATCH_TO_BACKEND': {
                        try {
                            const response = await apiHandler.post('/analytics/batch', message.data);
                            sendResponse({ success: true, data: response.data });
                        } catch (error: any) {
                            console.error('Backend API error:', error);
                            sendResponse({
                                success: false,
                                error: error.response?.data?.message || error.message
                            });
                        }
                        break;
                    }

                    default: {
                        sendResponse({ success: false, error: 'Unknown action' });
                        break;
                    }
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ success: false, error: String(error) });
            }
        };

        handleAsync();
        return true;
    });


    // 6. Web Request Listener (Network detection)
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
                            : categorizeAdType(url, details.type, undefined),
                        publisher: extractPublisher(details),
                        network: matchedFilter
                            ? easyListManager.extractAdNetwork(matchedFilter, details.url)
                            : detectNetworkFromUrl(details.url),
                        url: details.url,
                        domain: url.hostname,
                        timestamp: Date.now(),
                        filter: matchedFilter || undefined,
                        targeting: extractTargetingParams(url),
                        tracker: analyzeTracker(details.url),
                        metadata: {
                            method: details.method,
                            type: details.type,
                            initiator: details.initiator,
                            requestType: details.type
                        }
                    };

                    storeAdData(adData);
                }
            },
            { urls: ["<all_urls>"] },
            []
        );
    }

    // 7. Click Listener
    browser.action.onClicked.addListener((tab) => {
        if (!tab.id || !tab.url) return;

        const restrictedProtocols = ['about:', 'chrome:', 'edge:', 'moz-extension:', 'chrome-extension:'];
        const isRestricted = restrictedProtocols.some(protocol => tab.url!.startsWith(protocol));

        if (isRestricted) {
            browser.notifications?.create({
                type: 'basic',
                iconUrl: 'icon/128.png',
                title: 'Datalyz',
                message: 'Extension cannot run on this page due to browser security.',
            });
            return;
        }

        browser.tabs.sendMessage(tab.id, { action: 'TOGGLE_OVERLAY' }).catch(() => {});
    });
});

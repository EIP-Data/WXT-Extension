import type { AdData } from '@/types/types';

const DEBUG = import.meta.env.DEV ?? false;

export default defineContentScript({
    matches: ['<all_urls>'],

    main() {
        let isTrackingEnabled = true;
        let eventListenersActive = false;
        const detectedAds: AdData[] = [];
        const detectedFingerprints = new Set<string>();
        let observer: MutationObserver | null = null;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        if (DEBUG) console.log('Content script initialized on:', window.location.href);

        // Get initial tracking state
        browser.runtime.sendMessage({ action: 'GET_TRACKING_STATE' })
            .then((response) => {
                isTrackingEnabled = response.enabled;
                if (isTrackingEnabled && !eventListenersActive) {
                    startTracking();
                }
            })
            .catch((err) => { if (DEBUG) console.log('Failed to get tracking state:', err); });

        // Listen for tracking state changes
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'TRACKING_STATE_CHANGED') {
                isTrackingEnabled = message.data.enabled;

                if (isTrackingEnabled && !eventListenersActive) {
                    startTracking();
                    if (DEBUG) console.log('✅ Tracking enabled');
                } else if (!isTrackingEnabled && eventListenersActive) {
                    stopTracking();
                    if (DEBUG) console.log('❌ Tracking disabled');
                }

                sendResponse({ received: true });
            }
            return true;
        });

        // Detect ads in the DOM
        function detectAdsInDOM() {
            if (!isTrackingEnabled) return;

            const adSelectors = [
                '[class*="ad-"]',
                '[id*="ad-"]',
                '[class*="advertisement"]',
                '[data-ad]',
                'ins.adsbygoogle',
                '[data-google-query-id]',
                '[aria-label*="Advertisement"]',
                'iframe[src*="ads"]',
                'iframe[src*="doubleclick"]',
                'iframe[src*="facebook"]',
                '[class*="sponsored"]',
                '[data-ad-slot]'
            ];

            adSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const fingerprint = `${selector}|${el.className.toString().trim()}|${el.id}|${window.location.hostname}`;

                    if (detectedFingerprints.has(fingerprint)) return;

                    const adData: AdData = {
                        type: 'ad_detected',
                        adType: classifyAdElement(el),
                        publisher: window.location.hostname,
                        network: identifyNetwork(el),
                        url: window.location.href,
                        domain: window.location.hostname,
                        timestamp: Date.now(),
                        filter: undefined,
                        targeting: undefined,
                        tracker: undefined,
                        metadata: {
                            selector: selector,
                            className: el.className.toString(),
                            id: el.id,
                            fingerprint: fingerprint,
                        }
                    };

                    detectedFingerprints.add(fingerprint);
                    detectedAds.push(adData);

                    // Cap array to avoid unbounded growth on long-lived SPAs
                    if (detectedAds.length > 200) {
                        detectedAds.splice(0, 100);
                    }
                });
            });

            // Send detected ads to background
            if (detectedAds.length > 0) {
                browser.runtime.sendMessage({
                    action: 'REPORT_ADS',
                    data: { ads: detectedAds }
                });
            }
        }

        function classifyAdElement(el: Element): string {
            const classes = el.className.toString().toLowerCase();
            const id = el.id.toLowerCase();

            if (classes.includes('video') || id.includes('video')) return 'Video Ad';
            if (classes.includes('banner') || id.includes('banner')) return 'Display Banner';
            if (classes.includes('native') || id.includes('native')) return 'Native Ad';
            if (classes.includes('sidebar') || id.includes('sidebar')) return 'Sidebar Ad';
            if (el.tagName === 'IFRAME') return 'iframe Ad';

            return 'Generic Ad';
        }

        function identifyNetwork(el: Element): string {
            const src = el.getAttribute('src') || '';
            const classes = el.className.toString();

            if (src.includes('googlesyndication') || classes.includes('google')) return 'Google Ads';
            if (src.includes('facebook') || src.includes('fbcdn')) return 'Facebook Ads';
            if (src.includes('doubleclick')) return 'Google DoubleClick';
            if (src.includes('amazon-adsystem')) return 'Amazon Ads';
            if (classes.includes('taboola')) return 'Taboola';
            if (classes.includes('outbrain')) return 'Outbrain';

            return 'Unknown Network';
        }

        function startTracking() {
            if (eventListenersActive) return;

            // Initial ad detection
            detectAdsInDOM();

            // Periodically scan for new ads
            intervalId = setInterval(detectAdsInDOM, 5000);

            // Observe DOM changes for dynamically loaded ads
            observer = new MutationObserver(() => {
                detectAdsInDOM();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            eventListenersActive = true;
            if (DEBUG) console.log('📊 Ad tracking started');
        }

        function stopTracking() {
            observer?.disconnect();
            observer = null;
            if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
            detectedAds.splice(0);
            detectedFingerprints.clear();
            eventListenersActive = false;
            if (DEBUG) console.log('🛑 Ad tracking stopped');
        }

        // Initial start if enabled
        if (isTrackingEnabled) {
            startTracking();
        }
    }
});

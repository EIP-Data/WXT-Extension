export interface AdTypePattern {
    pattern: RegExp;
    type: string;
    priority: number;
}

export const AD_TYPE_PATTERNS: AdTypePattern[] = [
    // Video ads (highest priority)
    { pattern: /\/vast|vpaid|video.*ad|preroll|midroll|ad.*pod/i, type: 'Video Ad', priority: 10 },
    // iframe ads
    { pattern: /\/iframe|\/frame|framead/i, type: 'iframe Ad', priority: 9 },
    // Retargeting
    { pattern: /retarget|remarketing|remarket|rlsa|rmkt/i, type: 'Retargeting', priority: 8 },
    // Tracking pixels
    { pattern: /\/pixel|\/beacon|\/impression|\/imp\?|\/track|tr\?id=/i, type: 'Tracking Pixel', priority: 7 },
    // Popup/interstitial
    { pattern: /popup|popunder|interstitial|overlay|onpopstate/i, type: 'Popup/Interstitial', priority: 6 },
    // Native ads
    { pattern: /native|content.*discovery|recommendation|sponsored/i, type: 'Native Ad', priority: 5 },
    // Display/banner ads
    { pattern: /banner|display|leaderboard|skyscraper|rectangle/i, type: 'Display Banner', priority: 4 },
    // Social media ads
    { pattern: /social|facebook|twitter|linkedin|instagram/i, type: 'Social Media Ad', priority: 3 },
    // Analytics
    { pattern: /analytics|stats|metrics|collect/i, type: 'Analytics', priority: 2 },
    // Generic fallback
    { pattern: /\/(ad|ads|adv|advert|advertise)\//i, type: 'Generic Ad', priority: 1 },
];

export function categorizeAdType(url: URL, requestType?: string, filter?: string): string {
    // Check request type from browser API first
    if (requestType === 'sub_frame' || requestType === 'object') {
        return 'iframe Ad';
    }

    const domain = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const query = url.search.toLowerCase();
    const combined = domain + path + query + (filter || '');

    // Sort by priority (highest first)
    const sortedPatterns = [...AD_TYPE_PATTERNS].sort((a, b) => b.priority - a.priority);

    for (const { pattern, type } of sortedPatterns) {
        if (pattern.test(combined)) {
            return type;
        }
    }

    return 'Generic Ad';
}

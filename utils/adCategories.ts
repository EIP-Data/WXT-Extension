export interface AdTypePattern {
    pattern: RegExp;
    type: string;
    priority: number; // Higher priority = checked first
}

export const AD_TYPE_PATTERNS: AdTypePattern[] = [
    // Video ads (highest priority)
    { pattern: /video|vast|vpaid|preroll|midroll/i, type: 'Video Ad', priority: 10 },

    // Retargeting
    { pattern: /retarget|remarketing|remarket/i, type: 'Retargeting', priority: 9 },

    // Tracking pixels
    { pattern: /tracking|pixel|beacon|impression/i, type: 'Tracking Pixel', priority: 8 },

    // Social media ads
    { pattern: /social|facebook|twitter|linkedin|instagram/i, type: 'Social Media Ad', priority: 7 },

    // Native ads
    { pattern: /native|content-recommendation/i, type: 'Native Ad', priority: 6 },

    // Display/banner ads
    { pattern: /display|banner|image/i, type: 'Display Ad', priority: 5 },

    // Popup/interstitial
    { pattern: /popup|popunder|interstitial|overlay/i, type: 'Popup/Interstitial', priority: 4 },

    // Search ads
    { pattern: /search|ppc|cpc/i, type: 'Search Ad', priority: 3 },

    // Analytics
    { pattern: /analytics|stats|metrics/i, type: 'Analytics Tracker', priority: 2 },

    // Generic fallback
    { pattern: /ad|advertisement|promo/i, type: 'Generic Ad', priority: 1 },
];

export function categorizeAdType(url: URL): string {
    const fullPath = url.pathname + url.search + url.hash;

    // Sort by priority (highest first)
    const sortedPatterns = [...AD_TYPE_PATTERNS].sort((a, b) => b.priority - a.priority);

    for (const { pattern, type } of sortedPatterns) {
        if (pattern.test(fullPath)) {
            return type;
        }
    }

    return 'Unknown Ad';
}

import type { TrackerData, TargetingData } from '@/types/types';

const TRACKER_PATTERNS = {
    analytics: [
        { pattern: /google-analytics|googletagmanager|ga\.js|gtm\.js/i, vendor: 'Google Analytics' },
        { pattern: /matomo|piwik/i, vendor: 'Matomo' },
        { pattern: /adobe.*analytics|omniture/i, vendor: 'Adobe Analytics' },
        { pattern: /hotjar/i, vendor: 'Hotjar' },
        { pattern: /mixpanel/i, vendor: 'Mixpanel' },
        { pattern: /segment\.(com|io)/i, vendor: 'Segment' },
        { pattern: /amplitude/i, vendor: 'Amplitude' },
    ],
    fingerprinting: [
        { pattern: /fingerprint|canvas|webgl|audioctx|clientjs/i, vendor: 'Generic Fingerprinting' },
        { pattern: /fingerprintjs/i, vendor: 'FingerprintJS' },
        { pattern: /maxmind/i, vendor: 'MaxMind' },
    ],
    behavioral: [
        { pattern: /track|collect|event|behavior|activity/i, vendor: 'Generic Behavioral' },
        { pattern: /heap.*analytics/i, vendor: 'Heap Analytics' },
        { pattern: /fullstory/i, vendor: 'FullStory' },
    ],
    social: [
        { pattern: /connect\.facebook|fbcdn/i, vendor: 'Facebook Pixel' },
        { pattern: /twitter\.com\/i|analytics\.twitter/i, vendor: 'Twitter Analytics' },
        { pattern: /linkedin.*insight/i, vendor: 'LinkedIn Insight' },
        { pattern: /pinterest.*analytics/i, vendor: 'Pinterest Tag' },
    ],
    advertising: [
        { pattern: /doubleclick|googlesyndication/i, vendor: 'Google Ads' },
        { pattern: /facebook.*ads/i, vendor: 'Facebook Ads' },
        { pattern: /criteo/i, vendor: 'Criteo' },
        { pattern: /outbrain|taboola/i, vendor: 'Content Discovery' },
    ],
};

export function analyzeTracker(url: string): TrackerData {
    const urlLower = url.toLowerCase();

    // Check each category
    for (const [category, patterns] of Object.entries(TRACKER_PATTERNS)) {
        for (const { pattern, vendor } of patterns) {
            if (pattern.test(urlLower)) {
                return {
                    category: category as TrackerData['category'],
                    purpose: getCategoryPurpose(category),
                    privacyRisk: getCategoryRisk(category),
                    crossSite: true,
                    vendor,
                };
            }
        }
    }

    // Default fallback
    return {
        category: 'functional',
        purpose: 'Unknown tracking purpose',
        privacyRisk: 'low',
        crossSite: false,
    };
}

function getCategoryPurpose(category: string): string {
    const purposes: Record<string, string> = {
        analytics: 'Website analytics and user behavior tracking',
        fingerprinting: 'Browser and device fingerprinting',
        behavioral: 'Behavioral tracking and profiling',
        social: 'Social media integration and tracking',
        advertising: 'Advertising and remarketing',
        functional: 'Functional website features',
    };
    return purposes[category] || 'Unknown';
}

function getCategoryRisk(category: string): 'low' | 'medium' | 'high' {
    const risks: Record<string, 'low' | 'medium' | 'high'> = {
        analytics: 'medium',
        fingerprinting: 'high',
        behavioral: 'high',
        social: 'medium',
        advertising: 'medium',
        functional: 'low',
    };
    return risks[category] || 'low';
}

export function extractTargetingParams(url: URL): TargetingData | undefined {
    const params = url.searchParams;
    const targeting: TargetingData = {};
    let hasData = false;

    // Demographics
    const age = params.get('age') || params.get('age_range') || params.get('age_group');
    const gender = params.get('gender') || params.get('sex');

    if (age || gender) {
        targeting.demographics = [];
        if (age) {
            targeting.demographics.push(`Age: ${age}`);
            hasData = true;
        }
        if (gender) {
            targeting.demographics.push(`Gender: ${gender}`);
            hasData = true;
        }
    }

    // Interests/Topics
    const interests = params.get('interests') || params.get('topics') || params.get('categories');
    if (interests) {
        targeting.interests = interests.split(',').map(i => i.trim()).filter(Boolean);
        hasData = true;
    }

    // Retargeting IDs
    const retargetId = params.get('rlsa') || params.get('retarget_id') ||
        params.get('audience_id') || params.get('rmkt');
    if (retargetId) {
        targeting.retargetingId = retargetId;
        hasData = true;
    }

    // Audience segments
    const segments = params.get('segments') || params.get('audience') || params.get('segment_id');
    if (segments) {
        targeting.audienceSegments = segments.split(',').map(s => s.trim()).filter(Boolean);
        hasData = true;
    }

    // Geolocation
    const geo = params.get('geo') || params.get('location') ||
        params.get('country') || params.get('region');
    if (geo) {
        targeting.geolocation = geo;
        hasData = true;
    }

    // Custom parameters (any param starting with 'tg_', 'target_', 'custom_')
    const customParams: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
        if (/^(tg_|target_|custom_|user_)/i.test(key)) {
            customParams[key] = value;
            hasData = true;
        }
    }
    if (Object.keys(customParams).length > 0) {
        targeting.customParams = customParams;
    }

    return hasData ? targeting : undefined;
}

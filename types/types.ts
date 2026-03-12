export type UserPreferences = {
    cookie: boolean;
    language: string;
    data_expiration: number;
}

export interface TargetingData {
    demographics?: string[];
    interests?: string[];
    retargetingId?: string;
    audienceSegments?: string[];
    geolocation?: string;
    customParams?: Record<string, string>;
}

export interface TrackerData {
    category: 'analytics' | 'advertising' | 'social' | 'behavioral' | 'fingerprinting' | 'functional';
    purpose: string;
    privacyRisk: 'low' | 'medium' | 'high';
    crossSite: boolean;
    vendor?: string;
}

export interface PageContext {
    pageCategory?: string;    // inferred from hostname lookup table
    pageTitle?: string;       // document.title
    contentLanguage?: string; // html[lang] attribute
    isSearchPage?: boolean;   // URL contains a recognised search param
    isSocialFeed?: boolean;   // known social feed domain
}

export interface AdData {
    type: 'ad_detected';
    adType: string;
    publisher: string;
    network: string;
    url: string;
    domain: string;
    timestamp: number;
    filter?: string;
    targeting?: TargetingData;
    tracker?: TrackerData;
    pageContext?: PageContext;
    metadata?: {
        // Network-detection fields (background.ts / webRequest)
        method?: string;
        type?: string;
        initiator?: string;
        requestType?: string;
        // DOM-detection fields (content.ts)
        selector?: string;
        className?: string;
        id?: string;
        fingerprint?: string;
    };
}

export interface BatchPayload {
    batchId: string;
    sessionId: string;
    sessionStartTime: number;
    sessionDuration: number;  // ms since session start, computed at flush time
    timestamp: number;
    userAgent: string;
    extensionVersion: string;
    data: AdData[];
}

export interface QueueItem {
    id: string;
    payload: BatchPayload;
    attempts: number;
    lastAttempt?: number;
    createdAt: number;
}

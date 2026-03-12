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

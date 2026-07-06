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
    parentCompany?: string;
}

export interface PageContext {
    pageCategory?: string;    // inferred from hostname lookup table
    pageTitle?: string;       // document.title
    contentLanguage?: string; // html[lang] attribute
    isSearchPage?: boolean;   // URL contains a recognised search param
    isSocialFeed?: boolean;   // known social feed domain
}

export interface AdData {
    id?: string;
    domain: string;
    url: string;
    network: string;
    adType: 'banner' | 'tracking' | 'video' | 'popup' | 'unknown' | string;
    type?: string;
    publisher?: string;
    filter?: string;
    targeting?: TargetingData;
    tracker?: TrackerData;
    metadata?: Record<string, any>;
    pageContext?: PageContext;
    timestamp: number;
    category?: string;
    purpose?: string;
    privacyRisk?: 'low' | 'medium' | 'high';
    iabVendorId?: number;
    iabPurposes?: string[];
    isIabRegistered?: boolean;
    googleAtpId?: number;
    isGoogleAtp?: boolean;
    whoTracksMeEntity?: string;
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

export type ExtensionMessageAction =
    | 'AD_DETECTED'
    | 'REPORT_ADS'
    | 'GET_ADS_ANALYTICS'
    | 'TOGGLE_TRACKING'
    | 'GET_TRACKING_STATE'
    | 'CLEAR_ADS_ANALYTICS'
    | 'FORCE_SYNC'
    | 'GET_QUEUE_STATS'
    | 'SEND_BATCH_TO_BACKEND'
    | 'UPDATE_EASYLIST'
    | 'AD_STORED_UPDATE'
    | 'TOGGLE_OVERLAY'
    | 'API_PROXY_REQUEST'
    | 'DEBUG_DUMP_QUEUE';

import { storage } from '#imports';

// Ghostery WhoTracksMe entities data
const WTM_URL = 'https://raw.githubusercontent.com/whotracksme/whotracks.me/master/whotracksme/data/assets/trackers-preview.json';
const CACHE_KEY = 'local:whotracksme';
const CACHE_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export class WhoTracksMeService {
    private domainToParent = new Map<string, string>();
    private domainToCategories = new Map<string, string[]>();
    private categoriesList: string[] = [];
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        let cached: any = null;
        try {
            cached = await storage.getItem(CACHE_KEY);
        } catch (e) {
            console.error('Failed to read whotracksme cache', e);
        }

        if (!cached || Date.now() - cached.timestamp > CACHE_DURATION_MS) {
            try {
                const res = await fetch(WTM_URL);
                if (res.ok) {
                    const data = await res.json();
                    cached = { timestamp: Date.now(), data };
                    await storage.setItem(CACHE_KEY, cached);
                }
            } catch (e) {
                console.error("Failed to fetch WhoTracksMe entities list, using defaults", e);
            }
        }

        const data = (cached && cached.data) ? cached.data : null;
        this.buildIndex(data);

        // Always build fallback entities to avoid breaking existing code
        const fallbackData = this.getFallbackData();
        for (const [entityName, details] of Object.entries(fallbackData)) {
            for (const domain of details.domains) {
                this.domainToParent.set(domain.toLowerCase(), entityName);
            }
        }

        this.isInitialized = true;
    }

    private buildIndex(data: any) {
        if (!data || !data.categories || !data.trackers) return;

        this.categoriesList = data.categories;

        for (const [domain, counts] of Object.entries(data.trackers)) {
            const castCounts = counts as number[];
            const activeCategories: string[] = [];
            castCounts.forEach((count, idx) => {
                if (count > 0 && this.categoriesList[idx]) {
                    activeCategories.push(this.categoriesList[idx]);
                }
            });
            if (activeCategories.length > 0) {
                this.domainToCategories.set(domain.toLowerCase(), activeCategories);
            }
        }
    }

    private getFallbackData() {
        return {
            "Google LLC": { domains: ["doubleclick.net", "googlesyndication.com", "google-analytics.com", "googletagmanager.com", "google.com"] },
            "Meta Platforms, Inc.": { domains: ["facebook.com", "facebook.net", "fbcdn.net", "instagram.com"] },
            "Amazon.com": { domains: ["amazon-adsystem.com", "amazon.com"] },
            "Microsoft Corporation": { domains: ["bing.com", "linkedin.com", "licdn.com"] },
            "X Corp.": { domains: ["twitter.com", "t.co", "twimg.com"] },
            "Adobe": { domains: ["demdex.net", "omtrdc.net", "everesttech.net"] },
            "Criteo": { domains: ["criteo.com", "criteo.net"] }
        };
    }

    public getParentEntity(domain: string): string | null {
        if (!domain) return null;
        let lookupDomain = domain.toLowerCase();
        if (lookupDomain.startsWith('www.')) lookupDomain = lookupDomain.slice(4);

        let parent = this.domainToParent.get(lookupDomain);
        if (!parent) {
            const parts = lookupDomain.split('.');
            if (parts.length > 2) {
                const baseDomain = parts.slice(-2).join('.');
                parent = this.domainToParent.get(baseDomain);
                // Try 3 parts for domains like co.uk
                if (!parent && parts.length > 3) {
                    const baseDomain3 = parts.slice(-3).join('.');
                    parent = this.domainToParent.get(baseDomain3);
                }
            }
        }

        return parent || null;
    }

    public getTrackerCategories(domain: string): string[] {
        if (!domain) return [];
        let lookupDomain = domain.toLowerCase();
        if (lookupDomain.startsWith('www.')) lookupDomain = lookupDomain.slice(4);

        let categories = this.domainToCategories.get(lookupDomain);
        if (!categories) {
            const parts = lookupDomain.split('.');
            if (parts.length > 2) {
                const baseDomain = parts.slice(-2).join('.');
                categories = this.domainToCategories.get(baseDomain);
                if (!categories && parts.length > 3) {
                    const baseDomain3 = parts.slice(-3).join('.');
                    categories = this.domainToCategories.get(baseDomain3);
                }
            }
        }

        return categories || [];
    }
}

export const whoTracksMeService = new WhoTracksMeService();


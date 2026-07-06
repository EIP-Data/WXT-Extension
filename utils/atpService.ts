import { storage } from '#imports';

// Google provides a list of ATPs. Since the canonical URL can sometimes be restricted,
// we'll attempt to fetch it and maintain a small fallback for the biggest providers.
const ATP_URL = 'https://storage.googleapis.com/tcfac/v1/providers.json';
const CACHE_KEY = 'local:google-atp';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AtpService {
    private domainToProvider = new Map<string, number>();
    private providerNames = new Map<number, string>();
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        let cached: any = null;
        try {
            cached = await storage.getItem(CACHE_KEY);
        } catch (e) {
            console.error('Failed to read atp cache', e);
        }

        if (!cached || Date.now() - cached.timestamp > CACHE_DURATION_MS) {
            try {
                const res = await fetch(ATP_URL);
                if (res.ok) {
                    const data = await res.json();
                    cached = { timestamp: Date.now(), data };
                    await storage.setItem(CACHE_KEY, cached);
                }
            } catch (e) {
                console.error("Failed to fetch Google ATP list, using defaults", e);
            }
        }

        const data = (cached && cached.data) ? cached.data : this.getFallbackData();
        this.buildIndex(data);
        this.isInitialized = true;
    }

    private buildIndex(data: any) {
        if (data && data.providers) {
            for (const provider of data.providers) {
                if (!provider.id) continue;
                this.providerNames.set(provider.id, provider.name);

                if (provider.domains) {
                    for (const domain of provider.domains) {
                        this.domainToProvider.set(domain.toLowerCase(), provider.id);
                    }
                }
            }
        }
    }

    private getFallbackData() {
        return {
            providers: [
                { id: 1, name: "Google", domains: ["google.com", "doubleclick.net", "googlesyndication.com"] },
                { id: 2, name: "Amazon", domains: ["amazon.com", "amazon-adsystem.com"] },
                { id: 3, name: "Meta", domains: ["facebook.com", "instagram.com"] }
            ]
        };
    }

    public getProviderMetadata(domain: string) {
        if (!domain) return null;
        let lookupDomain = domain.toLowerCase();
        if (lookupDomain.startsWith('www.')) lookupDomain = lookupDomain.slice(4);

        let providerId = this.domainToProvider.get(lookupDomain);
        if (!providerId) {
            const parts = lookupDomain.split('.');
            if (parts.length > 2) {
                const baseDomain = parts.slice(-2).join('.');
                providerId = this.domainToProvider.get(baseDomain);
            }
        }

        if (providerId) {
            return {
                googleAtpId: providerId,
                name: this.providerNames.get(providerId),
                isGoogleAtp: true
            };
        }
        return null;
    }
}

export const atpService = new AtpService();


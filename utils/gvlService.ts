import { storage } from '#imports';

const GVL_URL = 'https://vendor-list.consensu.org/v2/vendor-list.json';
const CACHE_KEY = 'local:iab-gvl';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class GvlService {
    private domainToVendor = new Map<string, number>();
    private vendorIdToPurposes = new Map<number, string[]>();
    private purposeIdToName = new Map<number, string>();
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        // Ensure storage works across contexts (background vs UI)
        let cached: any = null;
        try {
            cached = await storage.getItem(CACHE_KEY);
        } catch (e) {
            console.error('Failed to read gvl cache', e);
        }

        if (!cached || Date.now() - cached.timestamp > CACHE_DURATION_MS) {
            try {
                // Must be native fetch
                const res = await fetch(GVL_URL);
                if (res.ok) {
                    const data = await res.json();
                    cached = { timestamp: Date.now(), data };
                    await storage.setItem(CACHE_KEY, cached);
                }
            } catch (e) {
                console.error("Failed to fetch IAB GVL", e);
                // If it fails, fallback to expired cache if it exists
            }
        }

        if (cached && cached.data) {
            this.buildIndex(cached.data);
        }
        this.isInitialized = true;
    }

    private buildIndex(gvl: any) {
        if (gvl.purposes) {
            for (const [id, purpose] of Object.entries(gvl.purposes as Record<string, any>)) {
                this.purposeIdToName.set(Number(id), purpose.name);
            }
        }

        if (gvl.vendors) {
            for (const [idStr, vendor] of Object.entries(gvl.vendors as Record<string, any>)) {
                const id = Number(idStr);
                const pIds = vendor.purposes || [];
                const purposeNames = pIds.map((pId: number) => this.purposeIdToName.get(pId) || `Purpose ${pId}`);
                this.vendorIdToPurposes.set(id, purposeNames);

                const urls = [];
                if (vendor.urls) {
                    for (const u of vendor.urls) {
                        if (u.privacy) urls.push(u.privacy);
                        if (u.legIntClaim) urls.push(u.legIntClaim);
                    }
                }
                if (vendor.deviceStorageDisclosureUrl) {
                    urls.push(vendor.deviceStorageDisclosureUrl);
                }

                for (const urlStr of urls) {
                    try {
                        const url = new URL(urlStr);
                        let domain = url.hostname.toLowerCase();
                        if (domain.startsWith('www.')) domain = domain.slice(4);

                        // We map exactly
                        this.domainToVendor.set(domain, id);

                        const parts = domain.split('.');
                        if (parts.length > 2) {
                            const baseDomain = parts.slice(-2).join('.');
                            if (!this.domainToVendor.has(baseDomain)) {
                                this.domainToVendor.set(baseDomain, id);
                            }
                        }
                    } catch(e) { }
                }
            }
        }
    }

    public getVendorMetadata(domain: string) {
        if (!domain) return null;
        let lookupDomain = domain.toLowerCase();
        if (lookupDomain.startsWith('www.')) lookupDomain = lookupDomain.slice(4);

        let vendorId = this.domainToVendor.get(lookupDomain);
        if (!vendorId) {
            const parts = lookupDomain.split('.');
            if (parts.length > 2) {
                const baseDomain = parts.slice(-2).join('.');
                vendorId = this.domainToVendor.get(baseDomain);
            }
        }

        if (vendorId) {
            return {
                iabVendorId: vendorId,
                iabPurposes: this.vendorIdToPurposes.get(vendorId) || [],
                isIabRegistered: true
            };
        }
        return null;
    }
}

export const gvlService = new GvlService();

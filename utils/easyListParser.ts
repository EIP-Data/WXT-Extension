import { FiltersEngine, Request } from '@cliqz/adblocker';

export class EasyListManager {
    private engine: FiltersEngine | null = null;
    private lastUpdate: number = 0;
    private readonly UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    private readonly FILTER_LISTS = [
        'https://easylist.to/easylist/easylist.txt',
        'https://easylist.to/easylist/easyprivacy.txt',
    ];

    async initialize() {
        console.log('Initializing EasyList engine...');

        try {
            // Try to load from IndexedDB using WXT storage
            const stored = await this.getStoredEngine();

            if (stored && stored.engine && stored.timestamp) {
                const age = Date.now() - stored.timestamp;

                if (age < this.UPDATE_INTERVAL) {
                    // Use cached version
                    this.engine = FiltersEngine.deserialize(new Uint8Array(stored.engine));
                    this.lastUpdate = stored.timestamp;
                    console.log('Loaded EasyList from cache');
                    return;
                }
            }
        } catch (e) {
            console.log('No cached EasyList found, downloading...');
        }

        // Download fresh lists
        await this.updateFilters();
    }

    async updateFilters() {
        console.log('Downloading EasyList filters...');

        try {
            const responses = await Promise.all(
                this.FILTER_LISTS.map(url =>
                    fetch(url)
                        .then(r => r.text())
                        .catch(err => {
                            console.error(`Failed to fetch ${url}:`, err);
                            return '';
                        })
                )
            );

            const combinedFilters = responses.filter(r => r).join('\n');

            if (!combinedFilters) {
                throw new Error('No filters downloaded');
            }

            // Parse filters
            this.engine = FiltersEngine.parse(combinedFilters);
            this.lastUpdate = Date.now();

            // Serialize to Uint8Array (binary format)
            const serialized = this.engine.serialize();

            // Convert Uint8Array to regular array for storage
            const arrayData = Array.from(serialized);

            // Store using IndexedDB via a custom storage method
            await this.storeEngine(arrayData, this.lastUpdate);

            console.log('EasyList filters updated successfully');
        } catch (error) {
            console.error('Failed to update EasyList:', error);
            throw error;
        }
    }

    // Custom storage using IndexedDB directly
    private async storeEngine(engineData: number[], timestamp: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EasyListDB', 1);

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('filters')) {
                    db.createObjectStore('filters');
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['filters'], 'readwrite');
                const store = transaction.objectStore('filters');

                const data = {
                    engine: engineData,
                    timestamp: timestamp
                };

                const putRequest = store.put(data, 'easylist');

                putRequest.onsuccess = () => {
                    db.close();
                    resolve();
                };

                putRequest.onerror = () => {
                    db.close();
                    reject(putRequest.error);
                };
            };
        });
    }

    private async getStoredEngine(): Promise<{ engine: number[], timestamp: number } | null> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EasyListDB', 1);

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('filters')) {
                    db.createObjectStore('filters');
                }
            };

            request.onsuccess = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains('filters')) {
                    db.close();
                    resolve(null);
                    return;
                }

                const transaction = db.transaction(['filters'], 'readonly');
                const store = transaction.objectStore('filters');
                const getRequest = store.get('easylist');

                getRequest.onsuccess = () => {
                    db.close();
                    resolve(getRequest.result || null);
                };

                getRequest.onerror = () => {
                    db.close();
                    reject(getRequest.error);
                };
            };
        });
    }

    isAdRequest(url: string, sourceUrl: string, type: string = 'other'): boolean {
        if (!this.engine) return false;

        try {
            const request = Request.fromRawDetails({
                url,
                sourceUrl,
                type: this.mapResourceType(type)
            });

            return this.engine.match(request).match;
        } catch (e) {
            return false;
        }
    }

    getMatchingFilter(url: string, sourceUrl: string): string | null {
        if (!this.engine) return null;

        try {
            const request = Request.fromRawDetails({
                url,
                sourceUrl,
                type: 'other'
            });

            const result = this.engine.match(request);
            return result.filter ? result.filter.rawLine : null;
        } catch (e) {
            return null;
        }
    }

    private mapResourceType(type: string): string {
        const typeMap: Record<string, string> = {
            main_frame: 'document',
            sub_frame: 'subdocument',
            stylesheet: 'stylesheet',
            script: 'script',
            image: 'image',
            font: 'font',
            object: 'object',
            xmlhttprequest: 'xhr',
            ping: 'ping',
            media: 'media',
            websocket: 'websocket',
            other: 'other'
        };

        return typeMap[type] || 'other';
    }

    extractAdNetwork(filter: string): string {
        const networks: Record<string, RegExp> = {
            'Google Ads': /googlesyndication|doubleclick|googleadservices/i,
            'Facebook Ads': /facebook\.net|fbcdn\.net/i,
            'Amazon Ads': /amazon-adsystem/i,
            'Twitter Ads': /ads-twitter/i,
            'LinkedIn Ads': /linkedin.*ads/i,
            'Taboola': /taboola/i,
            'Outbrain': /outbrain/i,
            'Criteo': /criteo/i,
            'AppNexus': /adnxs/i,
            'The Trade Desk': /adsrvr/i,
            'Rubicon': /rubiconproject/i,
            'PubMatic': /pubmatic/i,
            'OpenX': /openx/i,
            'Microsoft Ads': /ads\.microsoft|bat\.bing/i,
        };

        for (const [network, pattern] of Object.entries(networks)) {
            if (pattern.test(filter)) {
                return network;
            }
        }

        return 'Unknown Ad Network';
    }

    categorizeAdFromFilter(filter: string, url: string): string {
        const urlLower = url.toLowerCase();
        const filterLower = filter.toLowerCase();

        if (filterLower.includes('video') || urlLower.includes('video') || urlLower.includes('vast')) return 'Video Ad';
        if (filterLower.includes('popup') || filterLower.includes('pop')) return 'Popup Ad';
        if (filterLower.includes('banner')) return 'Banner Ad';
        if (filterLower.includes('tracking') || filterLower.includes('pixel') || filterLower.includes('beacon')) return 'Tracking Pixel';
        if (filterLower.includes('analytics')) return 'Analytics';
        if (filterLower.includes('social')) return 'Social Media Ad';
        if (filterLower.includes('native')) return 'Native Ad';

        return 'Display Ad';
    }
}

export const easyListManager = new EasyListManager();

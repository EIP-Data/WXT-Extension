import type { AdData, BatchPayload, QueueItem } from '@/types/types';

const DEBUG = import.meta.env.DEV ?? false;

class BatchQueueManager {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'DatalyzBatchQueue';
    private readonly DB_VERSION = 1;
    private readonly STORE_NAME = 'queue';
    private readonly BATCH_SIZE = 50;
    private readonly BATCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private readonly MAX_RETRIES = 5;
    private readonly BATCH_AGE_THRESHOLD = 10 * 60 * 1000;  // 10 minutes
    private readonly SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    private currentBatch: AdData[] = [];
    private sessionId: string;
    private sessionStartTime: number;
    private lastActivityTime: number;
    private syncTimer: number | null = null;
    private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        this.lastActivityTime = Date.now();
        this.initDB();
        this.setupNetworkListeners();
        this.startSyncTimer();
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    store.createIndex('attempts', 'attempts', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                if (DEBUG) console.log('BatchQueue DB initialized');
                resolve();
                // Try to sync existing queue items on startup
                this.processQueue();
            };
        });
    }

    private setupNetworkListeners(): void {
        // Use self for service worker context, globalThis as fallback
        const context = typeof self !== 'undefined' ? self : globalThis as any;

        // Only setup listeners if addEventListener is available
        if (typeof context.addEventListener === 'function') {
            context.addEventListener('online', () => {
                if (DEBUG) console.log('Network online - processing queue');
                this.isOnline = true;
                this.processQueue();
            });

            context.addEventListener('offline', () => {
                if (DEBUG) console.log('Network offline - queuing data');
                this.isOnline = false;
            });
        } else {
            console.warn('Network event listeners not available in this context');
        }
    }

    private startSyncTimer(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        // Use setInterval directly (works in both contexts)
        this.syncTimer = setInterval(() => {
            this.flushBatch();
        }, this.BATCH_INTERVAL) as unknown as number;
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateBatchId(): string {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async addData(adData: AdData): Promise<void> {
        const now = Date.now();

        // Session boundary: idle for longer than SESSION_IDLE_TIMEOUT → new session
        if (now - this.lastActivityTime > this.SESSION_IDLE_TIMEOUT) {
            if (DEBUG) console.log('Session idle timeout — starting new session');
            // Flush the current batch under the old session before rotating
            if (this.currentBatch.length > 0) {
                await this.flushBatch();
            }
            this.sessionId = this.generateSessionId();
            this.sessionStartTime = now;
        }
        this.lastActivityTime = now;

        // Deduplicate within current batch
        const fingerprint = `${adData.network}-${adData.domain}-${adData.adType}`;
        const isDuplicate = this.currentBatch.some(
            item => `${item.network}-${item.domain}-${item.adType}` === fingerprint &&
                Math.abs(item.timestamp - adData.timestamp) < 5000
        );

        if (isDuplicate) {
            if (DEBUG) console.log('Duplicate ad detected, skipping:', fingerprint);
            return;
        }

        this.currentBatch.push(adData);
        if (DEBUG) console.log(`Added to batch (${this.currentBatch.length}/${this.BATCH_SIZE})`);

        // Auto-flush if batch size reached
        if (this.currentBatch.length >= this.BATCH_SIZE) {
            await this.flushBatch();
        }
    }

    async flushBatch(): Promise<void> {
        if (this.currentBatch.length === 0) {
            if (DEBUG) console.log('No data to flush');
            return;
        }

        // Get manifest in service worker compatible way
        const manifest = typeof browser !== 'undefined' && browser.runtime
            ? browser.runtime.getManifest()
            : { version: '1.0.0' };

        const userAgent = typeof navigator !== 'undefined'
            ? navigator.userAgent
            : 'Unknown';

        const payload: BatchPayload = {
            batchId: this.generateBatchId(),
            sessionId: this.sessionId,
            sessionStartTime: this.sessionStartTime,
            sessionDuration: Date.now() - this.sessionStartTime,
            timestamp: Date.now(),
            userAgent,
            extensionVersion: manifest.version,
            data: [...this.currentBatch]
        };

        if (DEBUG) console.log(`Flushing batch: ${payload.data.length} items`);

        // Clear current batch
        this.currentBatch = [];

        // Add to persistent queue
        await this.enqueue(payload);

        // Try to process immediately if online
        if (this.isOnline) {
            await this.processQueue();
        }
    }

    private async enqueue(payload: BatchPayload): Promise<void> {
        if (!this.db) {
            console.error('DB not initialized');
            return;
        }

        const queueItem: QueueItem = {
            id: payload.batchId,
            payload,
            attempts: 0,
            createdAt: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.add(queueItem);

            request.onsuccess = () => {
                if (DEBUG) console.log('Batch queued:', queueItem.id);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async processQueue(): Promise<void> {
        if (!this.isOnline || !this.db) {
            if (DEBUG) console.log('Cannot process queue: offline or DB not ready');
            return;
        }

        const items = await this.getQueueItems();
        if (DEBUG) console.log(`Processing ${items.length} queued batches`);

        for (const item of items) {
            try {
                await this.sendBatch(item);
                await this.removeFromQueue(item.id);
                if (DEBUG) console.log(`Successfully sent batch: ${item.id}`);
            } catch (error) {
                console.error(`Failed to send batch ${item.id}:`, error);
                await this.handleFailedBatch(item);
            }
        }
    }

    private async getQueueItems(): Promise<QueueItem[]> {
        if (!this.db) return [];

        // Fetch all items from IndexedDB and sort oldest-first
        const allItems = await new Promise<QueueItem[]>((resolve, reject) => {
            const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result.sort((a: QueueItem, b: QueueItem) => a.createdAt - b.createdAt));
            };
            request.onerror = () => reject(request.error);
        });

        // Split into active items and dead-letter items
        const now = Date.now();
        const expired: QueueItem[] = [];
        const active: QueueItem[] = [];

        for (const item of allItems) {
            if (item.attempts >= 1 && now - item.createdAt > this.BATCH_AGE_THRESHOLD) {
                expired.push(item);
            } else {
                active.push(item);
            }
        }

        // Evict dead-letter items from IndexedDB
        if (expired.length > 0) {
            if (DEBUG) console.log(`Dead-letter: evicting ${expired.length} stale batch(es) from queue`);
            for (const item of expired) {
                console.error(`Evicting dead-letter batch ${item.id} (age: ${now - item.createdAt}ms, attempts: ${item.attempts})`);
                await this.removeFromQueue(item.id);
            }
        }

        return active;
    }

    private async sendBatch(item: QueueItem): Promise<void> {
        const response = await browser.runtime.sendMessage({
            action: 'SEND_BATCH_TO_BACKEND',
            data: item.payload
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to send batch');
        }
    }

    private async handleFailedBatch(item: QueueItem): Promise<void> {
        item.attempts++;
        item.lastAttempt = Date.now();

        if (item.attempts >= this.MAX_RETRIES) {
            console.error(`Batch ${item.id} exceeded max retries, removing`);
            await this.removeFromQueue(item.id);
            return;
        }

        // Update in queue with new attempt count
        await this.updateQueueItem(item);

        // Calculate exponential backoff delay
        const delayMs = Math.min(1000 * Math.pow(2, item.attempts), 60000); // Max 1 minute
        if (DEBUG) console.log(`Will retry batch ${item.id} after ${delayMs}ms (attempt ${item.attempts}/${this.MAX_RETRIES})`);

        // Schedule retry
        setTimeout(() => {
            this.processQueue();
        }, delayMs);
    }

    private async updateQueueItem(item: QueueItem): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async removeFromQueue(id: string): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getQueueStats(): Promise<{ pending: number; oldestBatch?: number }> {
        const items = await this.getQueueItems();
        return {
            pending: items.length,
            oldestBatch: items.length > 0 ? items[0].createdAt : undefined
        };
    }

    async clearQueue(): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                this.currentBatch = [];
                if (DEBUG) console.log('Queue cleared');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    destroy(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        if (this.db) {
            this.db.close();
        }
    }
}

export const batchQueue = new BatchQueueManager();

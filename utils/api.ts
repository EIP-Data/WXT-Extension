import axios, { type AxiosRequestConfig } from 'axios';
import { storage } from '#imports';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

// Helper: Check if we are in a Content Script (Overlay)
const isContentScript = () => {
    // Check if we're NOT in a service worker/background context
    if (typeof self !== 'undefined' && self.constructor.name === 'ServiceWorkerGlobalScope') {
        return false; // We're in a service worker
    }

    // Check if we're in a regular web page (content script)
    return typeof window !== 'undefined' &&
        !window.location.protocol.startsWith('chrome-extension') &&
        !window.location.protocol.startsWith('moz-extension');
};

// Internal function to get the token (replaces your old interceptor)
async function getAuthToken(): Promise<string | null> {
    return await storage.getItem<string>('local:authToken');
}

// The new API handler
const apiHandler = {
    async request(config: AxiosRequestConfig) {
        const token = await getAuthToken();

        // Prepare headers with Auth token
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...config.headers,
        };

        // 1. BACKGROUND MODE: Use standard Axios
        if (!isContentScript()) {
            const client = axios.create({
                baseURL: API_ENDPOINT,
                timeout: 10000,
            });
            return client.request({ ...config, headers });
        }

        // 2. OVERLAY MODE: Proxy through Background
        try {
            // We must strip undefined values before sending messages
            const cleanConfig = JSON.parse(JSON.stringify({ ...config, headers }));

            const response = await browser.runtime.sendMessage({
                action: 'API_PROXY_REQUEST',
                data: {
                    ...cleanConfig,
                    baseURL: API_ENDPOINT
                }
            });

            if (!response.success) {
                // Mimic an Axios error structure so your app catches it correctly
                throw {
                    response: {
                        data: response.data,
                        status: response.status || 500,
                    },
                    message: response.error || 'Proxy Error'
                };
            }

            return { data: response.data.data, status: response.status };
        } catch (error) {
            console.error('API Proxy Error:', error);
            throw error;
        }
    },

    // Mimic Axios methods so you don't have to change your components
    get(url: string, config?: AxiosRequestConfig) {
        return this.request({ ...config, method: 'GET', url });
    },
    post(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.request({ ...config, method: 'POST', url, data });
    },
    put(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.request({ ...config, method: 'PUT', url, data });
    },
    delete(url: string, config?: AxiosRequestConfig) {
        return this.request({ ...config, method: 'DELETE', url });
    }
};

export default apiHandler;

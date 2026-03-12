/**
 * Shared utility: map a request URL to its ad network by hostname.
 * Single source of truth — previously duplicated in background.ts and easyListParser.ts.
 */
export function detectNetworkFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();

        if (domain.includes('doubleclick')) return 'Google DoubleClick';
        if (domain.includes('googlesyndication')) return 'Google Ads';
        if (domain.includes('googleadservices')) return 'Google Ads';
        if (domain.includes('facebook')) return 'Facebook Ads';
        if (domain.includes('amazon-adsystem')) return 'Amazon Ads';
        if (domain.includes('taboola')) return 'Taboola';
        if (domain.includes('outbrain')) return 'Outbrain';
        if (domain.includes('criteo')) return 'Criteo';
        if (domain.includes('adnxs') || domain.includes('appnexus')) return 'AppNexus/Xandr';
        if (domain.includes('adsrvr')) return 'The Trade Desk';
        if (domain.includes('rubiconproject') || domain.includes('rfihub')) return 'Rubicon/Magnite';
        if (domain.includes('pubmatic')) return 'PubMatic';
        if (domain.includes('openx')) return 'OpenX';
        if (domain.includes('casalemedia') || domain.includes('indexexchange')) return 'Index Exchange';

        return 'Unknown Network';
    } catch {
        return 'Unknown Network';
    }
}


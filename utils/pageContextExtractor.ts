import type { PageContext } from '@/types/types';

export type { PageContext };

/**
 * Hostname (www-stripped) → content category.
 * At least 20 distinct entries covering a representative slice of the web.
 */
const CATEGORY_MAP: Record<string, string> = {
    // Entertainment
    'youtube.com':   'entertainment',
    'youtu.be':      'entertainment',
    'netflix.com':   'entertainment',
    'twitch.tv':     'entertainment',
    'spotify.com':   'entertainment',
    'imdb.com':      'entertainment',
    'vimeo.com':     'entertainment',
    // Shopping
    'amazon.com':    'shopping',
    'amazon.co.uk':  'shopping',
    'amazon.de':     'shopping',
    'amazon.fr':     'shopping',
    'amazon.co.jp':  'shopping',
    'ebay.com':      'shopping',
    'ebay.co.uk':    'shopping',
    'etsy.com':      'shopping',
    // News
    'bbc.com':          'news',
    'bbc.co.uk':        'news',
    'reuters.com':      'news',
    'theguardian.com':  'news',
    'nytimes.com':      'news',
    'cnn.com':          'news',
    'irishtimes.com':   'news',
    'rte.ie':           'news',
    'elpais.com':       'news',
    'lemonde.fr':       'news',
    'spiegel.de':       'news',
    // Search
    'google.com':      'search',
    'bing.com':        'search',
    'duckduckgo.com':  'search',
    'yahoo.com':       'search',
    'ecosia.org':      'search',
    // Social (also used for isSocialFeed)
    'twitter.com':   'social',
    'x.com':         'social',
    'facebook.com':  'social',
    'instagram.com': 'social',
    'tiktok.com':    'social',
    'linkedin.com':  'social',
    'reddit.com':    'social',
    'pinterest.com': 'social',
    'snapchat.com':  'social',
    // Technology
    'github.com':        'technology',
    'stackoverflow.com': 'technology',
    'medium.com':        'technology',
    'dev.to':            'technology',
    'hackernews.com':    'technology',
    // Reference
    'wikipedia.org': 'reference',
    'wikihow.com':   'reference',
    // Travel
    'tripadvisor.com': 'travel',
    'booking.com':     'travel',
    'airbnb.com':      'travel',
    'expedia.com':     'travel',
    // Finance
    'investing.com':  'finance',
    'bloomberg.com':  'finance',
    'ft.com':         'finance',
    // Sports
    'espn.com':     'sports',
    'skysports.com': 'sports',
};

/** URL params whose presence marks a search results page. */
const SEARCH_PARAMS = new Set(['q', 'query', 'search', 's', 'p', 'text']);

/** Domains whose home/feed page is a social content feed. */
const SOCIAL_FEED_DOMAINS = new Set([
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
    'tiktok.com',  'linkedin.com', 'reddit.com',
]);

/**
 * Extracts page-level context once per page load (call from content.ts main()).
 * Reads DOM synchronously — no async required.
 */
export function extractPageContext(): PageContext {
    const hostname = window.location.hostname.replace(/^www\./, '');
    const urlParams = new URLSearchParams(window.location.search);
    const paramKeys = Array.from(urlParams.keys());

    return {
        pageTitle:       document.title || undefined,
        contentLanguage: document.documentElement.lang || undefined,
        pageCategory:    inferPageCategory(hostname),
        isSearchPage:    paramKeys.some(k => SEARCH_PARAMS.has(k)),
        isSocialFeed:    SOCIAL_FEED_DOMAINS.has(hostname),
    };
}

function inferPageCategory(hostname: string): string | undefined {
    // Exact match first (fastest path)
    if (CATEGORY_MAP[hostname]) return CATEGORY_MAP[hostname];

    // Suffix match covers subdomains and regional TLDs (e.g. music.amazon.co.jp)
    for (const [domain, category] of Object.entries(CATEGORY_MAP)) {
        if (hostname.endsWith(`.${domain}`)) return category;
    }

    return undefined;
}


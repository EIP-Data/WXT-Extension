# AGENTS.md — Datalyz Browser Extension

## Project Overview
Datalyz is a WXT + Vue 3 browser extension that detects and analyzes ads/trackers on visited pages, batches the data, and syncs it to a backend API.

## Build & Dev Commands
```bash
npm run dev              # Chrome dev build with HMR
npm run dev:firefox      # Firefox dev build
npm run build            # Chrome production build → .output/chrome-mv3/
npm run build:firefox    # Firefox production build
npm run zip              # Package for Chrome Web Store
npm run zip:firefox      # Package for Firefox Add-ons
npm run compile          # TypeScript type-check only (no emit)
```
> `wxt prepare` runs automatically via `postinstall`. Re-run it if auto-imports break.

## Environment
Copy `.env.example` → `.env` and set `VITE_API_ENDPOINT`. It is forwarded to both background and overlay via `wxt.config.ts` `define`.

## Architecture: Three Entrypoints
| File | Context | Role |
|------|---------|------|
| `entrypoints/background.ts` | Service Worker | Ad detection (network), message broker, batch sync, EasyList |
| `entrypoints/content.ts` | Content Script | DOM scanning for ad elements (MutationObserver + 5s interval) |
| `entrypoints/overlay.content.ts` | Content Script | Mounts the Vue UI in a Shadow DOM (`datalyz-overlay` custom element) |

**Toggle flow:** Toolbar click → `browser.action.onClicked` → `TOGGLE_OVERLAY` message → `window.dispatchEvent(new CustomEvent('datalyz:toggle'))` → `OverlayApp.vue`.

## API Proxy Pattern (critical)
Content scripts cannot make direct HTTP requests. All API calls route through the background:
- `utils/api.ts` auto-detects context via `isContentScript()`.
- From the overlay it sends `{ action: 'API_PROXY_REQUEST', data: { url, method, data, headers, baseURL } }`.
- Background handles it with `axios` and must `return true` from the listener to keep the channel open.
- Always use `apiHandler.get/post/put/delete()` — never call `axios` directly from components.

## Message Protocol
All cross-context communication uses `browser.runtime.sendMessage` with an `action` string key. Defined actions:
`AD_DETECTED`, `REPORT_ADS`, `GET_ADS_ANALYTICS`, `TOGGLE_TRACKING`, `GET_TRACKING_STATE`, `CLEAR_ADS_ANALYTICS`, `FORCE_SYNC`, `GET_QUEUE_STATS`, `SEND_BATCH_TO_BACKEND`, `UPDATE_EASYLIST`, `AD_STORED_UPDATE`, `TOGGLE_OVERLAY`, `API_PROXY_REQUEST`.

## Data Pipeline
1. Network-level: `webRequest.onBeforeRequest` + `@cliqz/adblocker` `FiltersEngine` (EasyList + EasyPrivacy, cached 24h in `browser.storage.local`).
2. DOM-level: `content.ts` queries ad selectors → sends `REPORT_ADS` to background.
3. Background stores up to 500 recent `AdData` in `browser.storage.local['adsAnalytics']` (for real-time UI).
4. Background also enqueues into `batchQueue` (`utils/batchQueue.ts`) — IndexedDB-backed, batches of 50, flushes every 5 min → `POST /analytics/batch`.

## WXT Auto-Imports
WXT globally injects: `defineBackground`, `defineContentScript`, `createShadowRootUi`, `browser`. **Do not import these.** Use `import { storage } from '#imports'` for WXT's storage abstraction (`local:` prefix for `browser.storage.local`).

## Overlay UI & Routing
`OverlayApp.vue` implements a manual router via a `computed` property (`activeComponent`) — **there is no vue-router** in the overlay. Views: `Login`, `Home`, `Analytics`, `Preferences`. Navigate via `@navigate="navigate"` event emitted from child components.

## Shadow DOM & Dark Mode
The overlay lives inside a Shadow DOM, so Tailwind dark mode (`darkMode: 'class'`) must be applied to the shadow host element, not `<html>`. See `composables/useDarkMode.ts` — it targets `datalyz-overlay`'s shadow root. Dark mode state is persisted in `browser.storage.local['darkMode']`.

## i18n (Two-Tier)
- `public/_locales/*/messages.json` — manifest strings only (`__MSG_extName__`).
- `assets/locales/*.json` — all Vue UI strings, typed against `en.json` schema.
- Use `composables/useI18n.ts` (not `vue-i18n` directly) for type-safe `t()` calls.
- Language is persisted in `local:user-lang` via WXT storage and loaded in `overlay.content.ts` before app mount.

## Key Conventions
- **Pinia stores** use composition API style. `initAuth()` must be called on overlay mount (already done in `OverlayApp.vue`).
- **Path alias `@/`** maps to the project root (not `src/`).
- **All shared types** live in `types/types.ts` (`AdData`, `BatchPayload`, `TrackerData`, etc.).
- **Brand color** is orange: `text-orange-500`, custom `orangePrimary` token in `tailwind.config.js`.
- Overlay position is persisted in `browser.storage.local['overlayPosition']` via `composables/useDraggable.ts`.


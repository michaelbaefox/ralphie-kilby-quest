/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope & {
  /** Precache manifest — replaced at build time (vite-plugin-pwa). */
  __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0]
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

void self.skipWaiting()
void clientsClaim()

registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

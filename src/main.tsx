import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Avoid stale service worker caching during development. The weather/Road UI
// is under active iteration, so we want Vite to always serve the latest code.
if (import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {
        /* ignore */
      })
  }
} else {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/vt323/latin-400.css'
import '@fontsource/press-start-2p/latin-400.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Installable PWA with an offline shell. Prod only, so dev never serves stale code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

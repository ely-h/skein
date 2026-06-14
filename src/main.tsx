import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SharePage from './pages/SharePage.tsx'

// Applique le thème avant le premier rendu pour éviter le flash.
const saved       = localStorage.getItem('skein-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (saved === 'dark' || (!saved && prefersDark)) {
  document.documentElement.classList.add('dark');
}

// Routage minimal : /share → SharePage, tout le reste → App.
const base     = import.meta.env.BASE_URL; // '/skein/'
const pathname = window.location.pathname;
const isShare  = pathname === `${base}share` || pathname === `${base}share/`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isShare ? <SharePage /> : <App />}
  </StrictMode>,
)

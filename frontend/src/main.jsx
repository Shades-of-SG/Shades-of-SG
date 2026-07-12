import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SessionProvider } from './context/SessionContext.jsx'
import { TranslationProvider } from './context/TranslationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider resetOnPublicEntry>
      <TranslationProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </TranslationProvider>
    </AuthProvider>
  </StrictMode>,
)

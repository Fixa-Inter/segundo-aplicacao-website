import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { AppAppearance } from './components/AppAppearance'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <AppAppearance>
        <App />
      </AppAppearance>
    </PreferencesProvider>
  </StrictMode>,
)

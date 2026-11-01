import '@mantine/core/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AppAppearance } from './components/AppAppearance'
import { PreferencesProvider } from './contexts/PreferencesContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <AppAppearance>
        <App />
      </AppAppearance>
    </PreferencesProvider>
  </StrictMode>,
)

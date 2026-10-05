import { MantineProvider } from '@mantine/core'
import { usePreferences } from '../../contexts/usePreferences'
import type { AppAppearanceProps } from '../../types/ui'

export function AppAppearance({ children }: AppAppearanceProps) {
  const { theme } = usePreferences()
  return (
    <MantineProvider
      forceColorScheme={theme}
      theme={{ fontFamily: 'Poppins, system-ui, sans-serif', primaryColor: 'blue' }}
    >
      {children}
    </MantineProvider>
  )
}

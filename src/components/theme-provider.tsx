"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'

type Theme = 'light' | 'dark' | 'midnight' | 'sepia' | 'nord'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  themes?: Theme[]
  attribute?: 'class'
  enableSystem?: boolean
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: Theme[]
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'ui-theme',
  themes = ['light', 'dark', 'midnight', 'sepia', 'nord'],
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Set mounted flag after mount to avoid SSR hydration issues
  useEffect(() => {
    queueMicrotask(() => setMounted(true))

    // Load persisted theme after mount (async to satisfy react-hooks/set-state-in-effect)
    try {
      const storedTheme = window.localStorage.getItem(storageKey) as Theme | null
      if (storedTheme && themes.includes(storedTheme)) {
        queueMicrotask(() => setTheme(storedTheme))
      }
    } catch {
      // localStorage not available
    }
  }, [storageKey, themes])

  // Whenever theme changes, update localStorage and HTML class
  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // remove old theme classes
    root.classList.remove(...themes)

    if (theme) {
      root.classList.add(theme)
      try {
        window.localStorage.setItem(storageKey, theme)
      } catch (e) {
        // localStorage not available
      }
    }
  }, [theme, themes, storageKey, mounted])

  const value = {
    theme,
    setTheme,
    themes,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

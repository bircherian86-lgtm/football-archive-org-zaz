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
  // Initialize theme from localStorage when possible, otherwise fall back to default
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    try {
      const storedTheme = window.localStorage.getItem(storageKey) as Theme | null
      if (storedTheme && themes.includes(storedTheme)) {
        return storedTheme
      }
    } catch {
      // localStorage not available
    }
    return defaultTheme
  })

  // Whenever theme changes, update localStorage and HTML class
  useEffect(() => {
    const root = window.document.documentElement

    // remove old theme classes
    root.classList.remove(...themes)

    if (theme) {
      root.classList.add(theme)
      try {
        window.localStorage.setItem(storageKey, theme)
      } catch {
        // localStorage not available
      }
    }
  }, [theme, themes, storageKey])

  const value = {
    theme,
    setTheme,
    themes,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
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

'use client'

import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const themes = [
  { name: 'Light', theme: 'light', color: 'hsl(0 0% 100%)' },
  { name: 'Dark', theme: 'dark', color: 'hsl(240 10% 3.9%)' },
  { name: 'Midnight', theme: 'midnight', color: 'hsl(235 10% 8%)' },
  { name: 'Sepia', theme: 'sepia', color: 'hsl(40 30% 96%)' },
  { name: 'Nord', theme: 'nord', color: 'hsl(210 20% 15%)' },
] as const;

export function ThemeSwitcher() {
  const { theme: activeTheme, setTheme } = useTheme()

  return (
    <div>
        <h3 className="mb-4 text-base font-medium text-primary/80">Atmosphere Mode</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {themes.map(({ name, theme, color }) => (
            <div key={theme} className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                className={cn(
                  'h-24 w-full flex-col gap-2 justify-center border-2 bg-transparent transition-all',
                  activeTheme === theme
                    ? 'border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]'
                    : 'border-muted-foreground/30 hover:border-primary/70'
                )}
                onClick={() => setTheme(theme)}
              >
                <div
                  className="h-8 w-8 rounded-md border"
                  style={{ backgroundColor: color }}
                />
                <span>{name}</span>
              </Button>
            </div>
          ))}
        </div>
    </div>
  )
}

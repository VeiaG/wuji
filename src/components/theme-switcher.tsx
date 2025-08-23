'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const ThemeSwitcherCards = () => {
  const { theme, setTheme } = useTheme()

  const themes = [
    {
      id: 'light',
      name: 'Світла тема',
      description: 'Класичний світлий інтерфейс',
      icon: Sun,
      preview: 'bg-white border-gray-200',
      previewText: 'text-gray-900',
      previewAccent: 'bg-neutral-300',
    },
    {
      id: 'dark',
      name: 'Темна тема',
      description: 'Зручна для очей у темряві',
      icon: Moon,
      preview: 'bg-neutral-900 border-neutral-600',
      previewText: 'text-white',
      previewAccent: 'bg-neutral-500',
    },
    {
      id: 'system',
      name: 'Системна тема',
      description: 'Відповідає налаштуванням системи',
      icon: Monitor,
      preview: 'bg-gradient-to-br from-white to-neutral-900 border-neutral-400',
      previewText: 'text-gray-700',
      previewAccent: 'bg-neutral-500',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Оберіть тему</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isSelected = theme === themeOption.id

          return (
            <Card
              key={themeOption.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md p-0',
                isSelected && 'ring-2 ring-accent-foreground shadow-md',
              )}
              onClick={() => setTheme(themeOption.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-5 w-5" />
                  {isSelected && <div className="h-2 w-2 bg-accent-foreground rounded-full" />}
                </div>

                {/* Theme Preview */}
                <div
                  className={cn(
                    'h-16 rounded-md border-2 mb-3 relative overflow-hidden',
                    themeOption.preview,
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-2 left-2 text-xs font-medium',
                      themeOption.previewText,
                    )}
                  >
                    Aa
                  </div>
                  <div
                    className={cn(
                      'absolute bottom-2 right-2 h-2 w-8 rounded',
                      themeOption.previewAccent,
                    )}
                  />
                </div>

                <div>
                  <h4 className="font-medium text-sm">{themeOption.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{themeOption.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeSwitcherCards

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface SimpleTabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export function SimpleTabs({ tabs, defaultTab, className }: SimpleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'pb-3 px-1 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents - all rendered but hidden with CSS */}
      <div className="mt-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ display: activeTab === tab.id ? 'block' : 'none' }}
            className="animate-in fade-in-50 duration-200"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}

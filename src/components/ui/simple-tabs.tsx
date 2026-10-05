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
      <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-background p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'min-h-10 shrink-0 rounded-xl px-4 text-[15px] font-semibold transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-soft hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
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

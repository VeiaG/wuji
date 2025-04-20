'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableDescriptionProps {
  children: React.ReactNode
  maxHeight?: number
  className?: string
  showMoreText?: string
  showLessText?: string
}

export function ExpandableDescription({
  children,
  maxHeight = 120,
  className,
  showMoreText = 'Показати більше',
  showLessText = 'Показати менше',
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if content height exceeds maxHeight to determine if we need the button
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight
      setShowButton(contentHeight > maxHeight)
    }
  }, [maxHeight, children])

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          !isExpanded && showButton ? 'mask-bottom' : '',
        )}
        style={{ maxHeight: isExpanded ? '2000px' : `${maxHeight}px` }}
        ref={contentRef}
      >
        {children}
      </div>

      {showButton && (
        <div className={cn('flex justify-start mt-2 transition-opacity duration-200')}>
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 text-primary text-sm font-medium hover:underline select-none"
          >
            {isExpanded ? (
              <>
                {showLessText}
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                {showMoreText}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

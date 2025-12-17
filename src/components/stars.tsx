'use client'
import React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type StarsProps = {
  rating: number
  maxRating?: number
  size?: number
  showNumber?: boolean
  className?: string
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

const Stars: React.FC<StarsProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  showNumber = true,
  className = '',
  interactive = false,
  onRatingChange,
}) => {
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null)

  const displayRating = interactive && hoveredRating !== null ? hoveredRating : rating

  const handleClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1
        const fillPercentage = Math.min(Math.max(displayRating - i, 0), 1) * 100

        return (
          <div
            key={i}
            className={cn('relative', interactive && 'cursor-pointer')}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => interactive && setHoveredRating(starValue)}
            onMouseLeave={() => interactive && setHoveredRating(null)}
            style={{ width: size, height: size }}
          >
            {/* Background star (empty) */}
            <Star
              size={size}
              className="absolute top-0 left-0 text-muted-foreground"
              strokeWidth={1.5}
            />
            {/* Foreground star (filled) */}
            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star size={size} className="text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
            </div>
          </div>
        )
      })}
      {showNumber && (
        <span className="text-sm font-medium ml-1">
          {displayRating.toFixed(1)}/{maxRating}
        </span>
      )}
    </div>
  )
}

export default Stars

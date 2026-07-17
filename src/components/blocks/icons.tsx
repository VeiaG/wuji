import {
  ArrowRight,
  BookOpen,
  Code,
  CreditCard,
  ExternalLink,
  Github,
  GitPullRequest,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Library,
  LucideIcon,
  Mail,
  MessageCircle,
  PenTool,
  Rocket,
  Send,
  Shield,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Мапа іконок для блоків сторінок.
 * Значення відповідають опціям iconField у src/collections/blocks/fields.ts
 */
export const blockIcons: Record<string, LucideIcon> = {
  ArrowRight,
  BookOpen,
  Code,
  CreditCard,
  ExternalLink,
  Github,
  GitPullRequest,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Library,
  Mail,
  MessageCircle,
  PenTool,
  Rocket,
  Send,
  Shield,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Zap,
}

export const iconColorClasses: Record<string, string> = {
  primary: 'text-primary',
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  orange: 'text-orange-500',
  cyan: 'text-cyan-500',
  yellow: 'text-yellow-500',
}

export const BlockIcon: React.FC<{
  icon?: string | null
  color?: string | null
  className?: string
}> = ({ icon, color, className }) => {
  if (!icon) return null
  const Icon = blockIcons[icon]
  if (!Icon) return null
  return <Icon className={cn(color ? iconColorClasses[color] : undefined, className)} />
}

import type { WikiEntry, WikiMention, WikiRelation } from '@/payload-types'
import {
  CalendarDays,
  Gem,
  Lightbulb,
  MapPin,
  Mountain,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type WikiEntryType = WikiEntry['type']
export type WikiMentionType = WikiMention['mentionType']
export type WikiRelationType = WikiRelation['type']

// Display order of type sections on the wiki index page
export const ENTRY_TYPE_ORDER: WikiEntryType[] = [
  'character',
  'organization',
  'location',
  'technique',
  'item',
  'realm',
  'event',
  'concept',
]

export const ENTRY_TYPE_LABELS: Record<
  WikiEntryType,
  { singular: string; plural: string; icon: LucideIcon }
> = {
  character: { singular: 'Персонаж', plural: 'Персонажі', icon: User },
  organization: { singular: 'Організація', plural: 'Організації', icon: Users },
  location: { singular: 'Локація', plural: 'Локації', icon: MapPin },
  technique: { singular: 'Техніка', plural: 'Техніки', icon: Sparkles },
  item: { singular: 'Предмет', plural: 'Предмети', icon: Gem },
  realm: { singular: 'Царство', plural: 'Царства', icon: Mountain },
  event: { singular: 'Подія', plural: 'Події', icon: CalendarDays },
  concept: { singular: 'Концепція', plural: 'Концепції', icon: Lightbulb },
}

export const MENTION_TYPE_LABELS: Record<WikiMentionType, string> = {
  appearance: 'Поява',
  dialogue: 'Діалог',
  backstory: 'Передісторія',
  'power-up': 'Посилення',
  'relationship-change': 'Зміна стосунків',
  death: 'Смерть',
  'item-acquired': 'Отримання предмета',
  'location-visited': 'Відвідання локації',
  'realm-change': 'Зміна царства',
  other: 'Згадка',
}

/**
 * Relations are stored in one canonical direction (A teacher-of B).
 * `out` names the OTHER entry as seen from the source's page (B is the
 * student), `in` names the other entry from the target's page (A is the
 * teacher). Symmetric types read the same from both sides.
 */
export const RELATION_TYPE_LABELS: Record<WikiRelationType, { out: string; in: string }> = {
  'related-to': { out: 'Пов’язані', in: 'Пов’язані' },
  'teacher-of': { out: 'Учні', in: 'Учителі' },
  'parent-of': { out: 'Діти', in: 'Батьки' },
  'sibling-of': { out: 'Брати / сестри', in: 'Брати / сестри' },
  'friend-of': { out: 'Друзі', in: 'Друзі' },
  'enemy-of': { out: 'Вороги', in: 'Вороги' },
  'ally-of': { out: 'Союзники', in: 'Союзники' },
  'rival-of': { out: 'Суперники', in: 'Суперники' },
  'romantic-interest-of': { out: 'Романтичний інтерес', in: 'Романтичний інтерес' },
  'member-of': { out: 'Належить до', in: 'Члени' },
  'leader-of': { out: 'Очолює', in: 'Лідери' },
  'owner-of': { out: 'Володіє', in: 'Власники' },
  'user-of': { out: 'Використовує', in: 'Використовують' },
  'located-in': { out: 'Розташування', in: 'Що тут знаходиться' },
  'participant-in': { out: 'Бере участь у', in: 'Учасники' },
}

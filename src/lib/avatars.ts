import { User } from '@/payload-types'

export const getUserAvatarURL = (user: User | null | undefined): string => {
  if (user && user.avatar && typeof user.avatar === 'object' && user.avatar.url) {
    return user.avatar.url
  }
  return 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=' + user?.nickname
}
export const getUserBannerURL = (user: User | null | undefined): string | null => {
  if (user && user.banner && typeof user.banner === 'object' && user.banner.url) {
    return user.banner.url
  }
  return null
}

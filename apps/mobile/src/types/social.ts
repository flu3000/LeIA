export interface Insight {
  id: string
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  content: string
  author?: string
  bookTitle?: string
  materialLink?: string
  likesCount: number
  isLiked: boolean
  createdAt: string
  profileHandle: string
}

export interface PublicProfile {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  totalXP: number
  isFollowing: boolean
}

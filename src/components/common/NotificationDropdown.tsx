'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@/components/ui/Icon'
import { useTab, TabId } from '@/components/providers/TabContext'

interface NotificationData {
  id: number
  type: string
  message: string | null
  link: string | null
  isRead: boolean
  createdAt: string
  actor: {
    id: number
    nickname: string
    profileImage: string | null
  } | null
}

interface NotificationsResponse {
  notifications: NotificationData[]
  unreadCount: number
}

function parseCommunityLink(link: string): { postId: number; categorySlug: string } | null {
  const match = link.match(/^\/community\/([a-z]+)\/(\d+)$/)
  if (match) {
    return { categorySlug: match[1], postId: parseInt(match[2], 10) }
  }
  return null
}

function parseHashTabLink(link: string): TabId | null {
  const match = link.match(/^\/?#([a-z]+)/)
  if (match) {
    const tab = match[1]
    const validTabs: TabId[] = ['intro', 'career', 'portfolio', 'community', 'diary', 'guestbook', 'admin', 'settings']
    if (validTabs.includes(tab as TabId)) {
      return tab as TabId
    }
  }
  return null
}

async function fetchNotifications(): Promise<NotificationsResponse> {
  const response = await fetch('/api/notifications?limit=10')
  if (!response.ok) throw new Error('Failed to fetch notifications')
  return response.json()
}

export function NotificationDropdown() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { setCommunityPost, setActiveTab } = useTab()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: !!session,
    refetchInterval: 30000, // 30초마다 새로고침
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!session) return null

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleNotificationClick = async (notification: NotificationData, e: React.MouseEvent) => {
    if (!notification.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification.id }),
        })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
    setIsOpen(false)

    if (notification.link) {
      const communityLink = parseCommunityLink(notification.link)
      if (communityLink) {
        e.preventDefault()
        setCommunityPost(communityLink.postId, communityLink.categorySlug)
        return
      }

      const hashTab = parseHashTabLink(notification.link)
      if (hashTab) {
        e.preventDefault()
        setActiveTab(hashTab)
        return
      }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Icon name="notifications" />
        {data && data.unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              알림
            </h3>
            {data && data.unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {!data || data.notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                알림이 없습니다
              </div>
            ) : (
              data.notifications.map((notification) => (
                <a
                  key={notification.id}
                  href={notification.link || '#'}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  className={`block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notification.actor?.profileImage ? (
                      <img
                        src={notification.actor.profileImage}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                        {notification.actor?.nickname?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

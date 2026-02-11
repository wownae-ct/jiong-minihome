import { prisma } from '@/lib/prisma'
import { sendNotificationEmail } from '@/lib/email'

interface CreateNotificationParams {
  userId: number
  type: string
  actorId?: number
  targetType?: string
  targetId?: number
  message: string
  link?: string
}

// type -> notification setting key 매핑
const TYPE_TO_SETTING_KEY: Record<string, string> = {
  comment: 'comments',
  reply: 'replies',
  like: 'likes',
}

/**
 * 사용자의 알림 설정 조회
 * 설정이 없으면 기본값 (모두 활성화) 반환
 */
async function getUserNotificationPrefs(userId: number): Promise<Record<string, boolean>> {
  const setting = await prisma.siteSetting.findUnique({
    where: { settingKey: `user_notification_prefs_${userId}` },
  })

  if (!setting?.settingValue) {
    return { comments: true, likes: true, replies: true, email: false }
  }

  try {
    return JSON.parse(setting.settingValue)
  } catch {
    return { comments: true, likes: true, replies: true, email: false }
  }
}

/**
 * 단일 알림 생성
 * 자기 자신에게는 알림을 보내지 않음
 * 사용자의 알림 설정을 확인하여 비활성화된 타입은 건너뜀
 */
export async function createNotification(params: CreateNotificationParams) {
  // 자기 자신에게는 알림 안 보냄
  if (params.actorId && params.userId === params.actorId) {
    return null
  }

  // 사용자 알림 설정 확인
  const prefs = await getUserNotificationPrefs(params.userId)
  const settingKey = TYPE_TO_SETTING_KEY[params.type]
  if (settingKey && prefs[settingKey] === false) {
    return null
  }

  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      actorId: params.actorId || null,
      targetType: params.targetType || null,
      targetId: params.targetId || null,
      message: params.message,
      link: params.link || null,
    },
  })

  // 이메일 알림이 활성화되어 있으면 이메일 발송
  if (prefs.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true },
      })
      if (user?.email) {
        await sendNotificationEmail(user.email, params.message, params.link)
      }
    } catch (error) {
      console.error('Notification email send error:', error)
    }
  }

  return notification
}

/**
 * 여러 사용자에게 알림 일괄 생성
 * actorId와 동일한 userId는 자동 제외
 */
export async function createBulkNotifications(
  userIds: number[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  // actorId와 같은 사용자 제외
  const filteredUserIds = params.actorId
    ? userIds.filter((id) => id !== params.actorId)
    : userIds

  if (filteredUserIds.length === 0) return

  return prisma.notification.createMany({
    data: filteredUserIds.map((userId) => ({
      userId,
      type: params.type,
      actorId: params.actorId || null,
      targetType: params.targetType || null,
      targetId: params.targetId || null,
      message: params.message,
      link: params.link || null,
    })),
  })
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    siteSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/email', () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'
import { sendNotificationEmail } from '@/lib/email'
import { createNotification, createBulkNotifications } from './notifications'

describe('createNotification', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('알림을 생성해야 함', async () => {
    vi.mocked(prisma.notification.create).mockResolvedValueOnce({
      id: 1,
      userId: 2,
      type: 'comment',
      actorId: 1,
      targetType: 'post',
      targetId: 10,
      message: '테스터님이 댓글을 달았습니다',
      link: '/community/free/10',
      isRead: false,
      createdAt: new Date(),
    })

    const result = await createNotification({
      userId: 2,
      type: 'comment',
      actorId: 1,
      targetType: 'post',
      targetId: 10,
      message: '테스터님이 댓글을 달았습니다',
      link: '/community/free/10',
    })

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 2,
        type: 'comment',
        actorId: 1,
        targetType: 'post',
        targetId: 10,
        message: '테스터님이 댓글을 달았습니다',
        link: '/community/free/10',
      },
    })
    expect(result).toBeTruthy()
  })

  it('자기 자신에게는 알림을 보내지 않아야 함', async () => {
    const result = await createNotification({
      userId: 1,
      type: 'comment',
      actorId: 1,
      message: '자기 게시글에 댓글',
    })

    expect(result).toBeNull()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('사용자가 해당 알림 타입을 비활성화하면 알림을 생성하지 않아야 함', async () => {
    // 좋아요 알림 비활성화 설정
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValueOnce({
      id: 1,
      settingKey: 'user_notification_prefs_2',
      settingValue: JSON.stringify({ comments: true, likes: false, replies: true, email: false }),
      description: null,
      updatedAt: new Date(),
    })

    const result = await createNotification({
      userId: 2,
      type: 'like',
      actorId: 1,
      message: '좋아요 알림',
    })

    expect(result).toBeNull()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('알림 설정이 활성화된 타입은 정상적으로 알림을 생성해야 함', async () => {
    // 댓글 알림 활성화 설정
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValueOnce({
      id: 1,
      settingKey: 'user_notification_prefs_2',
      settingValue: JSON.stringify({ comments: true, likes: false, replies: true, email: false }),
      description: null,
      updatedAt: new Date(),
    })

    vi.mocked(prisma.notification.create).mockResolvedValueOnce({
      id: 1,
      userId: 2,
      type: 'comment',
      actorId: 1,
      targetType: null,
      targetId: null,
      message: '댓글 알림',
      link: null,
      isRead: false,
      createdAt: new Date(),
    })

    const result = await createNotification({
      userId: 2,
      type: 'comment',
      actorId: 1,
      message: '댓글 알림',
    })

    expect(result).toBeTruthy()
    expect(prisma.notification.create).toHaveBeenCalled()
  })

  it('이메일 알림이 활성화되어 있으면 이메일을 발송해야 함', async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValueOnce({
      id: 1,
      settingKey: 'user_notification_prefs_2',
      settingValue: JSON.stringify({ comments: true, likes: true, replies: true, email: true }),
      description: null,
      updatedAt: new Date(),
    })

    vi.mocked(prisma.notification.create).mockResolvedValueOnce({
      id: 1,
      userId: 2,
      type: 'comment',
      actorId: 1,
      targetType: 'post',
      targetId: 10,
      message: '댓글 알림',
      link: '/community/free/10',
      isRead: false,
      createdAt: new Date(),
    })

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 2,
      email: 'user@gmail.com',
      nickname: 'testuser',
      passwordHash: null,
      profileImage: null,
      bio: null,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    })

    await createNotification({
      userId: 2,
      type: 'comment',
      actorId: 1,
      message: '댓글 알림',
      link: '/community/free/10',
    })

    expect(sendNotificationEmail).toHaveBeenCalledWith('user@gmail.com', '댓글 알림', '/community/free/10')
  })

  it('이메일 알림이 비활성화되어 있으면 이메일을 발송하지 않아야 함', async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValueOnce({
      id: 1,
      settingKey: 'user_notification_prefs_2',
      settingValue: JSON.stringify({ comments: true, likes: true, replies: true, email: false }),
      description: null,
      updatedAt: new Date(),
    })

    vi.mocked(prisma.notification.create).mockResolvedValueOnce({
      id: 1,
      userId: 2,
      type: 'comment',
      actorId: 1,
      targetType: null,
      targetId: null,
      message: '댓글 알림',
      link: null,
      isRead: false,
      createdAt: new Date(),
    })

    await createNotification({
      userId: 2,
      type: 'comment',
      actorId: 1,
      message: '댓글 알림',
    })

    expect(sendNotificationEmail).not.toHaveBeenCalled()
  })

  it('이메일 발송 실패해도 알림 생성은 정상적으로 완료되어야 함', async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValueOnce({
      id: 1,
      settingKey: 'user_notification_prefs_2',
      settingValue: JSON.stringify({ comments: true, likes: true, replies: true, email: true }),
      description: null,
      updatedAt: new Date(),
    })

    vi.mocked(prisma.notification.create).mockResolvedValueOnce({
      id: 1,
      userId: 2,
      type: 'comment',
      actorId: 1,
      targetType: null,
      targetId: null,
      message: '댓글 알림',
      link: null,
      isRead: false,
      createdAt: new Date(),
    })

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 2,
      email: 'user@gmail.com',
      nickname: 'testuser',
      passwordHash: null,
      profileImage: null,
      bio: null,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    })

    vi.mocked(sendNotificationEmail).mockRejectedValueOnce(new Error('SMTP error'))

    const result = await createNotification({
      userId: 2,
      type: 'comment',
      actorId: 1,
      message: '댓글 알림',
    })

    expect(result).toBeTruthy()
    expect(prisma.notification.create).toHaveBeenCalled()
  })
})

describe('createBulkNotifications', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('여러 사용자에게 알림을 일괄 생성해야 함', async () => {
    vi.mocked(prisma.notification.createMany).mockResolvedValueOnce({ count: 3 })

    await createBulkNotifications([2, 3, 4], {
      type: 'announcement',
      actorId: 1,
      message: '새 공지사항이 등록되었습니다',
      link: '/#intro',
    })

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 2, type: 'announcement', actorId: 1, targetType: null, targetId: null, message: '새 공지사항이 등록되었습니다', link: '/#intro' },
        { userId: 3, type: 'announcement', actorId: 1, targetType: null, targetId: null, message: '새 공지사항이 등록되었습니다', link: '/#intro' },
        { userId: 4, type: 'announcement', actorId: 1, targetType: null, targetId: null, message: '새 공지사항이 등록되었습니다', link: '/#intro' },
      ],
    })
  })

  it('actorId와 동일한 userId는 제외해야 함', async () => {
    vi.mocked(prisma.notification.createMany).mockResolvedValueOnce({ count: 2 })

    await createBulkNotifications([1, 2, 3], {
      type: 'announcement',
      actorId: 1,
      message: '공지사항',
    })

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: 2 }),
        expect.objectContaining({ userId: 3 }),
      ]),
    })

    // actorId=1인 사용자는 포함되지 않아야 함
    const callArgs = vi.mocked(prisma.notification.createMany).mock.calls[0][0]
    const data = (callArgs as { data: { userId: number }[] }).data
    expect(data.find((d) => d.userId === 1)).toBeUndefined()
  })

  it('모든 userId가 actorId와 같으면 아무것도 생성하지 않아야 함', async () => {
    await createBulkNotifications([1], {
      type: 'announcement',
      actorId: 1,
      message: '공지사항',
    })

    expect(prisma.notification.createMany).not.toHaveBeenCalled()
  })
})

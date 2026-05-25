import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  profileSchema,
  ProfileInput,
  PROFILE_SETTING_KEYS,
  profileKeyToSettingKey,
  settingKeyToProfileKey,
} from '@/lib/validations/profile'
import { requireAdmin, formatZodError } from '@/lib/api/helpers'
import { toProxyPath } from '@/lib/fileUrl'

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        settingKey: {
          in: [...PROFILE_SETTING_KEYS],
        },
      },
    })

    const profile: Record<string, string> = {
      name: '',
      title: '',
      quote: '',
      email: '',
      github: '',
      linkedin: '',
      website: '',
      imageUrl: '',
    }

    for (const setting of settings) {
      const profileKey = settingKeyToProfileKey(setting.settingKey as (typeof PROFILE_SETTING_KEYS)[number])
      profile[profileKey] = setting.settingValue || ''
    }

    // 프로필 이미지는 비공개 MinIO 객체 → 동일 출처 프록시 경로로 변환 (외부 URL은 그대로)
    profile.imageUrl = toProxyPath(profile.imageUrl)

    return NextResponse.json(profile)
  } catch (error) {
    console.error('프로필 조회 오류:', error)
    return NextResponse.json({ error: '프로필을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const body = await request.json()
    const result = profileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      )
    }

    const data = result.data

    const updatePromises = Object.entries(data).map(async ([key, value]) => {
      if (value === undefined) return null

      const settingKey = profileKeyToSettingKey(key as keyof ProfileInput)

      return prisma.siteSetting.upsert({
        where: { settingKey },
        update: { settingValue: value },
        create: {
          settingKey,
          settingValue: value,
          description: `프로필 ${key}`,
        },
      })
    })

    await Promise.all(updatePromises.filter(Boolean))

    return NextResponse.json({ success: true, message: '프로필이 업데이트되었습니다.' })
  } catch (error) {
    console.error('프로필 업데이트 오류:', error)
    return NextResponse.json({ error: '프로필 업데이트에 실패했습니다.' }, { status: 500 })
  }
}

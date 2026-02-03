import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  profileSchema,
  ProfileInput,
  PROFILE_SETTING_KEYS,
  profileKeyToSettingKey,
  settingKeyToProfileKey,
} from '@/lib/validations/profile'

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

    return NextResponse.json(profile)
  } catch (error) {
    console.error('프로필 조회 오류:', error)
    return NextResponse.json({ error: '프로필을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json()
    const result = profileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다.', details: result.error.flatten() },
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

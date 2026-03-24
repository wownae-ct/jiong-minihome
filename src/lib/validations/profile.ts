import { z } from 'zod'

const optionalEmail = z.union([
  z.string().email('유효한 이메일 주소를 입력해주세요'),
  z.literal(''),
])

const optionalUrl = z.union([z.string().url('유효한 URL을 입력해주세요'), z.literal('')])

const optionalImageUrl = z.union([
  z.string().url('유효한 URL을 입력해주세요'),
  z.literal(''),
])

export const profileSchema = z.object({
  name: z.string().max(100, '이름은 100자 이하여야 합니다').optional(),
  title: z.string().max(200, '직함은 200자 이하여야 합니다').optional(),
  quote: z.string().max(500, '인용문은 500자 이하여야 합니다').optional(),
  email: optionalEmail.optional(),
  github: optionalUrl.optional(),
  linkedin: optionalUrl.optional(),
  website: optionalUrl.optional(),
  imageUrl: optionalImageUrl.optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

export const PROFILE_SETTING_KEYS = [
  'profile_name',
  'profile_title',
  'profile_quote',
  'profile_email',
  'profile_github',
  'profile_linkedin',
  'profile_website',
  'profile_image',
] as const

export type ProfileSettingKey = (typeof PROFILE_SETTING_KEYS)[number]

export function profileKeyToSettingKey(key: keyof ProfileInput): ProfileSettingKey {
  const mapping: Record<keyof ProfileInput, ProfileSettingKey> = {
    name: 'profile_name',
    title: 'profile_title',
    quote: 'profile_quote',
    email: 'profile_email',
    github: 'profile_github',
    linkedin: 'profile_linkedin',
    website: 'profile_website',
    imageUrl: 'profile_image',
  }
  return mapping[key]
}

export function settingKeyToProfileKey(key: ProfileSettingKey): keyof ProfileInput {
  const mapping: Record<ProfileSettingKey, keyof ProfileInput> = {
    profile_name: 'name',
    profile_title: 'title',
    profile_quote: 'quote',
    profile_email: 'email',
    profile_github: 'github',
    profile_linkedin: 'linkedin',
    profile_website: 'website',
    profile_image: 'imageUrl',
  }
  return mapping[key]
}

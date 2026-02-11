import { z } from 'zod'

export const postSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요'),
  categoryId: z.number().int().positive('카테고리를 선택해주세요'),
  isPrivate: z.boolean().default(false),
})

export const guestPostSchema = postSchema.extend({
  guestName: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 20자 이내로 입력해주세요'),
  guestPassword: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 20자 이내로 입력해주세요'),
})

export const postPasswordSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type PostInput = z.input<typeof postSchema>
export type GuestPostInput = z.input<typeof guestPostSchema>
export type PostPasswordInput = z.infer<typeof postPasswordSchema>

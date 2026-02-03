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

export type PostInput = z.input<typeof postSchema>

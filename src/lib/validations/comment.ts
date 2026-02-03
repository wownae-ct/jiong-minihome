import { z } from 'zod'

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(1000, '1000자 이내로 입력해주세요'),
  parentId: z.number().int().positive().optional(),
})

export type CommentInput = z.input<typeof commentSchema>

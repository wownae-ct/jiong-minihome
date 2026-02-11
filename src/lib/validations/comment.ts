import { z } from 'zod'

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(1000, '1000자 이내로 입력해주세요'),
  parentId: z.number().int().positive().optional(),
})

export const guestCommentSchema = commentSchema.extend({
  guestName: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 20자 이내로 입력해주세요'),
  guestPassword: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 20자 이내로 입력해주세요'),
})

export type CommentInput = z.input<typeof commentSchema>
export type GuestCommentInput = z.input<typeof guestCommentSchema>

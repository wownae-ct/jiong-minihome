import { z } from 'zod'

export const guestbookSchema = z.object({
  content: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(500, '500자 이내로 입력해주세요'),
  guestName: z
    .string()
    .max(50, '이름은 50자 이내로 입력해주세요')
    .optional(),
  guestPassword: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 20자 이내로 입력해주세요')
    .optional(),
  isPrivate: z.boolean().default(false),
})

export const guestbookDeleteSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type GuestbookInput = z.input<typeof guestbookSchema>
export type GuestbookDeleteInput = z.infer<typeof guestbookDeleteSchema>

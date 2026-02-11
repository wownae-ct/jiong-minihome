import { z } from 'zod'

export const bgmTrackSchema = z.object({
  title: z
    .string()
    .min(1, 'BGM 제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요'),
  artist: z
    .string()
    .max(200, '아티스트명은 200자 이내로 입력해주세요')
    .optional(),
  duration: z.number().int().nonnegative().optional(),
})

export const bgmCreateSchema = bgmTrackSchema.extend({
  url: z.string().min(1, 'URL은 필수입니다'),
  originalName: z.string().min(1, '원본 파일명은 필수입니다'),
  filename: z.string().min(1, '파일명은 필수입니다'),
  fileSize: z.number().int().nonnegative().optional(),
})

export const bgmUpdateSchema = bgmTrackSchema.partial().extend({
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
})

export type BgmTrackInput = z.infer<typeof bgmTrackSchema>
export type BgmCreateInput = z.infer<typeof bgmCreateSchema>
export type BgmUpdateInput = z.infer<typeof bgmUpdateSchema>

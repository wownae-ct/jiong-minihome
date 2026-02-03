import { z } from 'zod'

// 포트폴리오 생성/수정 스키마
export const portfolioCreateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이내로 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  description: z.string().max(500, '설명은 500자 이내로 입력해주세요').optional(),
  image: z.string().max(500).nullable().optional(),
  githubUrl: z.string().url('올바른 URL을 입력해주세요').max(500).optional().or(z.literal('')),
  notionUrl: z.string().url('올바른 URL을 입력해주세요').max(500).optional().or(z.literal('')),
  featured: z.boolean(),
  tags: z.array(z.string()),
  sortOrder: z.number().optional(),
})

export const portfolioUpdateSchema = portfolioCreateSchema.partial()

// 태그 스키마
export const tagSchema = z.object({
  name: z.string().min(1, '태그명을 입력해주세요').max(50, '태그명은 50자 이내로 입력해주세요'),
  color: z.string().max(20).optional(),
})

export type PortfolioCreateInput = z.infer<typeof portfolioCreateSchema>
export type PortfolioUpdateInput = z.infer<typeof portfolioUpdateSchema>
export type TagInput = z.infer<typeof tagSchema>

import { z } from 'zod'

// 경력 스키마
export const careerItemSchema = z.object({
  id: z.number().optional(),
  company: z.string().min(1, '회사명을 입력해주세요'),
  position: z.string().min(1, '직책을 입력해주세요'),
  period: z.string().min(1, '기간을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  details: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
  skills: z.union([z.array(z.string()), z.string()]).transform((val) =>
    typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val
  ),
  isCurrent: z.boolean(),
})

export const careersSchema = z.array(careerItemSchema)

// 포트폴리오 스키마
export const portfolioItemSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  image: z.string().nullable(),
  tags: z.union([z.array(z.string()), z.string()]).transform((val) =>
    typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val
  ),
  githubUrl: z.string(),
  demoUrl: z.string(),
  featured: z.boolean(),
})

export const portfoliosSchema = z.array(portfolioItemSchema)

// 소개 스키마
export const introSchema = z.object({
  welcomeTitle: z.string().optional(),
  welcomeMessage: z.string().optional(),
  skills: z.array(z.string()).default([]),
})

export type CareerItem = z.infer<typeof careerItemSchema>
export type PortfolioItem = z.infer<typeof portfolioItemSchema>
export type IntroData = z.infer<typeof introSchema>

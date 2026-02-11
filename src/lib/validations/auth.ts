import { z } from 'zod'

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다'
    ),
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 최대 20자까지 가능합니다')
    .regex(
      /^[가-힣a-zA-Z0-9_]+$/,
      '닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다'
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export const findEmailSchema = z.object({
  nickname: z.string().min(1, '닉네임을 입력해주세요'),
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type FindEmailInput = z.infer<typeof findEmailSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

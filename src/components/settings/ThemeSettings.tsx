'use client'

import { Icon } from '@/components/ui/Icon'
import { useTheme } from '@/components/providers/ThemeProvider'

type ThemeOption = 'light' | 'dark' | 'system'

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()

  const themeOptions: { id: ThemeOption; label: string; icon: string; description: string }[] = [
    {
      id: 'light',
      label: '라이트 모드',
      icon: 'light_mode',
      description: '밝은 테마를 사용합니다',
    },
    {
      id: 'dark',
      label: '다크 모드',
      icon: 'dark_mode',
      description: '어두운 테마를 사용합니다',
    },
    {
      id: 'system',
      label: '시스템 설정',
      icon: 'settings_suggest',
      description: '시스템 설정에 따라 자동으로 변경됩니다',
    },
  ]

  const currentTheme = theme === 'dark' ? 'dark' : 'light'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              if (option.id === 'system') {
                // 시스템 설정에 따라 테마 변경
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                setTheme(prefersDark ? 'dark' : 'light')
              } else {
                setTheme(option.id as 'light' | 'dark')
              }
            }}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              currentTheme === option.id ||
              (option.id === 'system' && false) // 시스템 설정은 별도 처리 필요
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`p-2 rounded-lg flex items-center justify-center ${
                  currentTheme === option.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon name={option.icon} />
              </div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                {option.label}
              </h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon name="preview" size="sm" />
          현재 테마 미리보기
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-full h-4 bg-primary rounded mb-2" />
            <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-600 rounded mb-2" />
            <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary/20 rounded-full" />
              <div className="w-20 h-3 bg-slate-200 dark:bg-slate-600 rounded" />
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-600 rounded mb-1" />
            <div className="w-4/5 h-3 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

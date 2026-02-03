'use client'

import { Component, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-red-200 dark:border-red-900 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Icon name="error" className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            콘텐츠를 불러오는 중 문제가 발생했습니다.
          </p>
          {this.state.error && (
            <details className="mb-4 text-left">
              <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-600">
                오류 상세 정보
              </summary>
              <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded text-xs overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

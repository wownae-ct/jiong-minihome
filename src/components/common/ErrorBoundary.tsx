'use client'

import { Component, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  /**
   * 이 prop이 변경되면 에러 상태가 자동으로 리셋된다.
   * 보통 부모에서 라우트/탭 키를 넘겨 "다른 화면으로 이동했으니 에러 초기화" 시맨틱으로 사용.
   */
  resetKey?: string | number | null
}

interface State {
  hasError: boolean
  error: Error | null
  /** 현재 state가 반영하는 resetKey 값 (getDerivedStateFromProps로 추적) */
  lastResetKey: Props['resetKey']
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, lastResetKey: props.resetKey }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  /**
   * resetKey prop이 변경되면 render 전에 에러 상태를 자동 리셋한다.
   * componentDidUpdate 방식은 두 번의 render 사이클이 필요하므로
   * getDerivedStateFromProps로 한 번에 처리.
   */
  static getDerivedStateFromProps(
    props: Props,
    state: State
  ): Partial<State> | null {
    if (props.resetKey !== state.lastResetKey) {
      return {
        hasError: false,
        error: null,
        lastResetKey: props.resetKey,
      }
    }
    return null
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

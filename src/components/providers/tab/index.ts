/**
 * Tab/Navigation state management public API.
 *
 * 새 코드는 세분화 훅 사용을 권장 — 리렌더링 범위가 최소화됨.
 * 기존 코드는 `useTab()` composite 훅으로 backwards-compat 유지.
 */

export { TabProvider } from './TabProvider'
export { useTab, type TabContextType } from './useTab'
export { useNavigation, type TabId, type NavigationContextType } from './NavigationContext'
export { usePortfolioView, type PortfolioViewContextType } from './PortfolioViewContext'
export { useCommunityView, type CommunityViewContextType } from './CommunityViewContext'
export { useWelcomeView, type WelcomeViewContextType } from './WelcomeViewContext'

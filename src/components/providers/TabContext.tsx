/**
 * Backwards-compat re-export.
 *
 * 실제 구현은 `./tab/`의 sub-context로 분리되었다.
 * 새 코드는 세분화 훅 사용을 권장한다:
 *   import { useNavigation } from '@/components/providers/tab'
 */

export {
  TabProvider,
  useTab,
  useNavigation,
  usePortfolioView,
  useCommunityView,
  useWelcomeView,
  type TabId,
  type TabContextType,
} from './tab'

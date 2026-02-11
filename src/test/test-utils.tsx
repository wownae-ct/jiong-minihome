import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { TabProvider, TabId } from '@/components/providers/TabContext'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTab?: TabId
}

function customRender(
  ui: React.ReactElement,
  { initialTab, ...options }: CustomRenderOptions = {}
) {
  const queryClient = createTestQueryClient()
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <SessionProvider session={null}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <TabProvider initialTab={initialTab}>
              {children}
            </TabProvider>
          </ToastProvider>
        </QueryClientProvider>
      </SessionProvider>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
export { customRender as render }

import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { TabProvider, TabId } from '@/components/providers/TabContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

interface AllProvidersProps {
  children: ReactNode
  initialTab?: TabId
}

function AllProviders({ children, initialTab = 'intro' }: AllProvidersProps) {
  return (
    <SessionProvider session={null}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TabProvider initialTab={initialTab}>
            {children}
          </TabProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTab?: TabId
}

function customRender(
  ui: React.ReactElement,
  { initialTab, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialTab={initialTab}>{children}</AllProviders>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
export { customRender as render }

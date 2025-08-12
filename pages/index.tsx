import dynamic from 'next/dynamic'
import { WagmiConfig, WagmiProvider } from 'wagmi'
import { config } from '../config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'

// Disable SSR for PaymasterTransfer component
const PaymasterTransfer = dynamic(
  () => import('../components/PaymasterTransfer').then(mod => mod.PaymasterTransfer),
  { ssr: false }
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

export default function Home() {
  return (
    <WagmiProvider config={config}>

     <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>
                    <div className="min-h-screen bg-gray-100 py-12">
                        <div className="container mx-auto">
                            <h1 className="text-3xl font-bold text-center mb-8">USDC Transfer with Paymaster</h1>
                            <PaymasterTransfer />
                        </div>
                    </div>
            
        </ConnectKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
  )
}


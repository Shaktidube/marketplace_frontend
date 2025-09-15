import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient , QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux';
import store from './redux/store.js'

import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from 'wagmi/chains'


const projectId = import.meta.env.VITE_PROJECT_ID;

const networks = [sepolia, mainnet];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  features: {
    email: false,
    socials: false,
  },
  allowUnsupportedChain:false,
  allWallets:"HIDE",
})

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
              <Toaster/>
            </BrowserRouter>
          </QueryClientProvider>
        </Provider>
    </WagmiProvider>
  </StrictMode>,
);

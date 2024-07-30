// src/App.js
import React from 'react'
import { store } from './store'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import Game from './components/Game'
import './App.css'
import { sepolia } from 'viem/chains'

const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http()
  }
})

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <div className="App">
            <Game />
          </div>
        </Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

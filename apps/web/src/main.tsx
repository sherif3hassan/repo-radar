import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import { App } from './App'
import { Providers } from './app/Providers'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found in index.html')

createRoot(container).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Providers>
  </StrictMode>,
)

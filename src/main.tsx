import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GameProvider, AudioProvider, LifelineProvider, RivalProvider } from './contexts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioProvider>
      <GameProvider>
        <LifelineProvider>
          <RivalProvider>
            <App />
          </RivalProvider>
        </LifelineProvider>
      </GameProvider>
    </AudioProvider>
  </StrictMode>,
)

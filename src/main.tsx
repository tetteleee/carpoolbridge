import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Service Workerを登録する。registerType: 'autoUpdate'（vite.config.ts）により、
// 新しいバージョンが検知され次第バックグラウンドで自動更新される。
// ref: docs/11_PWA化設計.md#7
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { SpaApp } from '@/spa/app'

export function mountSpaApp(target: HTMLElement) {
  const root = createRoot(target)
  root.render(
    <StrictMode>
      <SpaApp />
    </StrictMode>,
  )
}

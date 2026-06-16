import React, { Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LoadingScreen } from '@/components/LoadingScreen'
import type { AdminSettings } from '@/lib/types'

const MinimalBarLoader = React.lazy(() => import('@/components/MinimalBarLoader'))
const GlitchDecodeLoader = React.lazy(() => import('@/components/GlitchDecodeLoader'))

interface ActiveLoaderProps {
  active: boolean
  loaderType: string
  onLoadComplete: () => void
  precacheUrls: string[]
  mode: 'timed' | 'real'
  duration: number
  loaderTexts: AdminSettings['loader']
}

export function ActiveLoader({ active, loaderType, onLoadComplete, precacheUrls, mode, duration, loaderTexts }: ActiveLoaderProps) {
  return (
    <AnimatePresence>
      {active && (() => {
        if (loaderType === 'none') return null
        if (loaderType === 'minimal-bar') {
          return (
            <Suspense key="minimal-bar" fallback={null}>
              <MinimalBarLoader
                onLoadComplete={onLoadComplete}
                precacheUrls={precacheUrls}
                mode={mode}
                duration={duration}
                loaderTexts={loaderTexts}
              />
            </Suspense>
          )
        }
        if (loaderType === 'glitch-decode') {
          return (
            <Suspense key="glitch-decode" fallback={null}>
              <GlitchDecodeLoader
                onLoadComplete={onLoadComplete}
                precacheUrls={precacheUrls}
                mode={mode}
                duration={duration}
                loaderTexts={loaderTexts}
              />
            </Suspense>
          )
        }
        return (
          <LoadingScreen
            key="cyberpunk"
            onLoadComplete={onLoadComplete}
            precacheUrls={precacheUrls}
            loaderTexts={loaderTexts}
            mode={mode}
            duration={duration}
          />
        )
      })()}
    </AnimatePresence>
  )
}

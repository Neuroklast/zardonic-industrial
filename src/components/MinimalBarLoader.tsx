import { motion } from 'framer-motion'
import { memo } from 'react'
import type React from 'react'
import type { LoaderTexts, LoadingScreenMode } from '@/lib/types'
import { useLoaderProgress } from '@/hooks/use-loader-progress'

interface MinimalBarLoaderProps {
  onLoadComplete: () => void
  precacheUrls?: string[]
  loaderTexts?: LoaderTexts
  mode?: LoadingScreenMode
  duration?: number
}

const MinimalBarLoader = memo(function MinimalBarLoader({
  onLoadComplete,
  precacheUrls = [],
  loaderTexts,
  mode = 'real',
  duration = 3,
}: MinimalBarLoaderProps) {
  const { progress } = useLoaderProgress({ precacheUrls, mode, duration, onLoadComplete, completeDelay: 600 })

  const label = loaderTexts?.titleLabel ?? 'LOADING'

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden"
      style={{ zIndex: 'var(--z-system)' } as React.CSSProperties}
    >
      <div className="w-full max-w-sm px-8 space-y-6">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="font-mono text-xs text-primary uppercase tracking-[0.3em] text-center"
        >
          {label}
        </motion.div>

        <div className="relative h-px bg-border/30">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="absolute inset-y-[-1px] bg-primary/50 blur-sm"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>0x0000</span>
          <span className="text-primary">{Math.floor(progress)}%</span>
          <span>0xFFFF</span>
        </div>
      </div>
    </motion.div>
  )
})

export default MinimalBarLoader

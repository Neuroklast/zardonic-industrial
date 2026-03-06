import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  onLoadComplete: () => void
  precacheUrls?: string[]
}

const LOADING_TEXTS = [
  '> ACCESSING PROFILE...',
  '> DECRYPTING DATA...',
  '> IDENTITY VERIFIED',
]

export default function LoadingScreen({ onLoadComplete, precacheUrls = [] }: LoadingScreenProps) {
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let textIdx = 0
    const textInterval = setInterval(() => {
      textIdx += 1
      if (textIdx < LOADING_TEXTS.length) {
        setLoadingText(LOADING_TEXTS[textIdx])
      }
    }, 500)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          clearInterval(textInterval)
          setTimeout(() => onLoadComplete(), 200)
          return 100
        }
        return prev + 2
      })
    }, 30)

    return () => {
      clearInterval(textInterval)
      clearInterval(progressInterval)
    }
  }, [onLoadComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
    >
      <div className="zardonic-theme-crt-overlay" />
      <div className="zardonic-theme-crt-vignette" />
      <div className="zardonic-theme-full-page-noise" />

      <div className="relative z-10 w-full max-w-md px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="zardonic-theme-data-label mb-4">// SYSTEM.BOOT.SEQUENCE</div>

          <motion.div
            className="font-mono text-primary text-lg"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {loadingText}
          </motion.div>

          <div className="h-1 bg-border/30 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-primary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 0.1 }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="flex gap-2 font-mono text-xs text-muted-foreground">
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}>▸</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}>▸</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}>▸</motion.span>
            <span className="ml-2">LOADING MODULES [{progress}%]</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

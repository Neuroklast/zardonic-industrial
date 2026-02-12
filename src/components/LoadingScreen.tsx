import { motion } from 'framer-motion'
import loadingVideo from '@/assets/video/videoExport-2025-09-27@08-32-14.352-2160x2160@60fps.mp4'

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
    >
      <div className="full-page-noise" />
      <div className="scanline-effect absolute inset-0" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md w-full px-8"
      >
        <video
          autoPlay
          muted
          playsInline
          onEnded={onLoadComplete}
          className="w-full h-auto"
        >
          <source src={loadingVideo} type="video/mp4" />
        </video>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-primary font-mono text-sm uppercase tracking-widest animate-pulse">
            // INITIALIZING SYSTEM...
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

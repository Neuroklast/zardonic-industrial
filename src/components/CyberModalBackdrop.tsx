import { ReactNode } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Shared backdrop for all custom (non-Radix) cyber-style modal overlays.
 *
 * Architecture contract:
 *  - The backdrop is `overflow-y-auto` so the inner panel can never be
 *    clipped or pushed off-screen, regardless of viewport height.
 *  - The inner flex wrapper uses `items-center` + `min-h-full` so the panel
 *    is vertically centered and the backdrop scrolls around it.
 *  - Children are responsible only for the panel itself (motion.div with
 *    its own entry/exit animation, max-width, flex-col layout, etc.).
 *
 * Usage:
 *   <CyberModalBackdrop open={open}>
 *     <motion.div className="w-full max-w-5xl flex flex-col …">…</motion.div>
 *   </CyberModalBackdrop>
 */
interface CyberModalBackdropProps {
  open: boolean
  children: ReactNode
  /**
   * CSS z-index value (CSS custom property string or number).
   * Defaults to `var(--z-overlay)` — use `var(--z-system)` for UI that must
   * sit above regular overlays (e.g. system-level dialogs).
   */
  zIndexStyle?: React.CSSProperties['zIndex']
  /** Tailwind background + backdrop classes. Defaults to "bg-black/95 backdrop-blur-md". */
  bgClass?: string
}

export default function CyberModalBackdrop({
  open,
  children,
  zIndexStyle = 'var(--z-overlay)',
  bgClass = 'bg-black/95 backdrop-blur-md',
}: CyberModalBackdropProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 ${bgClass} overflow-y-auto`}
          style={{ zIndex: zIndexStyle, boxShadow: 'inset 0 0 80px var(--modal-glow-color, transparent)' } as React.CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="min-h-full flex items-center justify-center p-4 md:p-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

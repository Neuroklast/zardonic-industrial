import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { List, X, Pencil } from '@phosphor-icons/react'
import { useState } from 'react'

interface NavigationProps {
  artistName: string
  logoUrl?: string
  editMode?: boolean
  isOwner?: boolean
  showLoginButton?: boolean
  onNavigate: (section: string) => void
  onEditClick?: () => void
  onLoginClick?: () => void
  onArtistNameChange?: (name: string) => void
}

export default function Navigation({
  artistName,
  logoUrl,
  editMode = false,
  isOwner = false,
  showLoginButton = false,
  onNavigate,
  onEditClick,
  onLoginClick,
  onArtistNameChange
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const sections = ['bio', 'music', 'gigs', 'releases', 'gallery', 'connect']

  const handleNavigate = (section: string) => {
    setMobileMenuOpen(false)
    setTimeout(() => onNavigate(section), 100)
  }

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-sm border-b border-border zardonic-theme-scanline-effect"
      style={{ position: 'fixed', top: 0 }}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground uppercase"
          whileHover={{ filter: 'drop-shadow(2px 0 0 rgba(255,0,100,0.3)) drop-shadow(-2px 0 0 rgba(0,255,255,0.3))' }}
        >
          {editMode ? (
            <Input
              value={artistName}
              onChange={(e) => onArtistNameChange?.(e.target.value)}
              className="w-48 bg-transparent border-border text-foreground"
            />
          ) : (
            <img 
              src={logoUrl}
              alt={artistName}
              className="h-10 md:h-12 w-auto object-contain zardonic-theme-logo-glitch brightness-110 zardonic-theme-hover-chromatic-image"
            />
          )}
        </motion.div>

        <div className="hidden md:flex items-center gap-6">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => onNavigate(section)}
              className="text-sm uppercase tracking-wide hover:text-primary transition-colors font-mono zardonic-theme-hover-chromatic zardonic-theme-hover-glitch"
            >
              {section}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isOwner && onEditClick && (
            <Button
              size="sm"
              variant={editMode ? 'default' : 'outline'}
              onClick={onEditClick}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {showLoginButton && onLoginClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLoginClick}
            >
              Login
            </Button>
          )}
          
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-card/95 border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => handleNavigate(section)}
                  className="text-left text-sm uppercase tracking-wide hover:text-primary transition-colors font-mono"
                >
                  {section}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

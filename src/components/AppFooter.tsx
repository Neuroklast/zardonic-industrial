import React from 'react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Lock } from '@phosphor-icons/react'
import { CookiePreferencesButton } from '@/components/CookieConsent'

interface AppFooterProps {
  artistName: string
  isOwner: boolean
  hasPassword: boolean
  setShowLoginDialog: (v: boolean) => void
  setShowSetupDialog: (v: boolean) => void
  setCyberpunkOverlay: (overlay: { type: 'contact' } | null) => void
}

export default function AppFooter({
  artistName,
  isOwner,
  hasPassword,
  setShowLoginDialog,
  setShowSetupDialog,
  setCyberpunkOverlay,
}: AppFooterProps) {
  return (
    <footer className="py-section px-card border-t border-border noise-effect" data-theme-color="border muted-foreground">
      <div className="container mx-auto text-center space-y-4">
        <div className="flex justify-center gap-4 sm:gap-6 flex-wrap">
          <a
            href="/legal-notice"
            className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide font-mono hover-chromatic min-h-[44px] inline-flex items-center px-1"
          >
            Legal Notice
          </a>
          <a
            href="/privacy-policy"
            className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide font-mono hover-chromatic min-h-[44px] inline-flex items-center px-1"
          >
            Privacy Policy
          </a>
          <button
            type="button"
            onClick={() => setCyberpunkOverlay({ type: 'contact' })}
            className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide font-mono hover-chromatic cursor-pointer min-h-[44px] inline-flex items-center px-1"
          >
            Contact
          </button>
          <CookiePreferencesButton privacyPolicyUrl="/privacy-policy" />
          {!isOwner && (
            <button
              type="button"
              onClick={() => hasPassword ? setShowLoginDialog(true) : setShowSetupDialog(true)}
              className="text-sm text-muted-foreground/40 hover:text-primary/60 transition-colors font-mono cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              title="Admin"
              aria-label="Admin login"
            >
              <Lock size={14} />
            </button>
          )}
          <LanguageSwitcher />
        </div>
        <p className="text-sm text-muted-foreground uppercase tracking-wide font-mono hover-chromatic">
          © {new Date().getFullYear()} {artistName}
        </p>
      </div>
    </footer>
  )
}
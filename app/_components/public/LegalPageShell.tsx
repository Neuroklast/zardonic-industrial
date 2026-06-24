import { createClient } from '@/lib/supabaseServer'
import { DEFAULT_FOOTER_CONFIG, DEFAULT_LEGAL_CONFIG, loadLegalPageData } from '@/lib/legal-content'
import { PageLayout } from '@/layouts/PageLayout'
import { CookieConsent } from '@/components/CookieConsent'
import { GlobalEffects } from './GlobalEffects'
import { SiteNav } from './SiteNav'
import { buildNavLinksFromConfig } from '@/lib/nav-links'
import { SiteFooter } from './SiteFooter'
import { BackgroundStack } from './BackgroundStack'

interface LegalPageShellProps {
  children: React.ReactNode
}

export async function LegalPageShell({ children }: LegalPageShellProps) {
  let pageData = {
    legal: DEFAULT_LEGAL_CONFIG,
    footer: DEFAULT_FOOTER_CONFIG,
    appearance: {} as Record<string, unknown>,
    social: [] as Array<{ id: string; platform: string; url: string; label: string | null }>,
  }

  let navLinks = buildNavLinksFromConfig(null)

  try {
    const supabase = await createClient()
    pageData = await loadLegalPageData(supabase)
    const { data: sectionsRow } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'sections')
      .single()
    if (sectionsRow?.value) {
      navLinks = buildNavLinksFromConfig(sectionsRow.value)
    }
  } catch {
    // Safe defaults when Supabase is unavailable
  }

  const appearance = pageData.appearance
  const crtEnabled = typeof appearance.crtEnabled === 'boolean' ? appearance.crtEnabled : true
  const scanlineEnabled = typeof appearance.scanlineEnabled === 'boolean' ? appearance.scanlineEnabled : true
  const noiseEnabled = typeof appearance.noiseEnabled === 'boolean' ? appearance.noiseEnabled : true

  const privacyUrl = pageData.footer.privacyPolicyUrl

  return (
    <PageLayout
      backgroundLayers={
        <BackgroundStack backgroundType="minimal" imageOpacity={0.25} />
      }
      nav={<SiteNav links={navLinks} />}
      footer={
        <SiteFooter
          socialLinks={pageData.social}
          legalNoticeUrl={pageData.footer.legalNoticeUrl}
          privacyPolicyUrl={privacyUrl}
        />
      }
      globalEffects={
        <GlobalEffects
          crtEnabled={crtEnabled}
          scanlineEnabled={scanlineEnabled}
          noiseEnabled={noiseEnabled}
        />
      }
      system={
        <CookieConsent privacyPolicyUrl={privacyUrl} />
      }
    >
      {children}
    </PageLayout>
  )
}
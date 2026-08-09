import type { Metadata } from 'next'
import { Orbitron, Share_Tech_Mono, Space_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabaseServer'
import { getPublicSiteBootstrap } from '@/lib/site-config-bootstrap'
import { Providers } from './providers'
import './globals.css'

/**
 * Self-hosted at build time via next/font (CSS variables only).
 * Defaults live on :root / html so AppearanceBridge can override --font-body
 * etc. on documentElement without fighting body inline styles.
 */
const fontOrbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

const fontShareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-share-tech-mono',
  display: 'swap',
})

const fontSpaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const revalidate = 60

const DEFAULT_ICON = '/assets/images/meta_eyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ==.webp'

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl: string | undefined

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'appearance')
      .maybeSingle()

    faviconUrl = (data?.value as { faviconUrl?: string } | null)?.faviconUrl
  } catch {
    faviconUrl = undefined
  }

  return {
    title: 'Zardonic',
    description: 'Official website of Zardonic – industrial metal / drum & bass',
    icons: {
      icon: faviconUrl || DEFAULT_ICON,
    },
    openGraph: {
      title: 'Zardonic',
      description: 'Official website of Zardonic – industrial metal / drum & bass',
      type: 'website',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { customTranslations, analyticsConfig, languages } = await getPublicSiteBootstrap()

  return (
    <html
      lang="en"
      className={`${fontOrbitron.variable} ${fontShareTechMono.variable} ${fontSpaceMono.variable}`}
    >
      {/*
        Do NOT set --font-body/--font-heading as fixed stacks on <body> —
        that blocked Appearance → Body font (bio uses var(--font-body)).
        Defaults are in tokens.css; AppearanceBridge/applyAppearanceConfig override :root.
      */}
      <body className="font-public-root">
        <Providers customTranslations={customTranslations} analyticsConfig={analyticsConfig} languages={languages}>
          {children}
        </Providers>
      </body>
    </html>
  )
}

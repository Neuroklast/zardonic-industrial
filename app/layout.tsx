import type { Metadata } from 'next'
import { Orbitron, Share_Tech_Mono, Space_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabaseServer'
import { getPublicSiteBootstrap } from '@/lib/site-config-bootstrap'
import {
  buildPublicFontCssVars,
  googleFontsStylesheetHref,
  remoteFontFamiliesToLoad,
  resolvePublicFonts,
} from '@/lib/public-fonts'
import { Providers } from './providers'
import './globals.css'

/**
 * next/font only registers file variables for when Appearance selects them.
 * They are NOT forced as site body/heading — admin theme is source of truth.
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
  const { customTranslations, analyticsConfig, languages, appearance } =
    await getPublicSiteBootstrap()

  const fonts = resolvePublicFonts(appearance.theme)
  const fontCss = buildPublicFontCssVars(fonts)
  const remoteFonts = remoteFontFamiliesToLoad(fonts)

  return (
    <html
      lang="en"
      className={`${fontOrbitron.variable} ${fontShareTechMono.variable} ${fontSpaceMono.variable}`}
    >
      <head>
        {/* Admin-configured remote faces — only when theme requests them */}
        {remoteFonts.map((name) => (
          <link
            key={name}
            rel="stylesheet"
            href={googleFontsStylesheetHref(name)}
            data-zd-font={name}
          />
        ))}
        {/* SSR: apply Appearance fonts before paint (all routes, not only homepage) */}
        <style dangerouslySetInnerHTML={{ __html: fontCss }} />
      </head>
      <body className="font-public-root">
        <Providers
          customTranslations={customTranslations}
          analyticsConfig={analyticsConfig}
          languages={languages}
          appearance={appearance}
        >
          {children}
        </Providers>
      </body>
    </html>
  )
}

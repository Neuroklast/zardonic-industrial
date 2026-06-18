import type { Metadata } from 'next'
import { createClient } from '@/lib/supabaseServer'
import { Providers } from './providers'
import './globals.css'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

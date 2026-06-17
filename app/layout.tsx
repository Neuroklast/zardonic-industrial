import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zardonic',
  description: 'Official website of Zardonic – industrial metal / drum & bass',
  openGraph: {
    title: 'Zardonic',
    description: 'Official website of Zardonic – industrial metal / drum & bass',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Space Mono loaded at runtime – avoids build-time network requirement */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

/** @type {import('next').NextConfig} */

function r2PublicHostname() {
  const host = process.env.R2_PUBLIC_HOST
  if (!host) return null
  try {
    return new URL(host.startsWith('http') ? host : `https://${host}`).hostname
  } catch {
    return null
  }
}

const r2Hostname = r2PublicHostname()

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://open.spotify.com https://embed-cdn.spotifycdn.com https://www.youtube.com https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "frame-src https://open.spotify.com https://www.youtube.com https://youtube.com https://music.youtube.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://api.spotify.com https://open.spotify.com https://spclient.wg.spotify.com https://api.song.link https://rest.bandsintown.com https://itunes.apple.com https://wsrv.nl https://vercel.com https://*.public.blob.vercel-storage.com https://*.supabase.co wss://*.supabase.co",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      ...(r2Hostname ? [{ protocol: /** @type {'https'} */ ('https'), hostname: r2Hostname }] : []),
    ],
  },
}

export default nextConfig

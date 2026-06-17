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

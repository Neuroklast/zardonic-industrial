/** Extract a YouTube video ID from various URL formats or a plain ID. */
export function extractYouTubeId(input: string): string | null {
  // Already a plain ID
  if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim()
  try {
    const url = new URL(input)
    // youtu.be/VIDEO_ID
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null
    // youtube.com/watch?v=VIDEO_ID
    const v = url.searchParams.get('v')
    if (v) return v
    // youtube.com/embed/VIDEO_ID
    const embedMatch = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/)
    if (embedMatch) return embedMatch[1]
  } catch {
    // Not a valid URL
  }
  // Regex fallback
  const m = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

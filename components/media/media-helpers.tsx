/* eslint-disable react-refresh/only-export-components */
import { motion } from 'framer-motion'
import { DownloadSimple, File, MusicNote, YoutubeLogo } from '@phosphor-icons/react'
import type { MediaFile } from '@/lib/types'

export function isDriveUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'drive.google.com'
  } catch {
    return false
  }
}

export function toDriveDirectDownload(url: string): string {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.hostname !== 'drive.google.com') return url
    if (parsedUrl.pathname === '/uc') return url
    const fileMatch = parsedUrl.pathname.match(/^\/file\/d\/([^/]+)/)
    if (fileMatch) return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`
    const id = parsedUrl.searchParams.get('id')
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`
  } catch {
    // fallback
  }
  return url
}

export function getDownloadHref(url: string): string {
  return isDriveUrl(url) ? toDriveDirectDownload(url) : url
}

export function HudCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const classes: Record<string, string> = {
    tl: 'top-0 left-0 border-t-2 border-l-2',
    tr: 'top-0 right-0 border-t-2 border-r-2',
    bl: 'bottom-0 left-0 border-b-2 border-l-2',
    br: 'bottom-0 right-0 border-b-2 border-r-2',
  }
  return <span className={`absolute w-3 h-3 border-accent/60 ${classes[pos]}`} />
}

export function FileTypeIcon({ type }: { type?: string }) {
  if (type === 'audio') return <MusicNote className="w-5 h-5 text-accent/70" />
  if (type === 'youtube') return <YoutubeLogo className="w-5 h-5 text-red-500/70" />
  return <File className="w-5 h-5 text-accent/70" />
}

export function isYoutubeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be'
  } catch {
    return false
  }
}

export function FileCard({ file, onClick }: { file: MediaFile; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative w-full text-left border border-border/40 bg-background/30 hover:border-primary/50 hover:bg-primary/5 transition-all p-4 font-mono"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <HudCorner pos="tl" />
      <HudCorner pos="br" />
      <div className="flex items-start gap-3">
        <FileTypeIcon type={file.type} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold tracking-wide uppercase truncate group-hover:text-primary transition-colors">
            {file.name}
          </div>
          {file.description && <div className="text-xs text-foreground/40 truncate mt-0.5">{file.description}</div>}
          {file.folder && <div className="text-[10px] text-accent/50 mt-1">{file.folder}</div>}
        </div>
        <DownloadSimple className="w-4 h-4 text-accent/40 group-hover:text-accent transition-colors shrink-0 mt-0.5" />
      </div>
    </motion.button>
  )
}

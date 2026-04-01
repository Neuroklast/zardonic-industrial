/**
 * ImageUploader — drag & drop image upload component.
 */

import { useRef, useState } from 'react'
import { useMediaUpload } from '../hooks/useMediaUpload'

interface Props {
  folder?: string
  onUploaded: (url: string, thumbnailUrl?: string) => void
}

export function ImageUploader({ folder = 'general', onUploaded }: Props) {
  const { upload, status, error } = useMediaUpload()
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    const result = await upload(file, folder)
    if (result) onUploaded(result.url, result.thumbnailUrl)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); void handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-red-500 bg-red-950/20' : 'border-zinc-600 hover:border-zinc-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { void handleFiles(e.target.files) }}
      />
      {status === 'uploading' ? (
        <span className="text-zinc-400 font-mono text-sm">Lädt hoch…</span>
      ) : (
        <span className="text-zinc-500 font-mono text-sm">
          Bild hierher ziehen oder klicken
        </span>
      )}
      {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
    </div>
  )
}

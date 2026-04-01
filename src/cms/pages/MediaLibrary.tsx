/**
 * MediaLibrary — browse, upload, and manage media files.
 */

import { useState, useCallback } from 'react'
import { CmsTopBar } from '../components/CmsTopBar'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useMediaUpload } from '../hooks/useMediaUpload'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { toast } from 'sonner'

type Folder = 'general' | 'covers' | 'flyers' | 'press' | 'members'
const FOLDERS: Folder[] = ['general', 'covers', 'flyers', 'press', 'members']

interface MediaFile {
  id: string
  originalName: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  size: number
  alt?: string
  folder: string
  createdAt: string
}

async function fetchMedia(folder?: string): Promise<MediaFile[]> {
  const url = folder ? `/api/cms/media?folder=${folder}` : '/api/cms/media'
  const r = await fetch(url)
  return r.json() as Promise<MediaFile[]>
}

async function deleteMedia(id: string): Promise<void> {
  await fetch(`/api/cms/media?id=${id}`, { method: 'DELETE' })
}

export function MediaLibrary() {
  const qc = useQueryClient()
  const [folder, setFolder] = useState<Folder | 'all'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { upload, status: uploadStatus } = useMediaUpload()

  const { data, isLoading } = useQuery({
    queryKey: ['cms', 'media', folder],
    queryFn: () => fetchMedia(folder === 'all' ? undefined : folder),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'media'] }); toast.success('Datei gelöscht') },
    onError: () => toast.error('Fehler beim Löschen'),
  })

  const files = data ?? []

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const targetFolder: Folder = folder === 'all' ? 'general' : folder
    const result = await upload(file, targetFolder)
    if (result) {
      void qc.invalidateQueries({ queryKey: ['cms', 'media'] })
      toast.success('Upload erfolgreich')
    }
  }, [folder, upload, qc])

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url)
    toast.success('URL kopiert')
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar title="Media Library" breadcrumbs={['CMS', 'Media']} />
      <div className="p-6">
        {/* Folder filter */}
        <div className="flex gap-2 mb-6">
          {['all', ...FOLDERS].map(f => (
            <button
              key={f}
              onClick={() => setFolder(f as Folder | 'all')}
              className={`px-3 py-1 text-xs font-mono border transition-colors ${
                folder === f ? 'border-red-600 text-red-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { void handleDrop(e) }}
          className={`border-2 border-dashed p-8 text-center mb-6 transition-colors ${isDragging ? 'border-red-500 bg-red-950/10' : 'border-zinc-700'}`}
        >
          <p className="text-zinc-500 font-mono text-sm">
            {uploadStatus === 'uploading' ? 'Lädt hoch…' : 'Dateien hierher ziehen zum Hochladen'}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-zinc-500 font-mono text-sm">Lädt…</div>
        ) : files.length === 0 ? (
          <div className="text-zinc-500 font-mono text-sm">Keine Dateien in diesem Ordner.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {files.map(file => (
              <div key={file.id} className="group relative border border-zinc-800 bg-[#111] hover:border-zinc-600 transition-colors">
                <div className="aspect-square overflow-hidden">
                  {file.thumbnailUrl || file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.thumbnailUrl ?? file.url}
                      alt={file.alt ?? file.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
                      {file.mimeType.split('/')[1]}
                    </div>
                  )}
                </div>
                <div className="p-1.5">
                  <p className="text-xs font-mono text-zinc-500 truncate">{file.originalName}</p>
                  <p className="text-xs font-mono text-zinc-700">{formatSize(file.size)}</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(file.url)} className="px-2 py-1 text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-600 hover:border-white">
                    COPY
                  </button>
                  <button onClick={() => setDeleteId(file.id)} className="px-2 py-1 text-xs font-mono bg-red-950 text-red-400 border border-red-800 hover:border-red-500">
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Datei löschen"
        description="Diese Datei wird dauerhaft aus dem Blob-Speicher entfernt."
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null) } }}
      />
    </div>
  )
}

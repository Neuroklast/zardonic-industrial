'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileSourcePicker } from '@/app/admin/_components/FileSourcePicker'
import { createMediaDownload } from '@/app/admin/_actions/mediaDownloads'
import { MEDIA_CATEGORIES } from '@/lib/media-download'

export default function NewMediaDownloadPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [storagePath, setStoragePath] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileMime, setFileMime] = useState('')
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [originalFilename, setOriginalFilename] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!storagePath) {
      setError('Please upload a file first')
      return
    }
    setSaving(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    formData.set('file_storage_path', storagePath)
    formData.set('file_url', fileUrl.startsWith('http') ? fileUrl : '')
    formData.set('file_mime', fileMime)
    formData.set('original_filename', originalFilename)
    if (fileSize != null) formData.set('file_size_bytes', String(fileSize))
    const result = await createMediaDownload(formData)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/media')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Upload Media File</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FileSourcePicker
          label="File"
          storagePrefix="media-downloads"
          onResolved={(result) => {
            setStoragePath(result.storagePath)
            setFileUrl(result.publicUrl ?? '')
            setFileMime(result.mime)
            setFileSize(result.sizeBytes)
            setOriginalFilename(result.originalFilename)
            setError(null)
          }}
          onError={setError}
        />
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Title</label>
          <input
            name="title"
            required
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Description (optional)</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Category</label>
          <select
            name="category"
            defaultValue="other"
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          >
            {MEDIA_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Display Order</label>
          <input
            name="display_order"
            type="number"
            defaultValue={0}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        {error ? <p className="text-red-400 text-sm">{error}</p> : null}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

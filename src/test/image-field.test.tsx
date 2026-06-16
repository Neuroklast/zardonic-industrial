import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ImageField } from '@/cms/components/fields/ImageField'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const mockUpload = vi.fn()
const mockImportFromUrl = vi.fn()

vi.mock('@/cms/hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    upload: mockUpload,
    isUploading: false,
    progress: 0,
  }),
}))

vi.mock('@/cms/hooks/useRemoteImageImport', () => ({
  useRemoteImageImport: () => ({
    importFromUrl: mockImportFromUrl,
    isImporting: false,
  }),
}))

const fieldDef: AdminFieldDefinition = {
  key: 'url',
  type: 'image',
  label: 'Image URL',
}

describe('ImageField', () => {
  it('auto-imports remote URLs on blur', async () => {
    const onChange = vi.fn()
    mockImportFromUrl.mockResolvedValueOnce({
      url: 'https://public.blob.vercel-storage.com/photo.png',
      fileName: 'photo.png',
      mimeType: 'image/png',
      size: 123,
    })

    render(
      <ImageField
        fieldDef={fieldDef}
        value="https://images.example.com/photo.png"
        onChange={onChange}
      />,
    )

    fireEvent.blur(screen.getByLabelText('Image URL'))

    await waitFor(() => {
      expect(mockImportFromUrl).toHaveBeenCalledWith('https://images.example.com/photo.png')
      expect(onChange).toHaveBeenCalledWith('https://public.blob.vercel-storage.com/photo.png')
    })
  })

  it('renders an upload control', () => {
    render(
      <ImageField
        fieldDef={fieldDef}
        value=""
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /upload image url/i })).toBeInTheDocument()
  })
})

/**
 * ImageField
 *
 * Controlled image URL input with inline thumbnail preview for admin image fields.
 */

import { useCallback, useRef } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'
import { useImageUpload } from '@/cms/hooks/useImageUpload'
import { useRemoteImageImport } from '@/cms/hooks/useRemoteImageImport'
import { isHttpUrl, isVercelBlobUrl } from '@/lib/blob-url'

const BASE_INPUT =
  'w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 disabled:opacity-50'

export interface ImageFieldProps {
  fieldDef: AdminFieldDefinition
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

/** Image URL field with inline thumbnail preview. */
export function ImageField({ fieldDef, value, onChange, error, disabled, className }: ImageFieldProps) {
  const id = `field-${fieldDef.key}`
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { upload, isUploading, progress } = useImageUpload()
  const { importFromUrl, isImporting } = useRemoteImageImport()

  const handleImportOnBlur = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || !isHttpUrl(trimmed) || isVercelBlobUrl(trimmed) || disabled || isImporting) {
      return
    }

    const imported = await importFromUrl(trimmed)
    if (imported?.url) onChange(imported.url)
  }, [disabled, importFromUrl, isImporting, onChange, value])

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = await upload(file)
    if (result?.url) onChange(result.url)
    event.target.value = ''
  }, [onChange, upload])

  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <input
            id={id}
            type="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => void handleImportOnBlur()}
            placeholder={fieldDef.placeholder ?? 'https://...'}
            disabled={disabled}
            className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
            aria-label={fieldDef.label}
            aria-invalid={Boolean(error)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFileChange(event)}
            aria-label={`Upload ${fieldDef.label}`}
          />
          <button
            type="button"
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded border border-zinc-700 px-2 text-[10px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || isImporting}
            aria-label={`Upload ${fieldDef.label}`}
          >
            <UploadSimple size={12} />
            {isUploading ? `${progress}%` : 'Upload'}
          </button>
        </div>
        <p className="text-[10px] font-mono text-zinc-500">
          External image URLs are automatically imported to Vercel Blob when the field loses focus.
        </p>
      </div>
      {value && (
        <div className="mt-1">
          <img
            src={value}
            alt="Preview"
            className="h-16 w-auto rounded border border-zinc-700 object-cover"
            onError={e => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </FieldWrapper>
  )
}

export default ImageField

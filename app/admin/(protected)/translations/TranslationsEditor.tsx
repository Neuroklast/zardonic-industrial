'use client'

import { useRef } from 'react'
import { FloppyDisk } from '@phosphor-icons/react'

interface TranslationsEditorProps {
  strings: Record<string, { de: string; en: string }>
  defaultStrings: Record<string, { de: string; en: string }>
  onSave: (formData: FormData) => Promise<void>
}

export default function TranslationsEditor({ strings, defaultStrings, onSave }: TranslationsEditorProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={onSave}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr] text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 px-4 py-2">
          <span>Key</span>
          <span>English</span>
          <span>Deutsch</span>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {Object.entries(strings).map(([key, values]) => (
            <div key={key} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 px-4 py-2">
              <code className="font-mono text-xs text-zinc-400 truncate" title={key}>{key}</code>
              <input
                type="text"
                name={`${key}.en`}
                defaultValue={values.en}
                placeholder={defaultStrings[key]?.en ?? ''}
                aria-label={`${key} English`}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 w-full"
              />
              <input
                type="text"
                name={`${key}.de`}
                defaultValue={values.de}
                placeholder={defaultStrings[key]?.de ?? ''}
                aria-label={`${key} Deutsch`}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded font-medium transition-colors"
        >
          <FloppyDisk className="h-4 w-4" aria-hidden="true" />
          Save Translations
        </button>
      </div>
    </form>
  )
}

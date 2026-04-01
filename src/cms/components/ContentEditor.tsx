/**
 * ContentEditor — Tiptap rich text editor with toolbar.
 * OWASP A03:2021 — DOMPurify sanitizes HTML output to prevent XSS when rendering.
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function ContentEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Youtube.configure({ controls: false }),
      Placeholder.configure({ placeholder: placeholder ?? 'Inhalt eingeben…' }),
    ],
    content,
    onUpdate({ editor: e }) {
      onChange(e.getHTML())
    },
  })

  // Sync external content changes (e.g., load from API)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  if (!editor) return null

  const toolbarBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      type="button"
      className={`px-2 py-1 text-xs font-mono border transition-colors ${
        active ? 'border-red-600 text-red-400 bg-red-950' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
      }`}
    >
      {label}
    </button>
  )

  function setLink() {
    const url = window.prompt('URL eingeben:', editor?.getAttributes('link').href as string ?? '')
    if (url === null) return
    if (url === '') {
      editor?.chain().focus().unsetLink().run()
      return
    }
    editor?.chain().focus().setLink({ href: url }).run()
  }

  function addYoutube() {
    const url = window.prompt('YouTube URL eingeben:')
    if (!url) return
    editor?.commands.setYoutubeVideo({ src: url })
  }

  return (
    <div className="border border-zinc-700 bg-[#0d0d0d]">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-700">
        {toolbarBtn('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
        {toolbarBtn('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
        {toolbarBtn('~~', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run())}
        {toolbarBtn('H1', editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        {toolbarBtn('H2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        {toolbarBtn('H3', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        {toolbarBtn('UL', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
        {toolbarBtn('OL', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
        {toolbarBtn('Link', editor.isActive('link'), () => setLink())}
        {toolbarBtn('YT', false, () => addYoutube())}
        {toolbarBtn('Code', editor.isActive('code'), () => editor.chain().focus().toggleCode().run())}
        {toolbarBtn('Block', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run())}
      </div>
      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none p-4 min-h-48 text-zinc-200 text-sm focus:outline-none [&_.ProseMirror]:outline-none"
      />
    </div>
  )
}

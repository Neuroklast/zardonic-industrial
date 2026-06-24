'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Question } from '@phosphor-icons/react'
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { ADMIN_HELP_GROUPS } from '@/lib/admin-help-index'
import { getAdminHelpShortcutLabel } from '@/lib/admin-help-shortcut'
import { groupAdminHelpResults, searchAdminHelp } from '@/lib/admin-help-search'

const ADMIN_HELP_OPEN_EVENT = 'zardonic-admin-help-open'

export function openAdminHelp(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ADMIN_HELP_OPEN_EVENT))
}

export function AdminHelpPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchAdminHelp(query), [query])
  const grouped = useMemo(
    () => groupAdminHelpResults(results, ADMIN_HELP_GROUPS),
    [results]
  )

  const shortcutLabel = getAdminHelpShortcutLabel()

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      router.push(href)
    },
    [router]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(ADMIN_HELP_OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(ADMIN_HELP_OPEN_EVENT, onOpen)
    }
  }, [])

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
      shouldFilter={false}
      adminUi
      className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-xl"
      title="Admin Help & Quick Search"
      description="Search admin functions, settings and how-to guides"
    >
      <div data-admin-ui="true" className="bg-zinc-900 text-zinc-100">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search functions, settings, how-to…"
          className="text-zinc-100 placeholder:text-zinc-500"
        />
        <CommandList className="max-h-[min(60vh,420px)]">
          {grouped.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No matching functions or help topics.
            </div>
          ) : null}
          {grouped.map(({ group, items }) => (
            <CommandGroup
              key={group}
              heading={group}
              className="[&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[10px]"
            >
              {items.map(({ entry }) => (
                <CommandItem
                  key={entry.id}
                  value={entry.id}
                  onSelect={() => navigate(entry.href)}
                  className="flex flex-col items-start gap-0.5 rounded-md px-3 py-2.5 cursor-pointer data-[selected=true]:bg-red-900/30 data-[selected=true]:text-zinc-100 aria-selected:bg-red-900/30"
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm font-medium text-zinc-100">{entry.title}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed pr-6">
                    {entry.description}
                  </p>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Question className="h-3.5 w-3.5" aria-hidden="true" />
            Type a question or function name
          </span>
          <CommandShortcut className="text-zinc-500">{shortcutLabel}</CommandShortcut>
        </div>
      </div>
    </CommandDialog>
  )
}
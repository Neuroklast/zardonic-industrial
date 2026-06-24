'use client'

interface AdminAccordionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

/** Simple collapsible section — keeps long admin forms scannable. */
export function AdminAccordion({
  title,
  description,
  defaultOpen = false,
  children,
}: AdminAccordionProps) {
  return (
    <details
      open={defaultOpen || undefined}
      className="group border border-zinc-800 rounded overflow-hidden"
    >
      <summary className="cursor-pointer list-none px-4 py-3 bg-zinc-950/60 hover:bg-zinc-900/80 transition-colors [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-zinc-200">{title}</span>
            {description ? (
              <p className="text-xs text-zinc-500 mt-0.5 font-normal">{description}</p>
            ) : null}
          </div>
          <span
            className="text-zinc-500 text-xs shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </summary>
      <div className="px-4 py-4 space-y-4 border-t border-zinc-800">{children}</div>
    </details>
  )
}
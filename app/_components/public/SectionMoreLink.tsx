import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'

export function SectionMoreLink({ href, count }: { href: string; count: number }) {
  return (
    <div className="mt-8 flex justify-center">
      <Link
        href={href}
        className="cyber-border inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:text-primary"
        aria-label={`Show more, browse all ${count} items`}
      >
        Show More <span className="text-muted-foreground">({count})</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

import { ReactNode } from 'react'
import { toDirectImageUrl } from '@/lib/image-cache'

interface GridItem {
  id: string
  title: string
  imageUrl: string | null
  externalUrl?: string | null
}

interface SquareImageGridProps {
  items: GridItem[]
  footerText?: string
  footerUrl?: string
  className?: string
  children?: (item: GridItem) => ReactNode
}

function GridItemTile({
  item,
  children,
}: {
  item: GridItem
  children?: ReactNode
}) {
  const imageBlock = (
    <div className="relative aspect-square overflow-hidden border border-border bg-muted transition-colors group-hover:border-primary/40">
      {item.imageUrl ? (
        <img
          src={toDirectImageUrl(item.imageUrl, { w: 640 }) || item.imageUrl}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground">NO IMAGE</span>
        </div>
      )}
    </div>
  )

  const label = children ?? (
    <p className="mt-2 truncate font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
      {item.title}
    </p>
  )

  const content = (
    <>
      {imageBlock}
      {label}
    </>
  )

  if (item.externalUrl) {
    return (
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        aria-label={item.title}
      >
        {content}
      </a>
    )
  }

  return (
    <div className="group block" aria-label={item.title}>
      {content}
    </div>
  )
}

export function SquareImageGrid({
  items,
  footerText,
  footerUrl,
  className = '',
  children,
}: SquareImageGridProps) {
  if (items.length === 0) return null

  const footerClass =
    'border-t border-border/60 pt-6 text-center text-xs text-muted-foreground transition-colors'
  const footerStyle = { fontFamily: 'var(--font-body, inherit)' } as const

  return (
    <>
      <div className={`mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 ${className}`}>
        {items.map((item) => (
          <GridItemTile key={item.id} item={item}>
            {children?.(item)}
          </GridItemTile>
        ))}
      </div>
      {footerText ? (
        footerUrl ? (
          <a
            href={footerUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-draft-target="merchandise-footer"
            className={`${footerClass} hover:text-foreground underline-offset-4 hover:underline`}
            style={footerStyle}
          >
            {footerText}
          </a>
        ) : (
          <p
            data-draft-target="merchandise-footer"
            className={footerClass}
            style={footerStyle}
          >
            {footerText}
          </p>
        )
      ) : null}
    </>
  )
}
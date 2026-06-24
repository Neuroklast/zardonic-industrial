import { ReactNode } from 'react'
import Image from 'next/image'

interface GridItem {
  id: string
  title: string
  imageUrl: string | null
  externalUrl?: string | null
}

interface SquareImageGridProps {
  items: GridItem[]
  footerText?: string
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
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
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

export function SquareImageGrid({ items, footerText, className = '', children }: SquareImageGridProps) {
  if (items.length === 0) return null

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
        <p
          data-draft-target="merchandise-footer"
          className="border-t border-border/60 pt-6 text-center font-mono text-xs text-muted-foreground"
        >
          {footerText}
        </p>
      ) : null}
    </>
  )
}
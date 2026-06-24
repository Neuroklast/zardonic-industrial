'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { AnalyticsConfig } from '@/lib/analytics-config'
import { useAnalytics } from '@/hooks/use-analytics'

interface AnalyticsTrackerProps {
  config: AnalyticsConfig
}

export function AnalyticsTracker({ config }: AnalyticsTrackerProps) {
  const pathname = usePathname()
  const { track, canTrack } = useAnalytics(config)
  const seenSectionsRef = useRef<Set<string>>(new Set())
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!canTrack || !config.trackPageViews) return
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname
    track({ type: 'page_view', target: pathname })
  }, [canTrack, config.trackPageViews, pathname, track])

  useEffect(() => {
    if (!canTrack || !config.trackEvents) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = entry.target.id
          if (!id || seenSectionsRef.current.has(id)) continue
          seenSectionsRef.current.add(id)
          track({ type: 'section_view', target: id })
        }
      },
      { threshold: 0.35 },
    )

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((section) => observer.observe(section))

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const clickable = target.closest('a,button,[role="button"]')
      if (!clickable) return

      const rect = clickable.getBoundingClientRect()
      const x = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0
      const y = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0

      track({
        type: 'click',
        target: clickable.id || clickable.getAttribute('href') || clickable.textContent?.trim().slice(0, 80) || 'unknown',
        heatmap: {
          x: Math.min(1, Math.max(0, x)),
          y: Math.min(2, Math.max(0, y)),
          page: pathname,
          elementTag: clickable.tagName.toLowerCase(),
        },
      })
    }

    document.addEventListener('click', handleClick, { capture: true })

    return () => {
      observer.disconnect()
      document.removeEventListener('click', handleClick, { capture: true })
    }
  }, [canTrack, config.trackEvents, pathname, track])

  useEffect(() => {
    seenSectionsRef.current.clear()
  }, [pathname])

  return null
}
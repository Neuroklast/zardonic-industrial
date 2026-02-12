import { useEffect } from 'react'

export function useAnalytics(sectionId: string) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackSectionView(sectionId)
          }
        })
      },
      { threshold: 0.5 }
    )

    const element = document.getElementById(sectionId)
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [sectionId])
}

async function trackSectionView(section: string) {
  try {
    const analytics = await window.spark.kv.get<any>('zardonic-analytics') || {
      pageViews: 0,
      sectionViews: {},
      clicks: {},
      visitors: []
    }

    analytics.sectionViews[section] = (analytics.sectionViews[section] || 0) + 1
    
    await window.spark.kv.set('zardonic-analytics', analytics)
  } catch (e) {
    console.error('Analytics error:', e)
  }
}

export async function trackClick(element: string) {
  try {
    const analytics = await window.spark.kv.get<any>('zardonic-analytics') || {
      pageViews: 0,
      sectionViews: {},
      clicks: {},
      visitors: []
    }

    analytics.clicks[element] = (analytics.clicks[element] || 0) + 1
    
    await window.spark.kv.set('zardonic-analytics', analytics)
  } catch (e) {
    console.error('Analytics error:', e)
  }
}

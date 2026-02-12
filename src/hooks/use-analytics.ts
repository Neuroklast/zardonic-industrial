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

function getAnalyticsData() {
  try {
    const stored = localStorage.getItem('zardonic-analytics')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore parse errors
  }
  return {
    pageViews: 0,
    sectionViews: {},
    clicks: {},
    visitors: []
  }
}

function saveAnalyticsData(analytics: any) {
  try {
    localStorage.setItem('zardonic-analytics', JSON.stringify(analytics))
  } catch {
    // ignore storage errors
  }
}

async function trackSectionView(section: string) {
  try {
    const analytics = getAnalyticsData()
    analytics.sectionViews[section] = (analytics.sectionViews[section] || 0) + 1
    saveAnalyticsData(analytics)
  } catch (e) {
    console.error('Analytics error:', e)
  }
}

export async function trackClick(element: string) {
  try {
    const analytics = getAnalyticsData()
    analytics.clicks[element] = (analytics.clicks[element] || 0) + 1
    saveAnalyticsData(analytics)
  } catch (e) {
    console.error('Analytics error:', e)
  }
}

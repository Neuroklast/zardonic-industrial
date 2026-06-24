'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSyncJob } from '@/lib/sync-job-client'
import type { SyncJobRow } from '@/lib/sync-jobs'

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled'])

export function useSyncJobPoll(intervalMs = 2000) {
  const [job, setJob] = useState<SyncJobRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const jobIdRef = useRef<string | null>(null)

  const stop = useCallback(() => {
    jobIdRef.current = null
    setPolling(false)
  }, [])

  const pollOnce = useCallback(async (jobId: string) => {
    const row = await fetchSyncJob(jobId)
    setJob(row)
    if (TERMINAL_STATUSES.has(row.status)) {
      stop()
    }
    return row
  }, [stop])

  const startPolling = useCallback(
    (jobId: string) => {
      jobIdRef.current = jobId
      setError(null)
      setPolling(true)
      void pollOnce(jobId).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Polling failed')
        stop()
      })
    },
    [pollOnce, stop],
  )

  useEffect(() => {
    if (!polling || !jobIdRef.current) return

    const id = window.setInterval(() => {
      const currentId = jobIdRef.current
      if (!currentId) return
      void pollOnce(currentId).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Polling failed')
        stop()
      })
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [polling, intervalMs, pollOnce, stop])

  return { job, error, polling, startPolling, stop }
}
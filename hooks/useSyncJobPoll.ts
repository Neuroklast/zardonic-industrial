'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearPersistedSyncJobId,
  persistSyncJobId,
  readPersistedSyncJobId,
  type SyncJobStorageKey,
} from '@/lib/sync-job-storage'
import { fetchActiveSyncJobs, fetchSyncJob, triggerSyncJobTick } from '@/lib/sync-job-client'
import type { SyncJobRow, SyncJobType } from '@/lib/sync-jobs'

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled'])

interface UseSyncJobPollOptions {
  storageKey?: SyncJobStorageKey
  resumeTypes?: SyncJobType[]
  initialJobId?: string | null
  intervalMs?: number
  nudgeTicks?: boolean
}

export function useSyncJobPoll(options: UseSyncJobPollOptions = {}) {
  const {
    storageKey,
    resumeTypes,
    initialJobId = null,
    intervalMs = 2000,
    nudgeTicks = true,
  } = options

  const [job, setJob] = useState<SyncJobRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const jobIdRef = useRef<string | null>(null)
  const tickInFlightRef = useRef(false)
  const resumedRef = useRef(false)

  const stop = useCallback(() => {
    jobIdRef.current = null
    setPolling(false)
  }, [])

  const nudgeTick = useCallback(async (jobId: string) => {
    if (!nudgeTicks || tickInFlightRef.current) return
    tickInFlightRef.current = true
    try {
      await triggerSyncJobTick(jobId)
    } catch {
      // Polling will retry; stale jobs are also reaped by cron.
    } finally {
      tickInFlightRef.current = false
    }
  }, [nudgeTicks])

  const pollOnce = useCallback(
    async (jobId: string) => {
      const row = await fetchSyncJob(jobId)
      setJob(row)

      if (TERMINAL_STATUSES.has(row.status)) {
        if (storageKey) clearPersistedSyncJobId(storageKey)
        stop()
        return row
      }

      await nudgeTick(jobId)
      return row
    },
    [nudgeTick, stop, storageKey],
  )

  const startPolling = useCallback(
    (jobId: string) => {
      jobIdRef.current = jobId
      if (storageKey) persistSyncJobId(storageKey, jobId)
      setError(null)
      setPolling(true)
      void pollOnce(jobId).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Polling failed')
        stop()
      })
    },
    [pollOnce, stop, storageKey],
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

  useEffect(() => {
    if (resumedRef.current) return
    resumedRef.current = true

    const resume = async () => {
      const storedId = storageKey ? readPersistedSyncJobId(storageKey) : null
      const candidateId = initialJobId ?? storedId

      if (candidateId) {
        try {
          const row = await fetchSyncJob(candidateId)
          setJob(row)
          if (!TERMINAL_STATUSES.has(row.status)) {
            startPolling(candidateId)
            return
          }
          if (storageKey) clearPersistedSyncJobId(storageKey)
        } catch {
          if (storageKey) clearPersistedSyncJobId(storageKey)
        }
      }

      if (!resumeTypes || resumeTypes.length === 0) return

      try {
        const active = await fetchActiveSyncJobs(resumeTypes)
        const match = active[0]
        if (match) {
          setJob(match)
          startPolling(match.id)
        }
      } catch {
        // ignore — user can start a new job manually
      }
    }

    void resume()
  }, [initialJobId, resumeTypes, startPolling, storageKey])

  return { job, error, polling, startPolling, stop }
}
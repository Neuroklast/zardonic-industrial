'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearPersistedSyncJobId,
  persistSyncJobId,
  readPersistedSyncJobId,
  type SyncJobStorageKey,
} from '@/lib/sync-job-storage'
import { fetchActiveSyncJobs, fetchSyncJob, triggerSyncJobTick } from '@/lib/sync-job-client'
import type { SyncJobSummary, SyncJobType } from '@/lib/sync-jobs'

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
    intervalMs = 5000,
    nudgeTicks = true,
  } = options

  const [job, setJob] = useState<SyncJobSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const jobIdRef = useRef<string | null>(null)
  const tickInFlightRef = useRef(false)
  const pollInFlightRef = useRef(false)
  const lastNudgeAtRef = useRef(0)
  const resumedRef = useRef(false)

  const stop = useCallback(() => {
    jobIdRef.current = null
    setPolling(false)
  }, [])

  const nudgeTick = useCallback(async (jobId: string, updatedAt: string) => {
    if (!nudgeTicks || tickInFlightRef.current || document.visibilityState === 'hidden') return
    const lastUpdate = Date.parse(updatedAt)
    const now = Date.now()
    // Normal jobs advance via their server-side handoff. Only attempt recovery
    // after a genuine stall; never issue a tick on every UI poll.
    if (!Number.isFinite(lastUpdate) || now - lastUpdate < 90_000) return
    if (now - lastNudgeAtRef.current < 120_000) return
    lastNudgeAtRef.current = now
    tickInFlightRef.current = true
    try {
      await triggerSyncJobTick(jobId)
    } catch {
      // A later visible poll can recover a stale job.
    } finally {
      tickInFlightRef.current = false
    }
  }, [nudgeTicks])

  const pollOnce = useCallback(
    async (jobId: string) => {
      if (pollInFlightRef.current || document.visibilityState === 'hidden') return
      pollInFlightRef.current = true
      try {
        const row = await fetchSyncJob(jobId)
        if (jobIdRef.current !== jobId) return
        setJob(row)

        if (TERMINAL_STATUSES.has(row.status)) {
          if (storageKey) clearPersistedSyncJobId(storageKey)
          stop()
          return
        }

        await nudgeTick(jobId, row.updated_at)
      } finally {
        pollInFlightRef.current = false
      }
    },
    [nudgeTick, stop, storageKey],
  )

  const startPolling = useCallback(
    (jobId: string) => {
      jobIdRef.current = jobId
      lastNudgeAtRef.current = 0
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

    const refresh = () => {
      const currentId = jobIdRef.current
      if (!currentId || document.visibilityState === 'hidden') return
      void pollOnce(currentId).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Polling failed')
        stop()
      })
    }

    const id = window.setInterval(refresh, Math.max(3000, intervalMs))
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
    }
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
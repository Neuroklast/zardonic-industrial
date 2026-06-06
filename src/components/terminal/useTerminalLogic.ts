import { useState, useEffect, useRef, useCallback } from 'react'
import type { FormEvent } from 'react'
import type { TerminalCommand } from '@/lib/types'
import { downloadFile, type DownloadProgress } from '@/lib/download'
import {
  TERMINAL_RESERVED_COMMANDS,
  TERMINAL_TYPING_SPEED_MS,
} from '@/lib/config'
import { DEFAULT_KONAMI_CODE } from '@/lib/konami'
import { API_ROUTES } from '@/lib/api-routes'

interface UseTerminalLogicProps {
  isOpen: boolean
  onClose: () => void
  customCommands?: TerminalCommand[]
  secretCode?: string[]
  editMode?: boolean
  onSaveCommands?: (commands: TerminalCommand[]) => void
  onSaveSecretCode?: (code: string[]) => void
}

type HistoryLine = { type: 'command' | 'output' | 'error'; text: string }
type CurrentTypingLine = HistoryLine & { displayed: string }

const RESERVED = TERMINAL_RESERVED_COMMANDS
const TYPING_SPEED_MS = TERMINAL_TYPING_SPEED_MS
const ACCESS_CHARS = '!@#$%^&*<>?/\\|~0123456789ABCDEF'

export function useTerminalLogic({
  isOpen,
  onClose,
  customCommands = [],
  secretCode,
  onSaveCommands,
  onSaveSecretCode,
}: UseTerminalLogicProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'output', text: '> NEUROKLAST TERMINAL v1.3.37' },
    { type: 'output', text: '> SYSTEM INITIALIZED' },
    { type: 'output', text: '> TYPE "help" FOR AVAILABLE COMMANDS' },
    { type: 'output', text: '' },
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editTab, setEditTab] = useState<'commands' | 'shortcut'>('commands')
  const [cmds, setCmds] = useState<TerminalCommand[]>(customCommands)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [codeKeys, setCodeKeys] = useState<string[]>(secretCode && secretCode.length > 0 ? secretCode : DEFAULT_KONAMI_CODE)
  const [isRecordingKey, setIsRecordingKey] = useState(false)

  const prevIsOpenRef = useRef(false)

  const [typingQueue, setTypingQueue] = useState<HistoryLine[]>([])
  const [currentTyping, setCurrentTyping] = useState<CurrentTypingLine | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileDlProgress, setFileDlProgress] = useState<DownloadProgress>({ state: 'idle', progress: 0 })
  const pendingFileRef = useRef<{ url: string; name: string } | null>(null)

  const [pseudoProgress, setPseudoProgress] = useState(0)
  const [fakeStats, setFakeStats] = useState({ rate: '2.4', enc: 'AES-256-NK', node: 'NK-SECURE-7734' })
  const [accessPhase, setAccessPhase] = useState(0)
  const pseudoProgressRef = useRef(0)

  const buildHexNoise = useCallback(
    () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0').toUpperCase()).join(' '),
    [],
  )
  const [hexNoise, setHexNoise] = useState(() => buildHexNoise())

  const scramble = useCallback(
    (text: string, frame: number) =>
      text
        .split('')
        .map((ch, i) =>
          ch === ' ' ? ' ' : i % 3 === frame % 3 ? ACCESS_CHARS[Math.floor(Math.random() * ACCESS_CHARS.length)] : ch,
        )
        .join(''),
    [],
  )

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCmds(customCommands)
      setCodeKeys(secretCode && secretCode.length > 0 ? secretCode : DEFAULT_KONAMI_CODE)
      setIsEditing(false)
      setEditTab('commands')
      setExpandedIdx(null)
    }
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, customCommands, secretCode])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!fileLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPseudoProgress(0)
      pseudoProgressRef.current = 0
      return
    }
    const interval = setInterval(() => {
      if (fileDlProgress.progress === 0) {
        pseudoProgressRef.current = Math.min(pseudoProgressRef.current + 0.007, 0.95)
      } else {
        pseudoProgressRef.current = fileDlProgress.progress
      }
      setPseudoProgress(pseudoProgressRef.current)
      if (Math.random() < 0.3) {
        setFakeStats({
          rate: (1.5 + Math.random() * 3.5).toFixed(1),
          enc: ['AES-256-NK', 'RSA-4096-NK', 'NK-CIPHER-X7', 'DARKNET-SSL'][Math.floor(Math.random() * 4)],
          node: `NK-SECURE-${Math.floor(1000 + Math.random() * 9000)}`,
        })
        setHexNoise(buildHexNoise())
      }
      setAccessPhase(prev => (prev + 1) % 10)
    }, 120)
    return () => clearInterval(interval)
  }, [fileLoading, fileDlProgress.progress, buildHexNoise])

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history, currentTyping, fileLoading])

  useEffect(() => {
    if (currentTyping || typingQueue.length === 0) return
    const [next, ...rest] = typingQueue
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTypingQueue(rest)
    if (!next.text) {
      setHistory(prev => [...prev, next])
      return
    }
    setCurrentTyping({ ...next, displayed: '' })
    setIsTyping(true)
  }, [typingQueue, currentTyping])

  useEffect(() => {
    if (!currentTyping) return
    if (currentTyping.displayed.length >= currentTyping.text.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory(prev => [...prev, { type: currentTyping.type, text: currentTyping.text }])
      setCurrentTyping(null)
      setIsTyping(false)
      return
    }
    const timer = setTimeout(() => {
      setCurrentTyping(prev => (prev ? { ...prev, displayed: prev.text.slice(0, prev.displayed.length + 1) } : null))
    }, TYPING_SPEED_MS)
    return () => clearTimeout(timer)
  }, [currentTyping])

  useEffect(() => {
    if (isTyping || typingQueue.length > 0) return
    if (!pendingFileRef.current) return
    const { url, name } = pendingFileRef.current
    pendingFileRef.current = null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFileLoading(true)
    setFileDlProgress({ state: 'downloading', progress: 0 })

    downloadFile(url, name, progress => {
      setFileDlProgress(progress)
      if (progress.state === 'complete') {
        setFileLoading(false)
        setHistory(prev => [...prev, { type: 'output', text: `DOWNLOAD COMPLETE: ${name}` }, { type: 'output', text: '' }])
      } else if (progress.state === 'error') {
        setFileLoading(false)
        setHistory(prev => [...prev, { type: 'error', text: `DOWNLOAD FAILED: ${progress.error || 'Unknown error'}` }, { type: 'output', text: '' }])
      }
    })
  }, [isTyping, typingQueue])

  const handleCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase()

    setHistory(prev => [...prev, { type: 'command', text: `> ${cmd}` }])

    switch (trimmedCmd) {
      case 'clear':
        setHistory([
          { type: 'output', text: '> TERMINAL CLEARED' },
          { type: 'output', text: '' },
        ])
        setTypingQueue([])
        setCurrentTyping(null)
        setIsTyping(false)
        setInput('')
        return
      case 'exit':
        onClose()
        return
    }

    try {
      const res = await fetch(API_ROUTES.TERMINAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmedCmd }),
      })

      if (!res.ok) {
        setTypingQueue(prev => [
          ...prev,
          { type: 'error', text: 'TERMINAL API ERROR' },
          { type: 'output', text: '' },
        ])
        setInput('')
        return
      }

      const data = await res.json()

      if (trimmedCmd === 'help') {
        const serverCmds: Array<{ name: string; description: string }> = data.listing || []
        const allCommands = [
          { name: 'help', description: 'Show this message' },
          ...serverCmds,
          { name: 'clear', description: 'Clear terminal' },
          { name: 'exit', description: 'Close terminal' },
        ]
        const output = [
          { type: 'output' as const, text: 'AVAILABLE COMMANDS:' },
          ...allCommands.map(command => ({
            type: 'output' as const,
            text: `  ${command.name.padEnd(10)} - ${command.description}`,
          })),
          { type: 'output' as const, text: '' },
        ]
        setTypingQueue(prev => [...prev, ...output])
        setInput('')
        return
      }

      if (!data.found) {
        setTypingQueue(prev => [
          ...prev,
          { type: 'error', text: `COMMAND NOT FOUND: ${cmd}` },
          { type: 'error', text: 'TYPE "help" FOR AVAILABLE COMMANDS' },
          { type: 'output', text: '' },
        ])
        setInput('')
        return
      }

      const output: HistoryLine[] = [
        ...(data.output || []).map((text: string) => ({ type: 'output' as const, text })),
        { type: 'output' as const, text: '' },
      ]
      if (data.fileUrl) {
        const fileName = data.fileName || 'download'
        output.push({ type: 'output' as const, text: `INITIATING DOWNLOAD: ${fileName}...` })
        pendingFileRef.current = { url: data.fileUrl, name: fileName }
      }
      setTypingQueue(prev => [...prev, ...output])
    } catch (err) {
      console.error('Terminal API request failed:', err)
      setTypingQueue(prev => [
        ...prev,
        { type: 'error', text: 'CONNECTION ERROR' },
        { type: 'output', text: '' },
      ])
    }

    setInput('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      void handleCommand(input)
    }
  }

  const addCommand = () => {
    setCmds([...cmds, { name: '', description: '', output: [''] }])
    setExpandedIdx(cmds.length)
  }

  const removeCommand = (index: number) => {
    setCmds(cmds.filter((_, i) => i !== index))
    if (expandedIdx === index) setExpandedIdx(null)
  }

  const updateField = (index: number, field: 'name' | 'description' | 'fileUrl' | 'fileName', value: string) => {
    setCmds(cmds.map((command, i) => (i === index ? { ...command, [field]: value } : command)))
  }

  const updateOutputLine = (cmdIdx: number, lineIdx: number, value: string) => {
    setCmds(
      cmds.map((command, i) => {
        if (i !== cmdIdx) return command
        const output = [...command.output]
        output[lineIdx] = value
        return { ...command, output }
      }),
    )
  }

  const addOutputLine = (cmdIdx: number) => {
    setCmds(cmds.map((command, i) => (i === cmdIdx ? { ...command, output: [...command.output, ''] } : command)))
  }

  const removeOutputLine = (cmdIdx: number, lineIdx: number) => {
    setCmds(
      cmds.map((command, i) => {
        if (i !== cmdIdx) return command
        return { ...command, output: command.output.filter((_, outputLineIdx) => outputLineIdx !== lineIdx) }
      }),
    )
  }

  const handleSaveCommands = () => {
    const validCmds = cmds.filter(command => command.name.trim() && command.description.trim())
    onSaveCommands?.(validCmds)
    setIsEditing(false)
  }

  const handleSaveShortcut = () => {
    if (codeKeys.length >= 2) {
      onSaveSecretCode?.(codeKeys)
      setIsEditing(false)
    }
  }

  const hasNameConflict = (name: string, index: number) => {
    const lower = (name || '').toLowerCase().trim()
    if (RESERVED.includes(lower)) return 'Reserved command name'
    if (cmds.some((command, i) => i !== index && (command.name || '').toLowerCase().trim() === lower)) {
      return 'Duplicate name'
    }
    return null
  }

  return {
    inputRef,
    historyRef,
    input,
    setInput,
    history,
    currentTyping,
    isTyping,
    fileLoading,
    fileDlProgress,
    pseudoProgress,
    fakeStats,
    accessPhase,
    hexNoise,
    scramble,
    isEditing,
    setIsEditing,
    editTab,
    setEditTab,
    cmds,
    expandedIdx,
    setExpandedIdx,
    codeKeys,
    setCodeKeys,
    isRecordingKey,
    setIsRecordingKey,
    handleSubmit,
    addCommand,
    removeCommand,
    updateField,
    updateOutputLine,
    addOutputLine,
    removeOutputLine,
    handleSaveCommands,
    handleSaveShortcut,
    hasNameConflict,
  }
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Terminal as TerminalIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface TerminalProps {
  isOpen: boolean
  onClose: () => void
}

export function Terminal({ isOpen, onClose }: TerminalProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([
    '> SYSTEM INITIALIZED',
    '> ACCESS GRANTED',
    '> TYPE "HELP" FOR COMMANDS',
  ])

  const handleCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim()
    const newHistory = [...history, `> ${cmd}`]

    switch (command) {
      case 'help':
        newHistory.push('AVAILABLE COMMANDS:', 'ABOUT - Artist information', 'SOCIAL - Social media links', 'CLEAR - Clear terminal', 'EXIT - Close terminal')
        break
      case 'about':
        newHistory.push('ZARDONIC - METAL & BASS ARTIST', 'GENRE: INDUSTRIAL / DRUM & BASS', 'STATUS: ACTIVE')
        break
      case 'social':
        newHistory.push('INSTAGRAM | FACEBOOK | SPOTIFY | YOUTUBE')
        break
      case 'clear':
        setHistory([])
        setInput('')
        return
      case 'exit':
        onClose()
        return
      default:
        newHistory.push(`UNKNOWN COMMAND: ${cmd}`, 'TYPE "HELP" FOR COMMANDS')
    }

    setHistory(newHistory)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input) {
      handleCommand(input)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-20 bottom-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[800px] bg-black border-2 border-accent z-[101] scanline-effect"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-accent/30">
                <div className="flex items-center gap-3">
                  <TerminalIcon className="w-6 h-6 text-accent" weight="fill" />
                  <span className="font-mono text-accent uppercase tracking-wider">TERMINAL v1.0</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5 text-accent" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-accent space-y-2">
                {history.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span>{'>'}</span>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-accent font-mono"
                    autoFocus
                    spellCheck={false}
                  />
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

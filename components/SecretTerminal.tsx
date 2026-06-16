import { motion, AnimatePresence } from 'framer-motion'
import { PencilSimple, Plus, Trash, CaretDown, CaretUp, Keyboard } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CyberCloseButton from '@/components/CyberCloseButton'
import CyberModalBackdrop from '@/components/CyberModalBackdrop'
import type { TerminalCommand } from '@/lib/types'
import { DEFAULT_KONAMI_CODE } from '@/lib/konami'
import { useTerminalLogic } from '@/components/terminal/useTerminalLogic'

interface SecretTerminalProps {
  isOpen: boolean
  onClose: () => void
  customCommands?: TerminalCommand[]
  secretCode?: string[]
  editMode?: boolean
  onEdit?: () => void
  onSaveCommands?: (commands: TerminalCommand[]) => void
  onSaveSecretCode?: (code: string[]) => void
}

export default function SecretTerminal({ isOpen, onClose, customCommands = [], secretCode, editMode, onSaveCommands, onSaveSecretCode }: SecretTerminalProps) {
  const {
    inputRef,
    historyRef,
    input,
    setInput,
    history,
    currentTyping,
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
  } = useTerminalLogic({ isOpen, onClose, customCommands, secretCode, editMode, onSaveCommands, onSaveSecretCode })

  return (
    <CyberModalBackdrop open={isOpen} bgClass="bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl h-[min(600px,80dvh)] bg-card border-2 border-primary/30 relative overflow-hidden glitch-overlay-enter flex-shrink-0"
      >
        <div className="absolute inset-0 hud-scanline pointer-events-none opacity-20" />

        <div className="absolute top-0 left-0 right-0 h-12 bg-primary/10 border-b border-primary/30 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-xs text-primary uppercase tracking-wider">
              {isEditing ? (editTab === 'shortcut' ? 'EDIT KEY SEQUENCE' : 'EDIT COMMANDS') : 'TERMINAL ACTIVE'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {editMode && onSaveCommands && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary hover:text-accent transition-colors"
                title="Edit terminal commands"
              >
                <PencilSimple size={18} />
              </button>
            )}
            <CyberCloseButton
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false)
                } else {
                  onClose()
                }
              }}
              label={isEditing ? 'BACK' : 'CLOSE'}
            />
          </div>
        </div>

        {isEditing ? (
          <div className="absolute top-12 left-0 right-0 bottom-0 flex flex-col overflow-hidden">
            <div className="flex border-b border-primary/20 bg-primary/5 flex-shrink-0">
              <button
                onClick={() => setEditTab('commands')}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-wider transition-colors border-b-2 ${editTab === 'commands' ? 'text-primary border-primary' : 'text-primary/40 border-transparent hover:text-primary/70'}`}
              >
                <PencilSimple size={12} /> COMMANDS
              </button>
              <button
                onClick={() => setEditTab('shortcut')}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-wider transition-colors border-b-2 ${editTab === 'shortcut' ? 'text-primary border-primary' : 'text-primary/40 border-transparent hover:text-primary/70'}`}
              >
                <Keyboard size={12} /> KEY SEQUENCE
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {editTab === 'commands' ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Add custom commands for the secret terminal. Built-in commands (help, glitch, matrix, clear, exit) cannot be overridden.
                  </p>

                  {cmds.map((cmd, idx) => {
                    const conflict = hasNameConflict(cmd.name, idx)
                    const isExpanded = expandedIdx === idx
                    return (
                      <div key={idx} className="border border-border rounded-md p-3 space-y-2">
                        <div className="flex gap-2 items-center">
                          <Input
                            value={cmd.name}
                            onChange={e => updateField(idx, 'name', e.target.value.toLowerCase().replace(/\s/g, ''))}
                            placeholder="command"
                            className="w-28 font-mono text-sm"
                          />
                          <Input
                            value={cmd.description}
                            onChange={e => updateField(idx, 'description', e.target.value)}
                            placeholder="Description"
                            className="flex-1 text-sm"
                          />
                          <Button variant="ghost" size="icon" onClick={() => setExpandedIdx(isExpanded ? null : idx)}>
                            {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeCommand(idx)}>
                            <Trash size={16} className="text-destructive" />
                          </Button>
                        </div>
                        {conflict && <p className="text-xs text-destructive">{conflict}</p>}
                        {isExpanded && (
                          <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
                            <Label className="text-xs text-muted-foreground">Output lines</Label>
                            {cmd.output.map((line, lineIdx) => (
                              <div key={lineIdx} className="flex gap-2 items-center">
                                <span className="text-xs text-muted-foreground font-mono w-4">{lineIdx + 1}</span>
                                <Input
                                  value={line}
                                  onChange={e => updateOutputLine(idx, lineIdx, e.target.value)}
                                  placeholder="Output text..."
                                  className="flex-1 font-mono text-xs"
                                />
                                {cmd.output.length > 1 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeOutputLine(idx, lineIdx)}>
                                    <Trash size={12} />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addOutputLine(idx)} className="text-xs">
                              <Plus size={12} className="mr-1" /> Add line
                            </Button>
                            <Label className="text-xs text-muted-foreground mt-2">File Download (optional)</Label>
                            <Input
                              value={cmd.fileUrl || ''}
                              onChange={e => updateField(idx, 'fileUrl', e.target.value)}
                              placeholder="File URL"
                              className="flex-1 text-xs"
                            />
                            <Input
                              value={cmd.fileName || ''}
                              onChange={e => updateField(idx, 'fileName', e.target.value)}
                              placeholder="File Name"
                              className="flex-1 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <Button variant="outline" onClick={addCommand} className="w-full">
                    <Plus size={16} className="mr-2" /> Add Command
                  </Button>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveCommands}>Save Commands</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Define the key sequence that activates the secret terminal. Minimum 2 keys. Click "Record Key" then press any key.
                  </p>
                  <div className="flex flex-wrap gap-2 min-h-[48px] p-3 border border-border bg-background/30">
                    {codeKeys.map((key, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/30 font-mono text-xs text-primary"
                      >
                        {key}
                        <button
                          onClick={() => setCodeKeys(codeKeys.filter((_, ki) => ki !== i))}
                          className="text-primary/40 hover:text-destructive transition-colors ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {codeKeys.length === 0 && <span className="text-muted-foreground text-xs font-mono">No keys defined</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-mono text-xs ${isRecordingKey ? 'border-primary text-primary animate-pulse' : ''}`}
                      onKeyDown={e => {
                        if (!isRecordingKey) return
                        e.preventDefault()
                        e.stopPropagation()
                        const modifierOnly = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab']
                        if (modifierOnly.includes(e.key)) return
                        setCodeKeys(prev => [...prev, e.key])
                        setIsRecordingKey(false)
                      }}
                      onBlur={() => setIsRecordingKey(false)}
                      onClick={() => setIsRecordingKey(true)}
                      onFocus={() => {}}
                    >
                      <Keyboard size={12} className="mr-1" />
                      {isRecordingKey ? 'PRESS A KEY…' : 'Record Key'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => setCodeKeys(DEFAULT_KONAMI_CODE)}
                    >
                      Reset to Default
                    </Button>
                  </div>
                  {codeKeys.length < 2 && <p className="text-xs text-destructive">Minimum 2 keys required.</p>}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveShortcut} disabled={codeKeys.length < 2}>Save Shortcut</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              ref={historyRef}
              className="absolute top-12 left-0 right-0 bottom-16 overflow-y-auto p-6 font-mono text-sm"
            >
              {history.map((line, i) => (
                <div
                  key={i}
                  className={`mb-1 ${
                    line.type === 'command'
                      ? 'text-accent'
                      : line.type === 'error'
                        ? 'text-destructive'
                        : 'text-foreground/80'
                  }`}
                >
                  {line.text}
                </div>
              ))}
              {currentTyping && (
                <div
                  className={`mb-1 ${
                    currentTyping.type === 'command'
                      ? 'text-accent'
                      : currentTyping.type === 'error'
                        ? 'text-destructive'
                        : 'text-foreground/80'
                  }`}
                >
                  {currentTyping.displayed}
                  <span className="animate-pulse">▌</span>
                </div>
              )}
              {fileLoading && (() => {
                const pct = fileDlProgress.state === 'complete' ? 1 : pseudoProgress
                const totalSegs = 20
                const filled = Math.round(pct * totalSegs)
                const bar = '▓'.repeat(filled) + '░'.repeat(totalSegs - filled)
                const isAccessing = pct < 0.1
                const isComplete = fileDlProgress.state === 'complete'

                return (
                  <AnimatePresence mode="wait">
                    {isComplete ? (
                      <motion.div
                        key="complete"
                        className="my-3 px-2 py-2 border border-primary/40 bg-primary/10"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="text-primary font-mono text-xs tracking-widest">&gt; TRANSFER COMPLETE</div>
                      </motion.div>
                    ) : isAccessing ? (
                      <motion.div
                        key="accessing"
                        className="my-3 space-y-1 font-mono text-xs select-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-primary/80 tracking-widest">{scramble('ACCESSING SECURE NODE...', accessPhase)}</div>
                        <div className="text-primary/60 tracking-[0.15em]">{'[' + '■'.repeat(accessPhase % 4) + '□'.repeat(4 - (accessPhase % 4)) + ']'}</div>
                        <div className="text-primary/30 text-xs tracking-widest">{hexNoise}</div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="downloading"
                        className="my-3 space-y-1.5 font-mono text-xs select-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-primary/50 text-xs tracking-widest text-right">{hexNoise}</div>
                        <div className="relative w-full overflow-hidden">
                          <div className="text-primary/80 tracking-[0.05em] leading-none">{bar} {Math.round(pct * 100)}%</div>
                          <motion.div
                            className="absolute top-0 bottom-0 w-4 bg-primary/30 blur-sm pointer-events-none"
                            animate={{ left: [`${pct * 100 - 5}%`, `${Math.min(pct * 100 + 2, 99)}%`] }}
                            transition={{ duration: 0.12, ease: 'linear', repeat: Infinity, repeatType: 'mirror' }}
                          />
                        </div>
                        <div className="text-primary/50 space-y-0.5 text-xs tracking-wider">
                          <div>TRANSFER RATE: <span className="text-primary/80">{fakeStats.rate} MB/s</span></div>
                          <div>ENCRYPTION: <span className="text-primary/80">{fakeStats.enc}</span></div>
                          <div>NODE: <span className="text-primary/80">{fakeStats.node}</span></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )
              })()}
            </div>

            <form
              onSubmit={handleSubmit}
              className="absolute bottom-0 left-0 right-0 h-16 bg-primary/5 border-t border-primary/30 flex items-center px-6"
            >
              <span className="text-primary font-mono text-sm mr-2">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-sm caret-primary"
                placeholder="Enter command..."
                autoComplete="off"
                spellCheck={false}
              />
            </form>
          </>
        )}
      </motion.div>
    </CyberModalBackdrop>
  )
}

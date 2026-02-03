import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVisualStore } from '../../store/visualStore'
import { parseCommand } from '../../logic/CommandParser'
import './TerminalOverlay.css'

export const TerminalOverlay: React.FC = () => {
    const { showTerminal, toggleTerminal, terminalHistory, setTerminalHistory } = useVisualStore()
    const [inputValue, setInputValue] = useState('')
    const [historyIndex, setHistoryIndex] = useState(-1)
    const contentRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (showTerminal && inputRef.current) {
            inputRef.current.focus()
        }
    }, [showTerminal])

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
    }, [terminalHistory])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = inputValue.trim()
            if (cmd) {
                const response = parseCommand(cmd)
                const newHistory = [
                    ...terminalHistory,
                    { type: 'cmd', text: `> ${cmd}` },
                    { type: 'msg', text: response.message }
                ]
                setTerminalHistory(newHistory as any)
                setInputValue('')
                setHistoryIndex(-1)
            }
        } else if (e.key === 'Escape') {
            toggleTerminal()
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const cmdsOnly = terminalHistory.filter((h: any) => h.type === 'cmd').map((h: any) => h.text.replace('> ', ''))
            if (cmdsOnly.length > 0) {
                const newIndex = Math.min(historyIndex + 1, cmdsOnly.length - 1)
                setHistoryIndex(newIndex)
                setInputValue(cmdsOnly[cmdsOnly.length - 1 - newIndex])
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            const cmdsOnly = terminalHistory.filter((h: any) => h.type === 'cmd').map((h: any) => h.text.replace('> ', ''))
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1
                setHistoryIndex(newIndex)
                setInputValue(cmdsOnly[cmdsOnly.length - 1 - newIndex])
            } else if (historyIndex === 0) {
                setHistoryIndex(-1)
                setInputValue('')
            }
        }
    }

    return (
        <AnimatePresence>
            {showTerminal && (
                <motion.div
                    className="terminal-overlay"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="terminal-header">
                        <span>Terminal Core v1.0.0</span>
                        <div onClick={toggleTerminal} style={{ cursor: 'pointer', padding: '0 4px' }}>[X]</div>
                    </div>

                    <div className="terminal-content" ref={contentRef}>
                        <div className="terminal-line msg">System initialized. Type 'help' for commands.</div>
                        {terminalHistory.map((line: any, i: number) => (
                            <div key={i} className={`terminal-line ${line.type}`}>
                                {line.text}
                            </div>
                        ))}
                    </div>

                    <div className="terminal-input-area">
                        <span className="terminal-prompt">$</span>
                        <input
                            ref={inputRef}
                            className="terminal-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            autoComplete="off"
                        />
                        {inputValue === '' && <span className="terminal-blink">_</span>}
                    </div>

                    <div className="scanline" />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

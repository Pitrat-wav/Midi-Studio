import React, { useState } from 'react'
import { useAIStore } from '../../store/aiStore'
import { Wand2, X, Sparkles, AlertCircle, Key } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './AIPanel.css'

export function AIPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [prompt, setPrompt] = useState('')
    const { isGenerating, lastError, generateTexture, currentTextureUrl, hfKey, setKeys } = useAIStore()
    const [tempKey, setTempKey] = useState('')
    const [showKeyField, setShowKeyField] = useState(!hfKey)

    const handleGenerate = async () => {
        if (!prompt) return
        await generateTexture(prompt)
    }

    const handleSaveKey = () => {
        setKeys(undefined, tempKey)
        setShowKeyField(false)
    }

    return (
        <div className="ai-panel-container">
            <button
                className={`ai-toggle-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Wand2 size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-panel"
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    >
                        <header>
                            <h3><Sparkles size={16} /> AI TEXTURE LAB</h3>
                            <button onClick={() => setIsOpen(false)}><X size={16} /></button>
                        </header>

                        <div className="ai-content">
                            {showKeyField ? (
                                <div className="key-setup">
                                    <p>Enter Hugging Face API Key to enable Stable Diffusion:</p>
                                    <div className="input-row">
                                        <input
                                            type="password"
                                            placeholder="hf_..."
                                            value={tempKey}
                                            onChange={e => setTempKey(e.target.value)}
                                        />
                                        <button onClick={handleSaveKey}><Key size={14} /> SAVE</button>
                                    </div>
                                    <small>Get yours at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">huggingface.co</a></small>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        placeholder="Describe the texture (e.g., 'liquid chrome nebula', 'alien organic biological skin'...)"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        disabled={isGenerating}
                                    />

                                    <button
                                        className="generate-btn"
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !prompt}
                                    >
                                        {isGenerating ? 'GENERATING...' : 'GENERATE TEXTURE'}
                                    </button>

                                    {lastError && (
                                        <div className="ai-error">
                                            <AlertCircle size={14} /> {lastError}
                                        </div>
                                    )}

                                    {currentTextureUrl && (
                                        <div className="preview-container">
                                            <p>PREVIEW:</p>
                                            <img src={currentTextureUrl} alt="Generated texture" />
                                            <div className="apply-hint">Applying to all 3D planets...</div>
                                        </div>
                                    )}

                                    <button className="settings-btn" onClick={() => setShowKeyField(true)}>
                                        <Key size={12} /> CHANGE API KEY
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

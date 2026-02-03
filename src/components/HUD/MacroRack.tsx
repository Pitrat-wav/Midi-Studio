import React from 'react'
import { Knob } from '../Knob'
import { useNodeStore } from '../../store/nodeStore'
import { Sliders, ZapOff } from 'lucide-react'
import './MacroRack.css'

export const MacroRack: React.FC = () => {
    const { macros, setMacroValue, updateMacroLabel } = useNodeStore()

    return (
        <div className="macro-rack-container">
            <header className="macro-rack-header">
                <div className="macro-title">
                    <Sliders size={14} />
                    <span>MACRO CONTROLS</span>
                </div>
                <div className="macro-rack-status">
                    {macros.filter(m => m.targetNodeId).length} / 8 MAPPED
                </div>
            </header>

            <div className="macro-grid">
                {macros.map((macro) => (
                    <div key={macro.id} className={`macro-item ${macro.targetNodeId ? 'mapped' : 'unmapped'}`}>
                        <div className="macro-knob-wrapper">
                            <Knob
                                label={macro.label}
                                value={macro.value}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(val) => setMacroValue(macro.id, val)}
                                size={54}
                                showLabel={false}
                                color={macro.targetNodeId ? '#007aff' : '#333'}
                            />
                            {!macro.targetNodeId && <div className="map-hint"><ZapOff size={10} /></div>}
                        </div>

                        <input
                            className="macro-label-input"
                            value={macro.label}
                            onChange={(e) => updateMacroLabel(macro.id, e.target.value)}
                            placeholder="Unnamed"
                            spellCheck={false}
                        />

                        {macro.targetParam && (
                            <div className="macro-target-info">
                                {macro.targetParam.toUpperCase()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

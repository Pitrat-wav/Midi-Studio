import React, { useState } from 'react';
import { useNodeStore } from '../../store/nodeStore';
import { X, Settings, Zap, ArrowRight, ArrowLeft, Sliders, Activity, Disc, Waves, Cpu, Power } from 'lucide-react';
import './NodeInspector.css';

interface NodeInspectorProps {
    nodeId: string;
    onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ nodeId, onClose }) => {
    const { nodes, updateNodeParam } = useNodeStore();
    const node = nodes.find(n => n.id === nodeId);
    const [expandedSections, setExpandedSections] = useState<string[]>(['core', 'output']);

    if (!node) return null;

    const data = node.data;
    const params = data.params || {};

    const handleParamChange = (key: string, value: any) => {
        updateNodeParam(nodeId, key, value);
    };

    const toggleSection = (id: string) => {
        setExpandedSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const getParamGroup = (key: string) => {
        const k = key.toLowerCase();
        if (k.includes('input') || k.includes('pre')) return 'input';
        if (k.includes('output') || k.includes('gain') || k.includes('mix') || k.includes('pan') || k.includes('bypass')) return 'output';
        if (k.includes('mod') || k.includes('lfo') || k.includes('envelope')) return 'mod';
        return 'core';
    };

    const ParameterRow = ({ name, value }: { name: string, value: any }) => (
        <div className="param-row" key={name}>
            <div className="param-info">
                <span className="param-name">{name.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                <span className="param-value">
                    {typeof value === 'number' ? (name.toLowerCase().includes('freq') ? `${Math.round(value)}Hz` : value.toFixed(3)) : String(value)}
                </span>
            </div>
            {typeof value === 'number' ? (
                <div className="slider-container">
                    <input
                        type="range"
                        min={name.toLowerCase().includes('freq') ? 20 : 0}
                        max={name.toLowerCase().includes('freq') ? 20000 : (name === 'inputGain' || name === 'outputGain' ? 2 : 1)}
                        step={name.toLowerCase().includes('freq') ? 1 : 0.001}
                        value={value}
                        onChange={(e) => handleParamChange(name, parseFloat(e.target.value))}
                    />
                    <div className="slider-track" style={{ width: `${(value / (name.toLowerCase().includes('freq') ? 20000 : (name === 'inputGain' || name === 'outputGain' ? 2 : 1))) * 100}%` }}></div>
                </div>
            ) : typeof value === 'boolean' ? (
                <button
                    className={`toggle-btn ${value ? 'active' : ''}`}
                    onClick={() => handleParamChange(name, !value)}
                >
                    <Power size={12} /> {value ? 'ON' : 'OFF'}
                </button>
            ) : (
                <select className="param-select" value={value} onChange={e => handleParamChange(name, e.target.value)}>
                    {['sine', 'sawtooth', 'square', 'triangle', 'lowpass', 'highpass', 'bandpass'].includes(value) ?
                        ['sine', 'sawtooth', 'square', 'triangle', 'lowpass', 'highpass', 'bandpass'].map(o => <option key={o} value={o}>{o}</option>) :
                        <option value={value}>{value}</option>
                    }
                </select>
            )}
        </div>
    );

    const Section = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => {
        // Show core params PLUS standard IO params if they are missing
        const standardIO = ['inputGain', 'outputGain', 'bypass', 'mix', 'pan'];
        const allKeys = Array.from(new Set([...Object.keys(params), ...standardIO]));

        const sectionParams = allKeys.filter(key => {
            const group = getParamGroup(key);
            // Hide IO for non-audio logic nodes
            if (standardIO.includes(key) && data.category !== 'audio') return false;
            // Hide bits that aren't in this group
            if (group !== id) return false;
            // Only show if it matches the group OR it's a core parameter
            return true;
        }).map(key => ({
            key,
            value: params[key] !== undefined ? params[key] : (key === 'bypass' ? false : (key === 'pan' ? 0 : 1.0))
        }));

        if (sectionParams.length === 0) return null;
        const isExpanded = expandedSections.includes(id);

        return (
            <div className={`inspector-section ${isExpanded ? 'active' : ''}`}>
                <div className="section-header" onClick={() => toggleSection(id)}>
                    <div className="section-title">
                        <Icon size={14} />
                        <span>{label}</span>
                    </div>
                    <div className={`chevron ${isExpanded ? 'up' : 'down'}`} />
                </div>
                {isExpanded && (
                    <div className="section-content">
                        {sectionParams.map(p => <ParameterRow key={p.key} name={p.key} value={p.value} />)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="node-inspector-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="node-inspector-card modern-layout">
                <header>
                    <div className="title-group">
                        <div className="node-icon-large">
                            {data.category === 'audio' ? <Waves size={24} /> : <Cpu size={24} />}
                        </div>
                        <div>
                            <h2>{data.label} <span className="status-dot"></span></h2>
                            <p className="node-type-label">{data.type.toUpperCase()}</p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="inspector-scroll-area">
                    <Section id="input" label="INPUT PROCESSING" icon={ArrowRight} />
                    <Section id="core" label="MODULE PARAMETERS" icon={Sliders} />
                    <Section id="mod" label="MODULATION" icon={Activity} />
                    <Section id="output" label="OUTPUT & GAIN" icon={ArrowLeft} />
                </div>

                <footer>
                    <div className="signal-chain-preview">
                        <div className="chain-node active">IN</div>
                        <div className="chain-link"></div>
                        <div className="chain-node pulse">{data.label.substring(0, 4)}</div>
                        <div className="chain-link"></div>
                        <div className="chain-node active">OUT</div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

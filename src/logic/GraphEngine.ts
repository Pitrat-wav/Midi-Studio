import * as Tone from 'tone'
import { useNodeStore, NodeData, NodeType } from '../store/nodeStore'
import type { Edge, Node } from 'reactflow'
import { hasCycle } from './graphUtils.ts'
import { AudioNodeWrapper, NODE_CREATORS } from './nodeCreators'

const audioNodes = new Map<string, AudioNodeWrapper>()

export class GraphEngine {
    static initialized = false
    private static roverAnalyser: Tone.Waveform | null = null
    private static currentRoverSource: any = null
    private static aiGenStates = new Map<string, { meter: Tone.Meter, wasTriggered: boolean }>()
    private static aiGenTimer: any = null

    static getRoverAnalyser() {
        if (!this.roverAnalyser) this.roverAnalyser = new Tone.Waveform(128)
        return this.roverAnalyser
    }
    static async initWorklet() {
        const ctx = Tone.getContext().rawContext
        try {
            // Note: In development we use the source path. In build we might need a different strategy.
            await ctx.audioWorklet.addModule('/src/audio/worklets/WasmProcessor.js')
            await ctx.audioWorklet.addModule('/src/audio/worklets/ExpressionProcessor.js')
            await ctx.audioWorklet.addModule('/src/audio/worklets/ScriptProcessor.js')
            console.log('✅ AudioWorklet: Engines loaded')
        } catch (e) {
            console.warn('⚠️ AudioWorklet: Failed to load WasmProcessor. WebGL Studio will fallback to JS DSP.', e)
        }
    }

    static unsubscribe: () => void

    static init() {
        if (this.initialized) return
        this.initialized = true
        console.log('🔌 GraphEngine: Initializing Deep Core DSP...')
        this.initWorklet()

        this.unsubscribe = useNodeStore.subscribe((state, prevState) => {
            // 1. Manage Nodes
            const currentIds = new Set(state.nodes.map(n => n.id))
            const prevIds = new Set(prevState.nodes.map(n => n.id))

            // Cleanup removed
            prevState.nodes.forEach(n => {
                if (!currentIds.has(n.id)) this.destroyNode(n.id)
            })

            // Create new
            state.nodes.forEach(n => {
                if (!prevIds.has(n.id)) {
                    this.createNode(n.id, n.data)
                } else {
                    // Update Params
                    const prevNode = prevState.nodes.find(p => p.id === n.id)
                    // Check params change
                    if (prevNode && JSON.stringify(prevNode.data.params) !== JSON.stringify(n.data.params)) {
                        this.updateParams(n.id, n.data.params)
                    }
                    // Check script change
                    if (prevNode && prevNode.data.script !== n.data.script) {
                        this.updateScript(n.id, n.data.script || '')
                    }
                }
            })

            // 2. Rebuild Connections
            const edgesChanged = JSON.stringify(state.edges) !== JSON.stringify(prevState.edges)
            const portalParamsChanged = state.nodes.some((n) => {
                const prev = prevState.nodes.find(p => p.id === n.id)
                return prev && (n.data.params.portalId !== prev.data.params.portalId)
            })

            if (edgesChanged || portalParamsChanged) {
                this.rebuildConnections(state.nodes, state.edges)
            }
        })
    }

    static createScriptNode(code: string) {
        const ctx = Tone.getContext().rawContext

        try {
            // Attempt to use AudioWorklet for better performance and off-thread processing
            const node = new AudioWorkletNode(ctx, 'script-processor')
            ;(node as any).nodeRole = 'script'
            node.port.postMessage({ type: 'compile', code })
            return node
        } catch (e) {
            // Fallback to ScriptProcessorNode (runs on main thread)
            const scriptNode = ctx.createScriptProcessor(1024, 1, 1)
            const memory = new Float32Array(1024)

            try {
                // Create reusable process function from string
                const factory = new Function('memory', 'console', `
                    ${code}
                    return { init: typeof init !== 'undefined' ? init : null, process: typeof process !== 'undefined' ? process : null }
                 `)
                const lib = factory(memory, console)
                if (lib.init && typeof lib.init === 'function') lib.init()
                ;(scriptNode as any)._userProcess = lib.process
            } catch (err) {
                console.error('Built-in Script Error', err)
            }

            (scriptNode as any)._memory = memory
            scriptNode.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0)
                const output = e.outputBuffer.getChannelData(0)
                const proc = (scriptNode as any)._userProcess
                if (proc) {
                    try { proc(input, output) } catch (err) { (scriptNode as any)._userProcess = null }
                } else {
                    output.set(input) // Passthrough if failed
                }
            }
            return scriptNode
        }
    }

    static registerAiGenNode(id: string, meter: Tone.Meter) {
        this.aiGenStates.set(id, { meter, wasTriggered: false })
        if (!this.aiGenTimer) {
            this.aiGenTimer = setInterval(() => this.pollAiGenNodes(), 100)
        }
    }

    static unregisterAiGenNode(id: string) {
        this.aiGenStates.delete(id)
        if (this.aiGenStates.size === 0 && this.aiGenTimer) {
            clearInterval(this.aiGenTimer)
            this.aiGenTimer = null
        }
    }

    private static pollAiGenNodes() {
        this.aiGenStates.forEach((state, id) => {
            const val = state.meter.getValue()
            const level = Array.isArray(val) ? Math.max(...val.map(v => Math.abs(v))) : Math.abs(val as number)

            if (level > 0.5 && !state.wasTriggered) {
                state.wasTriggered = true
                window.dispatchEvent(new CustomEvent('AI_GEN_TRIGGER', { detail: { id } }))
            } else if (level < 0.5) {
                state.wasTriggered = false
            }
        })
    }

    static createNode(id: string, data: NodeData) {
        try {
            let wrapper: AudioNodeWrapper | null = null

            const creator = NODE_CREATORS[data.type]
            if (creator) {
                wrapper = creator(id, data, {
                    createScriptNode: (code) => this.createScriptNode(code),
                    registerAiGenNode: (id, meter) => this.registerAiGenNode(id, meter)
                })
            } else if (data.type.includes('adv_') || (data.type as string).includes('logic_') || (data.type as string).includes('note_')) {
                const pass = new Tone.Gain(1)
                wrapper = { node: pass, inputs: { 'in': pass } }
            }

            if (wrapper) {
                this.attachMeters(wrapper)
                audioNodes.set(id, wrapper)
            }
        } catch (e) {
            console.error(`GraphEngine Create Error ${id}`, e)
        }
    }

    private static attachMeters(wrapper: AudioNodeWrapper) {
        wrapper.meters = {}
        if (wrapper.node instanceof Tone.ToneAudioNode) {
            const meter = new Tone.Meter()
            wrapper.node.connect(meter)
            wrapper.meters['default'] = meter
        }
        if (wrapper.outputs) {
            Object.keys(wrapper.outputs).forEach(handle => {
                const outNode = wrapper.outputs![handle]
                if (outNode instanceof Tone.ToneAudioNode) {
                    const meter = new Tone.Meter()
                    outNode.connect(meter)
                    wrapper.meters![handle] = meter
                }
            })
        }
    }

    static getNode(id: string): AudioNodeWrapper | undefined {
        return audioNodes.get(id);
    }

    static destroyNode(id: string) {
        const wrap = audioNodes.get(id)
        if (wrap) {
            // Dispose meters
            if (wrap.meters) {
                Object.values(wrap.meters).forEach(m => m.dispose())
            }

            if ((wrap.node as any)._onDown) {
                window.removeEventListener('keydown', (wrap.node as any)._onDown)
                window.removeEventListener('keyup', (wrap.node as any)._onUp)
            }
            this.unregisterAiGenNode(id)
            if (wrap.node instanceof Tone.ToneAudioNode) wrap.node.dispose()
            else if (wrap.node instanceof AudioNode) wrap.node.disconnect()
            audioNodes.delete(id)
        }
    }

    static updateParams(id: string, params: Record<string, any>) {
        const wrap = audioNodes.get(id)
        if (!wrap) return
        const n = wrap.node

        // COMMON GAIN/BYPASS HANDLING
        if (params.bypass !== undefined) {
            if (n instanceof Tone.ToneAudioNode && (n as any).wet) {
                (n as any).wet.value = params.bypass ? 0 : (params.mix || 1);
            }
        }
        if (params.outputGain !== undefined && n instanceof Tone.ToneAudioNode) {
            // If the node has it, use it, otherwise we could add a gain node. 
            // For now, let's map to standard volume if it exists.
            if ((n as any).volume) (n as any).volume.value = Tone.gainToDb(params.outputGain);
        }

        if (n instanceof Tone.Oscillator) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.05)
            if (params.type) n.set({ oscillator: { type: params.type } } as any)
            if (params.detune) n.detune.value = params.detune
            if (params.phase) n.phase = params.phase
        }
        else if (n instanceof Tone.Filter) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.05)
            if (params.Q) n.Q.rampTo(params.Q, 0.05)
            if (params.type) n.type = params.type
            if (params.slope) n.set({ rolloff: params.slope } as any)
        }
        else if (n instanceof Tone.Envelope) {
            if (params.attack) n.attack = params.attack
            if (params.decay) n.decay = params.decay
            if (params.sustain) n.sustain = params.sustain
            if (params.release) n.release = params.release
            if (params.attackCurve) n.attackCurve = params.attackCurve
        }
        else if (n instanceof Tone.Compressor) {
            if (params.threshold) n.threshold.value = params.threshold
            if (params.ratio) n.ratio.value = params.ratio
            if (params.attack) n.attack.value = params.attack
            if (params.release) n.release.value = params.release
            if (params.knee) n.knee.value = params.knee
        }
        else if (n instanceof Tone.FeedbackDelay) {
            if (params.delayTime) n.delayTime.rampTo(params.delayTime, 0.05)
            if (params.feedback) n.feedback.rampTo(params.feedback, 0.05)
            if (params.mix !== undefined) n.wet.value = params.mix;
        }
        else if (n instanceof Tone.Reverb) {
            if (params.decay) n.decay = params.decay
            if (params.mix !== undefined) n.wet.value = params.mix
        }
        else if (n instanceof Tone.PitchShift) {
            if (params.pitch !== undefined) n.pitch = params.pitch;
            if (params.windowSize) n.windowSize = params.windowSize;
            if (params.feedback) n.feedback.value = params.feedback;
        }
        else if (n instanceof Tone.Distortion) {
            if (params.drive !== undefined) n.distortion = params.drive;
            if (params.wet !== undefined) n.wet.value = params.wet;
        }
        else if (n instanceof Tone.Limiter) {
            if (params.threshold !== undefined) n.threshold.value = params.threshold;
        }
        else if (n instanceof Tone.BitCrusher) {
            if (params.bits !== undefined) n.bits.value = params.bits;
            if (params.wet !== undefined) n.wet.value = params.wet;
        }
        else if (n instanceof Tone.Phaser) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.05)
            if (params.wet !== undefined) n.wet.value = params.wet
        }
    }

    static updateScript(id: string, code: string) {
        const wrap = audioNodes.get(id)
        if (!wrap) return

        if (wrap.node instanceof AudioWorkletNode) {
            if ((wrap.node as any).nodeRole === 'expression') {
                wrap.node.port.postMessage({ type: 'compile', formula: code })
            } else if ((wrap.node as any).nodeRole === 'script') {
                wrap.node.port.postMessage({ type: 'compile', code })
            }
            return
        }

        if (!(wrap.node instanceof ScriptProcessorNode)) return
        try {
            const factory = new Function('memory', 'console', `
                ${code}
                return { init: typeof init !== 'undefined' ? init : null, process: typeof process !== 'undefined' ? process : null }
            `)
            const lib = factory((wrap.node as any)._memory, console)
            if (lib.init && typeof lib.init === 'function') lib.init()
                ; (wrap.node as any)._userProcess = lib.process
        } catch (e) {
            console.error('Script Update Failed', e)
        }
    }

    static hasCycle(nodes: string[], edges: Edge<any>[]): boolean {
        return hasCycle(nodes, edges)
    }

    private static isReachable(target: string, source: string, adj: Map<string, string[]>): boolean {
        if (target === source) return true
        const visited = new Set<string>()
        const queue = [target]
        visited.add(target)

        while (queue.length > 0) {
            const curr = queue.shift()!
            const neighbors = adj.get(curr) || []
            for (const neighbor of neighbors) {
                if (neighbor === source) return true
                if (!visited.has(neighbor)) {
                    visited.add(neighbor)
                    queue.push(neighbor)
                }
            }
        }
        return false
    }

    static getSignalLevel(nodeId: string, handleId?: string): number {
        const wrap = audioNodes.get(nodeId)
        if (!wrap || !wrap.meters) return 0
        const meter = wrap.meters[handleId || 'out'] || wrap.meters['default']
        if (!meter) return 0
        const val = meter.getValue()
        if (Array.isArray(val)) return Math.max(...val.map(v => Math.abs(v)))
        return Math.abs(val as number)
    }

    static connectRover(nodeId: string, handleId?: string) {
        const wrap = audioNodes.get(nodeId)
        if (!wrap) return
        let source = wrap.node
        if (handleId && wrap.outputs && wrap.outputs[handleId]) {
            source = wrap.outputs[handleId]
        }
        if (source instanceof Tone.ToneAudioNode || source instanceof AudioNode) {
            try {
                source.connect(this.getRoverAnalyser() as any)
                this.currentRoverSource = source
            } catch (e) { }
        }
    }

    static disconnectRover() {
        if (this.currentRoverSource && this.roverAnalyser) {
            try {
                this.currentRoverSource.disconnect(this.roverAnalyser as any)
            } catch (e) { }
            this.currentRoverSource = null
        }
    }

    static getRoverData(): Float32Array {
        if (!this.roverAnalyser) return new Float32Array(0)
        return this.roverAnalyser.getValue() as Float32Array
    }

    static rebuildConnections(nodes: Node<NodeData>[], edges: Edge<any>[]) {
        // Safe rebuild: Disconnect all
        audioNodes.forEach(wrap => {
            if (wrap.node instanceof Tone.ToneAudioNode) wrap.node.disconnect()
            else if (wrap.node instanceof AudioNode) wrap.node.disconnect()
            if (wrap.outputs) {
                Object.keys(wrap.outputs).forEach(k => {
                    const out = wrap.outputs![k]
                    if (out instanceof Tone.ToneAudioNode) out.disconnect()
                    else if (out instanceof AudioNode) out.disconnect()
                })
            }
        })

        // 1. Collect Virtual Edges from Portals
        const portals: Record<string, { senders: string[], receivers: string[] }> = {}
        nodes.forEach(n => {
            if (n.data.type === 'io_portal_send') {
                const pid = n.data.params.portalId || 'default'
                if (!portals[pid]) portals[pid] = { senders: [], receivers: [] }
                portals[pid].senders.push(n.id)
            } else if (n.data.type === 'io_portal_receive') {
                const pid = n.data.params.portalId || 'default'
                if (!portals[pid]) portals[pid] = { senders: [], receivers: [] }
                portals[pid].receivers.push(n.id)
            }
        })

        const virtualEdges: Edge<any>[] = []
        Object.values(portals).forEach(p => {
            p.senders.forEach(sId => {
                p.receivers.forEach(rId => {
                    virtualEdges.push({ id: `v-${sId}-${rId}`, source: sId, target: rId })
                })
            })
        })

        // 2. Combine with Visual Edges and check for cycles
        const allEdges = [...edges, ...virtualEdges]
        const safeEdges: Edge<any>[] = []
        const nodeIds = Array.from(audioNodes.keys())

        const adj = new Map<string, string[]>()
        nodeIds.forEach(id => adj.set(id, []))

        allEdges.forEach(edge => {
            if (!this.isReachable(edge.target, edge.source, adj)) {
                safeEdges.push(edge)
                const neighbors = adj.get(edge.source)
                if (neighbors) neighbors.push(edge.target)
            } else {
                console.warn(`🚫 GraphEngine: Blocked feedback loop (possibly wireless) involving ${edge.source}`)
            }
        })

        // 3. Establish Physical Connections
        safeEdges.forEach(edge => {
            const srcWrap = audioNodes.get(edge.source)
            const destWrap = audioNodes.get(edge.target)
            if (srcWrap && destWrap) {
                let sourceNode = srcWrap.node
                if (srcWrap.outputs && edge.sourceHandle && srcWrap.outputs[edge.sourceHandle]) {
                    sourceNode = srcWrap.outputs[edge.sourceHandle]
                }
                const targetHandleName = edge.targetHandle || 'in'
                const targetInput = destWrap.inputs[targetHandleName]
                if (targetInput) {
                    try {
                        if (sourceNode instanceof Tone.ToneAudioNode) {
                            sourceNode.connect(targetInput as any)
                        } else if (sourceNode instanceof AudioNode) {
                            sourceNode.connect(targetInput as any)
                        }
                    } catch (e) { }
                }
            }
        })
    }

    static dispose() {
        if (this.unsubscribe) this.unsubscribe()
        if (this.aiGenTimer) {
            clearInterval(this.aiGenTimer)
            this.aiGenTimer = null
        }
        this.aiGenStates.clear()
        audioNodes.forEach(w => {
            if (w.node instanceof Tone.ToneAudioNode) w.node.dispose()
            else if (w.node instanceof AudioNode) w.node.disconnect()
        })
        audioNodes.clear()

        this.initialized = false
    }
}

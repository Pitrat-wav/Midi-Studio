import { useVisualStore } from '../../store/visualStore'

export class LaunchControlXL {
    private midiAccess: WebMidi.MIDIAccess | null = null
    private input: WebMidi.MIDIInput | null = null
    private isConnected = false

    private static readonly DEVICE_NAME_SUBSTRING = "Launch Control XL"

    // Mapping constants for Launch Control XL (Factory Template 1)
    private static readonly FADERS = [77, 78, 79, 80, 81, 82, 83, 84] // Faders 1-8
    private static readonly KNOBS_ROW_1 = [13, 14, 15, 16, 17, 18, 19, 20] // Top Row
    private static readonly KNOBS_ROW_2 = [29, 30, 31, 32, 33, 34, 35, 36] // Middle Row
    private static readonly KNOBS_ROW_3 = [49, 50, 51, 52, 53, 54, 55, 56] // Bottom Row
    private static readonly BUTTONS_ROW_1 = [41, 42, 43, 44, 57, 58, 59, 60] // Track Focus
    private static readonly BUTTONS_ROW_2 = [73, 74, 75, 76, 89, 90, 91, 92] // Track Control

    constructor() { }

    async init() {
        if (!navigator.requestMIDIAccess) {
            console.warn("Web MIDI API not supported")
            return
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess()
            this.midiAccess.onstatechange = (e) => this.handleDeviceConnection(e)

            // Initial check
            this.detectDevice()

            console.log("🎹 Launch Control XL Service Started")
        } catch (err) {
            console.error("Failed to access MIDI", err)
        }
    }

    private detectDevice() {
        if (!this.midiAccess) return

        for (const input of this.midiAccess.inputs.values()) {
            if (input.name && input.name.includes(LaunchControlXL.DEVICE_NAME_SUBSTRING)) {
                this.connectDevice(input)
                return
            }
        }
    }

    private handleDeviceConnection(e: WebMidi.MIDIConnectionEvent) {
        if (!e.port.name || !e.port.name.includes(LaunchControlXL.DEVICE_NAME_SUBSTRING)) return

        if (e.port.type === 'input' && e.port.state === 'connected') {
            this.connectDevice(e.port as WebMidi.MIDIInput)
        } else if (e.port.type === 'input' && e.port.state === 'disconnected') {
            this.disconnectDevice()
        }
    }

    private connectDevice(input: WebMidi.MIDIInput) {
        if (this.isConnected) return

        this.input = input
        this.input.onmidimessage = (msg) => this.handleMIDIMessage(msg)
        this.isConnected = true
        console.log(`✅ Connected to ${input.name}`)

        // Notify user via console or potentially HUD 
        // (could add a toast notification system later)
    }

    private disconnectDevice() {
        if (!this.isConnected) return

        if (this.input) {
            this.input.onmidimessage = null
            this.input = null
        }
        this.isConnected = false
        console.log("❌ Launch Control XL Disconnected")
    }

    private handleMIDIMessage(msg: WebMidi.MIDIMessageEvent) {
        const [status, data1, data2] = msg.data
        const visual = useVisualStore.getState()

        // CC Messages (Knobs, Faders)
        if ((status & 0xF0) === 0xB0) {
            this.mapCC(data1, data2 / 127.0, visual)
        }
        // Note On (Buttons)
        else if ((status & 0xF0) === 0x90 && data2 > 0) {
            this.mapNoteOn(data1, visual)
        }
    }

    private mapCC(cc: number, value: number, visual: any) {
        // FADERS: Intensity and General Levels
        if (LaunchControlXL.FADERS.includes(cc)) {
            const index = LaunchControlXL.FADERS.indexOf(cc)
            switch (index) {
                case 7: // Rightmost fader - Global Intensity
                    visual.setAudioIntensity(value)
                    break
                case 0: // Leftmost fader - Speed
                    visual.setVisualParams({ speed: value * 2.0 })
                    break
                case 1: // Fader 2 - Detail
                    visual.setVisualParams({ detail: value })
                    break
            }
        }

        // KNOBS ROW 1 (Top): Visual Modifier X/Y
        if (LaunchControlXL.KNOBS_ROW_1.includes(cc)) {
            const index = LaunchControlXL.KNOBS_ROW_1.indexOf(cc)
            if (index === 0) { // Knob 1 - Modifier X
                visual.setVisualModifier((value - 0.5) * 2, visual.visualModifier.y)
            } else if (index === 1) { // Knob 2 - Modifier Y
                visual.setVisualModifier(visual.visualModifier.x, (value - 0.5) * 2)
            }
        }

        // KNOBS ROW 3 (Bottom): Specific Triggers as Continuous
        if (LaunchControlXL.KNOBS_ROW_3.includes(cc)) {
            const index = LaunchControlXL.KNOBS_ROW_3.indexOf(cc)
            // ... can map more params here
        }
    }

    private mapNoteOn(note: number, visual: any) {
        // BUTTONS ROW 2 (Track Control): Triggers
        if (LaunchControlXL.BUTTONS_ROW_2.includes(note)) {
            const index = LaunchControlXL.BUTTONS_ROW_2.indexOf(note)
            switch (index) {
                case 0: // Button 1 - Cycle Visualizer Prev
                    visual.cycleVisualizer(-1)
                    break
                case 1: // Button 2 - Cycle Visualizer Next
                    visual.cycleVisualizer(1)
                    break
                case 3: // Button 4 - RESET
                    visual.resetVisuals()
                    break
                case 4: // Button 5 - Glitch Pulse
                    visual.triggerPulse('visual_shift', 1.0)
                    break
                case 7: // Button 8 - Random Background
                    visual.cycleBackgroundPreset()
                    break
            }
        }
    }
}

export const launchControlXL = new LaunchControlXL()

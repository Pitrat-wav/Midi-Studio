/**
 * GamepadManager — PlayStation 5 (DualSense) Support
 * 
 * Objectives:
 * 1. Monitor Gamepad connection.
 * 2. Map DualSense buttons to MIDI Studio controls.
 * 3. Provide haptic feedback where available.
 * 4. Run polling loop for sticks.
 */

import { useAudioStore } from '../store/audioStore'
import { useVisualStore } from '../store/visualStore'
import * as Tone from 'tone'

class GamepadManagerClass {
    private gamepadIndex: number | null = null
    private rafId: number | null = null
    private lastButtons: boolean[] = []

    // DualSense Mapping (Standard API)
    // 0: Cross, 1: Circle, 2: Square, 3: Triangle
    // 4: L1, 5: R1, 6: L2, 7: R2
    // 8: Create (Share), 9: Options, 10: L3, 11: R3
    // 12: D-Pad Up, 13: D-Pad Down, 14: D-Pad Left, 15: D-Pad Right
    // 16: PS Button, 17: Touchpad Click

    init() {
        window.addEventListener("gamepadconnected", (e) => {
            console.log("🎮 Gamepad connected:", e.gamepad.id)
            this.gamepadIndex = e.gamepad.index
            this.startLoop()
        })

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("🎮 Gamepad disconnected")
            this.gamepadIndex = null
            if (this.rafId) cancelAnimationFrame(this.rafId)
        })
    }

    private startLoop() {
        const loop = () => {
            this.update()
            this.rafId = requestAnimationFrame(loop)
        }
        loop()
    }

    private update() {
        if (this.gamepadIndex === null) return
        const gp = navigator.getGamepads()[this.gamepadIndex]
        if (!gp) return

        const audio = useAudioStore.getState()
        const visual = useVisualStore.getState()

        // Handle Buttons
        gp.buttons.forEach((btn, i) => {
            const pressed = btn.pressed
            const wasPressed = this.lastButtons[i]
            if (pressed && !wasPressed) {
                if (visual.appView === 'VISUALIZER') {
                    this.handleVisualizerButtons(i, visual)
                } else {
                    this.handleStudioButtons(i, audio, visual)
                }
            }
            this.lastButtons[i] = pressed
        })

        // Handle Sticks & Triggers
        if (visual.appView === 'VISUALIZER') {
            this.handleVisualizerSticks(gp, visual)
        } else {
            this.handleStudioSticks(gp, audio, visual)
        }
    }

    public getStick(stick: 'left' | 'right'): { x: number, y: number } {
        if (this.gamepadIndex === null) return { x: 0, y: 0 }
        const gp = navigator.getGamepads()[this.gamepadIndex]
        if (!gp) return { x: 0, y: 0 }

        const deadzone = 0.1
        let x = 0, y = 0

        if (stick === 'left') {
            x = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0
            y = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0 // Up is -1 usually
        } else {
            x = Math.abs(gp.axes[2]) > deadzone ? gp.axes[2] : 0
            y = Math.abs(gp.axes[3]) > deadzone ? gp.axes[3] : 0
        }
        return { x, y }
    }

    private handleStudioButtons(index: number, audio: any, visual: any) {
        switch (index) {
            case 0: // Cross (X) - Play/Stop
                audio.togglePlay()
                this.vibrate(50, 0.5)
                break
            case 1: // Circle (O) - Mute Current
                if (visual.focusInstrument) {
                    audio.toggleMute(visual.focusInstrument)
                    this.vibrate(30, 0.3)
                }
                break
            case 2: // Square (□) - Toggle Overview
                if (visual.focusInstrument) visual.setFocusInstrument(null)
                else visual.setFocusInstrument('master')
                this.vibrate(20, 0.2)
                break
            case 3: // Triangle (Δ) - PANIC
                audio.panic()
                this.vibrate(100, 1.0)
                break
            case 4: // L1 - Prev instrument
                this.cycleInstrument(-1, visual)
                break
            case 5: // R1 - Next instrument
                this.cycleInstrument(1, visual)
                break
            case 8: // Share/Create - Prev View (removed, now only Options cycles)
            case 9: // Options - Cycle View (3D > Nodes > Live > Arrange > Visualizer)
                visual.cycleView()
                this.vibrate(60, 0.6)
                break
            case 12: // D-Pad Up - Cycle BG
                visual.cycleBackgroundPreset()
                this.vibrate(20, 0.5)
                break
            case 14: // D-Pad Left - BPM Down
                audio.setBpm(audio.bpm - 1)
                break
            case 15: // D-Pad Right - BPM Up
                audio.setBpm(audio.bpm + 1)
                break
            case 17: // Touchpad Click - Go to Visualizer
                visual.setAppView('VISUALIZER')
                this.vibrate(80, 0.7)
                break
        }
    }

    private handleVisualizerButtons(index: number, visual: any) {
        switch (index) {
            case 0: // Cross (X) - TRIGGER: SHIFT COLORS
                visual.triggerPulse('visual_shift', 1.0)
                this.vibrate(30, 0.3)
                break
            case 1: // Circle (O) - TRIGGER: FEEDBACK SCALE
                visual.triggerPulse('visual_scale', 1.0)
                this.vibrate(30, 0.3)
                break
            case 2: // Square (□) - TRIGGER: INVERT
                visual.triggerPulse('visual_invert', 1.0)
                this.vibrate(30, 0.3)
                break
            case 3: // Triangle (Δ) - GLITCH PULSE
                visual.setAudioIntensity(1.5)
                this.vibrate(100, 1.0)
                break
            case 4: // L1 - Prev Visualizer
                visual.cycleVisualizer(-1)
                this.vibrate(40, 0.4)
                break
            case 5: // R1 - Next Visualizer
                visual.cycleVisualizer(1)
                this.vibrate(40, 0.4)
                break
            case 9: // Options - Return to 3D
                visual.setAppView('3D')
                this.vibrate(60, 0.6)
                break
            case 12: // D-Pad Up - Increase DETAIL
                visual.setVisualParams({ detail: Math.min(1.0, visual.visualDetail + 0.1) })
                this.vibrate(20, 0.4)
                break
            case 13: // D-Pad Down - Decrease DETAIL
                visual.setVisualParams({ detail: Math.max(0.0, visual.visualDetail - 0.1) })
                this.vibrate(20, 0.4)
                break
            case 14: // D-Pad Left - Decrease SPEED
                visual.setVisualParams({ speed: Math.max(0.1, visual.visualSpeed - 0.1) })
                this.vibrate(15, 0.3)
                break
            case 15: // D-Pad Right - Increase SPEED
                visual.setVisualParams({ speed: Math.min(2.0, visual.visualSpeed + 0.1) })
                this.vibrate(15, 0.3)
                break
            case 17: // Touchpad Click - Return to Studio
                visual.setAppView('3D')
                this.vibrate(80, 0.7)
                break
        }
    }

    private handleStudioSticks(gp: Gamepad, audio: any, visual: any) {
        // Right Stick Y (Axis 3) for BPM
        const rsY = gp.axes[3]
        if (Math.abs(rsY) > 0.15) {
            const newBpm = Math.max(60, Math.min(240, audio.bpm - rsY * 1.5))
            audio.setBpm(Math.round(newBpm))
        }

        // Left Stick (Axes 0, 1) usually handled by CameraController in 3D mode
    }

    private handleVisualizerSticks(gp: Gamepad, visual: any) {
        // R2 Trigger for Intensity Boost
        const r2 = gp.buttons[7].value
        if (r2 > 0.05) {
            visual.setAudioIntensity(visual.globalAudioIntensity + r2 * 0.15)
        }

        // L2 Trigger for Intensity Reduction
        const l2 = gp.buttons[6].value
        if (l2 > 0.05) {
            visual.setAudioIntensity(Math.max(0, visual.globalAudioIntensity - l2 * 0.15))
        }

        // Left Stick (Axes 0, 1) for Visual Modifier (Movement/Warp)
        const lsX = gp.axes[0]
        const lsY = gp.axes[1]
        if (Math.abs(lsX) > 0.05 || Math.abs(lsY) > 0.05) {
            visual.setVisualModifier(lsX, lsY)
        }

        // Right Stick Y (Axis 3) for Zoom modulation
        const rsY = gp.axes[3]
        if (Math.abs(rsY) > 0.05) {
            // Can be mapped to a specific uniform in shaders
        }
    }

    private cycleInstrument(dir: number, visual: any) {
        const instruments: any[] = ['drums', 'bass', 'harmony', 'pads', 'sampler', 'buchla', 'drone', 'master']
        const current = visual.focusInstrument
        let nextIndex = 0

        if (current) {
            const idx = instruments.indexOf(current)
            nextIndex = (idx + dir + instruments.length) % instruments.length
        } else {
            nextIndex = dir > 0 ? 0 : instruments.length - 1
        }

        visual.setFocusInstrument(instruments[nextIndex])
        this.vibrate(40, 0.4)
    }

    private vibrate(duration: number, intensity: number) {
        const gp = navigator.getGamepads()[this.gamepadIndex!]
        if (gp && gp.vibrationActuator) {
            (gp.vibrationActuator as any).playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: intensity,
                strongMagnitude: intensity
            })
        }
    }
}

export const GamepadManager = new GamepadManagerClass()
// Auto-init helper if needed, but best called explicitly


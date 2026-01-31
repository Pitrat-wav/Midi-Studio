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

        // 1. Handle Buttons (Discrete Actions)
        gp.buttons.forEach((btn, i) => {
            const pressed = btn.pressed
            const wasPressed = this.lastButtons[i]

            if (pressed && !wasPressed) {
                this.onButtonDown(i, audio, visual)
            }
            this.lastButtons[i] = pressed
        })

        // 2. Handle Sticks (Continuous Modulation)
        // Right Stick Y (Axis 3) for BPM
        const rsY = gp.axes[3]
        if (Math.abs(rsY) > 0.1) {
            const newBpm = Math.max(60, Math.min(240, audio.bpm - rsY * 2))
            audio.setBpm(Math.round(newBpm))
        }

        // Left Stick for Camera Movement (handled by CameraController if integrated, 
        // but here we can emit status messages or small tweaks)
    }

    private onButtonDown(index: number, audio: any, visual: any) {
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

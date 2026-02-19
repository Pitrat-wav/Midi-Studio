# 🎹 Midi-Studio — 80 Prompts for Jules to Fix All Knobs

## 📋 Overview

This document contains **80 detailed prompts** for Jules to fix all knob controls (2D and 3D) in the Midi-Studio project to work properly in 3D mode.

## 🎯 Current Problem

**2D knobs in StudioScreen components (BassScreen, DrumsScreen, etc.) do not work when user is in 3D mode.** They use `<input type="range">` which doesn't receive pointer events correctly in the 3D canvas context.

## 📁 File Structure

```
PROMPTS_FOR_JULES_1-15.md    — Critical 2D knob bugs (P0)
PROMPTS_FOR_JULES_16-30.md   — 3D Knob3D component fixes (P1)
PROMPTS_FOR_JULES_31-40.md   — GenerativeKnob3D fixes (P2)
PROMPTS_FOR_JULES_41-55.md   — Instrument-specific knobs (P0-P2)
PROMPTS_FOR_JULES_56-65.md   — GestureManager integration (P2)
PROMPTS_FOR_JULES_66-72.md   — CameraController fixes (P2)
PROMPTS_FOR_JULES_73-80.md   — MIDI integration (P3)
```

## 🔥 Priority Levels

### P0 (Critical) — Fix First
- **Prompts 1-2:** BassScreen & DrumsScreen 2D knobs don't work
- **Prompts 16-18:** 3D Knob3D geometry and rotation fixes
- **Prompts 41-45:** Instrument-specific knob fixes (AcidSynth, DrumMachine, MasterControl, PadsSynth)

### P1 (Important) — Fix Second
- **Prompts 3-15:** Remaining 2D knob fixes (visual feedback, haptics, touch support)
- **Prompts 19-30:** 3D Knob3D polish (smooth interpolation, pointer capture, shadows)

### P2 (Medium) — Fix Third
- **Prompts 31-40:** GenerativeKnob3D improvements
- **Prompts 46-55:** More instrument-specific knobs
- **Prompts 56-65:** GestureManager integration
- **Prompts 66-72:** CameraController fixes

### P3 (Optional) — Fix Last
- **Prompts 73-80:** MIDI integration (CC mapping, learn mode, sync)

## 🚀 How to Use

1. **Start with P0 prompts** — These fix the critical "nothing works" issues
2. **Proceed to P1** — These make the fixes polished and usable
3. **Continue with P2** — These add advanced features and better UX
4. **Finish with P3** — These add MIDI support for power users

## 📊 Summary by Category

| Category | Prompts | Files Affected | Priority |
|----------|---------|----------------|----------|
| 2D Knob Critical Bugs | 1-15 | `HUD/StudioScreen.tsx`, `HUD/BassScreen.tsx`, `HUD/DrumsScreen.tsx` | P0-P1 |
| 3D Knob3D Component | 16-30 | `WebGL/controls/Knob3D.tsx` | P1 |
| GenerativeKnob3D | 31-40 | `WebGL/GenerativeKnob3D.tsx` | P2 |
| Instrument Knobs | 41-55 | `WebGL/instruments/*.tsx` | P0-P2 |
| GestureManager | 56-65 | `logic/GestureManager.ts` | P2 |
| CameraController | 66-72 | `WebGL/CameraController.tsx` | P2 |
| MIDI Integration | 73-80 | `store/audioStore.ts`, components | P3 |

## 🎯 Expected Outcome

After all 80 prompts are implemented:

1. ✅ **All 2D knobs work in 3D mode** — Pointer events, drag, value updates
2. ✅ **All 3D knobs work properly** — Smooth rotation, visual feedback
3. ✅ **Haptic feedback on all interactions** — Telegram WebApp integration
4. ✅ **Gesture integration** — Drag, swipe, two-swipe navigation
5. ✅ **Camera blocking** — Camera doesn't interfere when adjusting knobs
6. ✅ **MIDI support** — CC mapping, learn mode, bidirectional sync

## 🛠️ Key Files to Modify

```
src/components/HUD/StudioScreen.tsx      — 2D StudioKnob component
src/components/HUD/BassScreen.tsx        — Uses StudioKnob
src/components/HUD/DrumsScreen.tsx       — Uses StudioKnob
src/components/WebGL/controls/Knob3D.tsx — 3D knob component
src/components/WebGL/GenerativeKnob3D.tsx — Alternative 3D knob
src/logic/GestureManager.ts              — Gesture detection
src/components/WebGL/CameraController.tsx — Camera management
src/store/visualStore.ts                 — activeParam state
src/store/audioStore.ts                  — MIDI CC mapping
```

## 📞 Contact

For questions about these prompts, refer to the Midi-Studio repository:
https://github.com/Pitrat-wav/Midi-Studio

---

**Generated:** 2026-02-19
**Total Prompts:** 80
**Status:** Ready for Jules to execute

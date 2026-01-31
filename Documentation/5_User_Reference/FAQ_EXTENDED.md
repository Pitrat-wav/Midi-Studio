# 5.1 Extended FAQ & Reference

Frequently asked questions regarding the MIDI Studio and synthetic music generation.

## Audio & Synthesis
### Q: Why is the HarmSynth mono?
**A:** To maximize CPU efficiency within the Telegram WebApp environment. Future updates may include a stereo voice-stacking toggle.

### Q: How do I change the scale?
**A:** The scale is currently hardcoded to `C Minor Pentatonic` for aesthetic consistency. You can modify this in `src/logic/CompositionManager.ts`.

## 3D Environment
### Q: The site is lagging. What do I do?
**A:** Close background tabs and ensure Hardware Acceleration is enabled in your browser settings. The studio uses high-fidelity WebGL shaders.

### Q: Can I move the instruments?
**A:** Navigation is restricted to pre-set camera angles to ensure perfect spatial audio positioning.

## MIDI Data
### Q: Where do the MIDI files go?
**A:** MIDI files are generated in-memory and offered for download through your browser's standard download manager.

### Q: Does it export automation?
**A:** Only for the modular synth (`HarmSynth`) parameters. Drum knob positions are currently not mapped to MIDI CC.

---
name: ToneJS Sound
description: Глубокое понимание аудиродвижка Tone.js и синтеза звука.
---

# Навык: Звук Tone.js

## 🔊 Audio Graph
- **Цепочка**: Source -> Effects -> Master -> Destination.
- **Schedule**: Используй `Tone.Transport.scheduleRepeat` для ритмических событий.
- **Latency**: Учитывай `lookAhead`. Не обновляй UI синхронно с аудио.

## 🎹 Синтез
- **Synth**: Используй `Tone.PolySynth` для аккордов, `Tone.MonoSynth` для баса.
- **BPM**: Меняй через `Tone.Transport.bpm.rampTo()` для плавности.

## ⚠️ Важно
- **Silent Switch (iOS)**: Аудио-контекст должен стартовать ТОЛЬКО по клику юзера. Используй `Tone.start()`.
- **Memory**: Вызывай `.dispose()` для удаленных синтов, иначе утечет память.

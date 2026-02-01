---
name: Performance Lab
description: Стратегии оптимизации FPS и памяти.
---

# Навык: Лаборатория Производительности

## ⚡️ Three.js Tips
- **Draw Calls**: Минимизируй. Объединяй меши (Merge) или используй Instancing.
- **Textures**: Сжимай текстуры (WebP, KTX2).
- **Lights**: Тени очень дорогие. Используй запеченный свет (Lightmaps) где возможно.

## 🔊 Tone.js Tips
- **Dispose**: Всегда удаляй синты (`synth.dispose()`) при размонтировании компонента.
- **Scheduling**: Не планируй тысячи событий заранее. Используй Lookahead.

## 📉 React Tips
- **Memo**: `React.memo` для тяжелых UI компонентов.
- **Profling**: Используй React DevTools Profiler для поиска лишних рендеров.

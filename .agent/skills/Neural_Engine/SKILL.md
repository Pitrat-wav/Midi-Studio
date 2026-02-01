---
name: Neural Engine
description: Работа с AI модулями (HuggingFace + MediaPipe).
---

# Навык: Нейронный Движок

## 👁 MediaPipe (Vision)
- **Use Case**: Распознавание рук (Hand Tracking) для управления 3D интерфейсом.
- **Хук**: `useHandTracking.ts`. Создаёт видео-элемент, запускает цикл детекции.
- **Оптимизация**: Запускать детекцию не чаще, чем нужно (throttling), иначе перегреется.

## 🎨 Hugging Face (GenAI)
- **Use Case**: Генерация текстур для планет и инструментов.
- **API**: Использует `HfInference` (Stable Diffusion).
- **Безопасность**: Ключи хранятся в `aiStore` (локально, не в коде).

## 🔮 Будущее
- Голосовые команды (Speech-to-Text).
- Генерация MIDI через MusicGen.

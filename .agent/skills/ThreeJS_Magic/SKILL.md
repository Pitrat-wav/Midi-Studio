---
name: ThreeJS Magic
description: Магия 3D графики, оптимизация R3F и шейдеров.
---

# Навык: Магия Three.js

## 🌠 Производительность (FPS)
- **Instancing**: Если объектов больше 50 (например, звезды, частицы) — используй `InstancedMesh`.
- **Geometry**: Переиспользуй геометрию. Не создавай `new BoxGeometry` в рендере.
- **Material**: Переиспользуй материалы.

## 🎥 Камера и Контролы
- Используй `OrbitControls` для дебага, но `PointerLockControls` или кастомный `FirstPerson` для игры.
- **Lerp**: Все движения камеры должны быть плавными (Linear Interpolation).

## 🔮 Шейдеры
- Используй `shaderMaterial` из `@react-three/drei` для создания уникальных эффектов (планеты, щиты).
- Передавай время (`uTime`) через `useFrame`.

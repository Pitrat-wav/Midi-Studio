import React from 'react'
import './FAQ.css'

interface FAQProps {
    onClose: () => void
}

export function FAQ({ onClose }: FAQProps) {
    return (
        <div className="faq-overlay">
            <div className="faq-content glass">
                <button className="faq-close" onClick={onClose}>✕</button>
                <h1>🌌 MIDI Studio Pro FAQ & Guide</h1>

                <section>
                    <h2>🎹 Навигация (Navigation)</h2>
                    <ul>
                        <li><strong>Пробел (Space)</strong>: Запуск / Остановка основного секвенсора.</li>
                        <li><strong>Клавиши 1-7</strong>: Переключение между "станциями" (инструментами).</li>
                        <li><strong>Клавиша 0</strong>: Режим "Обзор" (вид на всю студию).</li>
                        <li><strong>Клавиша H</strong>: Скрыть / Показать интерфейс (HUD).</li>
                        <li><strong>Мышь (Mouse)</strong>: Вращение камеры и управление ручками (Knobs).</li>
                    </ul>
                </section>

                <section>
                    <h2>🎛️ Станции (Stations)</h2>
                    <ul>
                        <li><strong>Drums (1)</strong>: Драм-машина с эвклидовыми ритмами.</li>
                        <li><strong>Bass (2)</strong>: Кислотный и FM бас.</li>
                        <li><strong>Harmony (3)</strong>: Модульный синтезатор Buchla 259.</li>
                        <li><strong>Pads (4)</strong>: Атмосферные текстуры.</li>
                        <li><strong>Sequencer (5)</strong>: Хаб (Turing Machine, ML-185, Snake).</li>
                        <li><strong>Drone (6)</strong>: Генератор хаотичных дронов.</li>
                        <li><strong>Master (7)</strong>: Глобальные эффекты и темп.</li>
                    </ul>
                </section>

                <section>
                    <h2>🚀 Советы (Tips)</h2>
                    <p>На каждой станции есть кнопка <strong>"LOCAL"</strong> или <strong>"PLAY"</strong> для управления конкретным инструментом. Вы также можете нажать на 3D-ручки и тянуть их мышкой вверх/вниз для изменения параметров.</p>
                </section>

                <div className="faq-footer">
                    <p>Создано командой MIDI Studio Pro 3D</p>
                </div>
            </div>
        </div>
    )
}

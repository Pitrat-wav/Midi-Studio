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
                <h1>🎹 Управление и Горячие Клавиши</h1>
                <p className="subtitle">Полный список команд клавиатуры для MIDI Studio Pro 3D</p>

                <div className="shortcuts-grid">
                    <section>
                        <h2>🎵 Основное (Transport)</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td><kbd>Пробел</kbd></td>
                                    <td>Старт / Стоп аудио движка</td>
                                </tr>
                                <tr>
                                    <td><kbd>H</kbd></td>
                                    <td>Скрыть / Показать интерфейс (HUD)</td>
                                </tr>
                                <tr>
                                    <td><kbd>?</kbd></td>
                                    <td>Показать это окно помощи</td>
                                </tr>
                                <tr>
                                    <td><kbd>P</kbd></td>
                                    <td><strong>PANIC</strong> (Экстренная остановка звука)</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2>🚀 Навигация (Navigation)</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td><kbd>WASD</kbd></td>
                                    <td>Полет камеры (Fly Mode)</td>
                                </tr>
                                <tr>
                                    <td><kbd>Q</kbd> / <kbd>E</kbd></td>
                                    <td>Вращение камеры</td>
                                </tr>
                                <tr>
                                    <td><kbd>0</kbd></td>
                                    <td>Общий обзор (Overview)</td>
                                </tr>
                                <tr>
                                    <td><kbd>1</kbd> - <kbd>9</kbd></td>
                                    <td>Переход к инструментам</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mini-legend">
                            1:Drums 2:Bass 3:Harm 4:Pads 5:Seq 6:ML185 7:Snake 8:Drone 9:Master
                        </div>
                    </section>

                    <section>
                        <h2>🎛️ Параметры (Controls)</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td><kbd>M</kbd></td>
                                    <td>Заглушить (Mute) текущий инструмент</td>
                                </tr>
                                <tr>
                                    <td><kbd>[</kbd> / <kbd>]</kbd></td>
                                    <td>Громкость (Master Volume)</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="hint">
                            * Mute работает только когда выбран инструмент
                        </p>
                    </section>
                </div>

                <section className="faq-tips">
                    <h3>💡 Советы</h3>
                    <ul>
                        <li><strong>Микрофон:</strong> Нажмите <strong>MIC: OFF</strong> в углу экрана, чтобы включить вокодер.</li>
                        <li><strong>Управление руками:</strong> Включите <strong>VISION: ON</strong> для жестового управления через веб-камеру.</li>
                        <li><strong>3D Ручки:</strong> Нажмите на любую ручку мышкой и тяните вверх/вниз для плавной настройки.</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}

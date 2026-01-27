import { Info, Music, Zap, Layers, PlayCircle } from 'lucide-react'

export function HelpView() {
    return (
        <div className="help-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Info size={24} color="var(--tg-theme-button-color)" />
                    <h2 style={{ margin: 0 }}>Как это работает?</h2>
                </div>
                <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                    Telegram MIDI Studio — это полноценная мобильная рабочая станция для создания музыки.
                    Она состоит из нескольких независимых модулей, которые работают синхронно.
                </p>
            </section>

            <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <PlayCircle size={20} />
                    <h3 style={{ margin: 0 }}>1. Движок (Engine)</h3>
                </div>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>
                    При нажатии на кнопку "Запустить движок", активируется аудио-контекст браузера.
                    Это дает разрешение приложению извлекать звуки. Без этого шага музыка играть не будет.
                </p>
            </section>

            <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Music size={20} />
                    <h3 style={{ margin: 0 }}>2. Инструменты</h3>
                </div>
                <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px' }}>
                        <strong>Ударные (Drums):</strong> Евклидов секвенсор для создания ритмов.
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px' }}>
                        <strong>Бас (Bass):</strong> Генератор "жалящих" линий в стиле Acid или FM.
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px' }}>
                        <strong>Секвенсоры:</strong> ML-185, Snake и Turing Machine управляют синтезатором Lead.
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px' }}>
                        <strong>Smart Chord:</strong> Превращает одну ноту в полноценный аккорд.
                        <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
                            <strong>Как это работает:</strong><br />
                            1. Приложение берет ноту из секвенсора.<br />
                            2. Если нота не попадает в выбранный лад (Scale), она "притягивается" к ближайшей правильной ноте (Snap).<br />
                            3. Считается ступень этой ноты в гамме (например, 1-я, 3-я или 5-я).<br />
                            4. Строится аккорд, просто "перешагивая" через одну ноту в гамме. Так получается гармония, которая всегда звучит правильно.
                        </div>
                    </div>
                </div>
            </section>

            <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Zap size={20} />
                    <h3 style={{ margin: 0 }}>3. Управление звуком</h3>
                </div>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>
                    Вкладка <strong>Mixer</strong> позволяет регулировать громкость каждого инструмента.
                    Если вы не слышите звук, убедитесь, что фейдер инструмента и основной звук на телефоне прибавлены.
                </p>
            </section>

            <section className="card" style={{ background: 'var(--tg-theme-button-color)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Layers size={24} />
                    <div>
                        <h3 style={{ margin: 0 }}>Совет</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                            Используйте <strong>Smart Chord</strong> вместе с <strong>Turing Machine</strong> для
                            мгновенного создания эмбиент-гармоний.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

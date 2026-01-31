// ТЕСТОВЫЙ СКРИПТ - запустить в консоли браузера
// Копируйте и вставьте это в Console

console.log('=== ДИАГНОСТИКА TONE.JS ===')
console.log('Transport state:', Tone.Transport.state)
console.log('Transport BPM:', Tone.Transport.bpm.value)
console.log('Context state:', Tone.context.state)

// Попытка запустить Transport НАПРЯМУЮ
console.log('Пытаюсь запустить Transport...')
Tone.Transport.start()

setTimeout(() => {
    console.log('После 1 секунды:')
    console.log('  Transport state:', Tone.Transport.state)
    console.log('  Transport position:', Tone.Transport.position)
}, 1000)

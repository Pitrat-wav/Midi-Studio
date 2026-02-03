// Simplified WAV worker
self.onmessage = (e) => {
    const { channelData, sampleRate } = e.data
    const length = channelData[0].length * channelData.length * 2 + 44
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)

    // Write WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i))
    }

    writeString(0, 'RIFF')
    view.setUint32(4, length - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, channelData.length, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2 * channelData.length, true)
    view.setUint16(32, channelData.length * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length - 44, true)

    // Write samples
    let offset = 44
    for (let i = 0; i < channelData[0].length; i++) {
        for (let channel = 0; channel < channelData.length; channel++) {
            const s = Math.max(-1, Math.min(1, channelData[channel][i]))
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
            offset += 2
        }
    }

    self.postMessage(new Blob([buffer], { type: 'audio/wav' }))
}

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

export function Oscilloscope() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const analyzerRef = useRef<Tone.Analyser>()

    useEffect(() => {
        const analyzer = new Tone.Analyser('waveform', 256)
        Tone.getDestination().connect(analyzer)
        analyzerRef.current = analyzer

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrame: number

        const draw = () => {
            animationFrame = requestAnimationFrame(draw)
            const values = analyzer.getValue() as Float32Array

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.beginPath()
            ctx.lineWidth = 2
            ctx.strokeStyle = 'rgba(51, 144, 236, 0.8)'

            const sliceWidth = canvas.width / values.length
            let x = 0

            for (let i = 0; i < values.length; i++) {
                const v = values[i] * 0.5
                const y = (v + 0.5) * canvas.height

                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }

                x += sliceWidth
            }

            ctx.stroke()
        }

        draw()
        return () => {
            cancelAnimationFrame(animationFrame)
            analyzer.dispose()
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={80}
            style={{
                width: '100%',
                height: '80px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.05)',
                marginTop: '16px'
            }}
        />
    )
}

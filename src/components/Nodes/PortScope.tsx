import { memo, useEffect, useRef } from 'react'
import { GraphEngine } from '../../logic/GraphEngine'

export const PortScope = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let rafId: number
        const draw = () => {
            const data = GraphEngine.getRoverData()
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw center line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.beginPath()
            ctx.moveTo(0, canvas.height / 2)
            ctx.lineTo(canvas.width, canvas.height / 2)
            ctx.stroke()

            // Draw waveform
            ctx.strokeStyle = '#4dabf7'
            ctx.lineWidth = 1.5
            ctx.shadowBlur = 4
            ctx.shadowColor = '#4dabf7'
            ctx.beginPath()

            const sliceWidth = canvas.width / data.length
            let x = 0
            for (let i = 0; i < data.length; i++) {
                const v = data[i]
                const y = (v * canvas.height / 2.2) + (canvas.height / 2)
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
                x += sliceWidth
            }
            ctx.stroke()

            rafId = requestAnimationFrame(draw)
        }
        rafId = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(rafId)
    }, [])

    return (
        <div className="port-scope-container" style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            pointerEvents: 'none',
            animation: 'fadeInOut 0.2s ease-out'
        }}>
            <canvas
                ref={canvasRef}
                width={70}
                height={40}
                style={{
                    borderRadius: '4px',
                    border: '1px solid #4dabf7',
                    boxShadow: '0 0 10px rgba(77, 171, 247, 0.4)'
                }}
            />
            <div style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid #4dabf7',
                margin: '0 auto'
            }} />
        </div>
    )
})

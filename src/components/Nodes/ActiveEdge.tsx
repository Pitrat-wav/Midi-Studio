import React, { useMemo, useRef, useEffect } from 'react'
import { EdgeProps, getBezierPath } from 'reactflow'
import { GraphEngine } from '../../logic/GraphEngine'

export const ActiveEdge: React.FC<EdgeProps> = ({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    sourceHandleId,
}) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })

    const pathRef = useRef<SVGPathElement>(null)
    const glowRef = useRef<SVGPathElement>(null)

    // Determine signal type by handle name prefix or color hint
    const isAudio = sourceHandleId?.includes('audio') || sourceHandleId === 'out' || !sourceHandleId?.includes('cv')
    const activeColor = isAudio ? '#4dabf7' : '#fab005' // Blue for audio, Orange for CV

    useEffect(() => {
        let rafId: number
        const animate = () => {
            const level = GraphEngine.getSignalLevel(source, sourceHandleId || undefined)

            if (pathRef.current) {
                // Modulate stroke width based on level (RMS)
                // Base width 2, Max width 6
                const width = 2 + Math.min(level, 1) * 6
                pathRef.current.style.strokeWidth = `${width}px`
                pathRef.current.style.stroke = level > 0.001 ? activeColor : '#444'

                // Dash offset animation for "flow"
                const offset = (Date.now() / 20) % 100
                pathRef.current.style.strokeDasharray = '10, 5'
                pathRef.current.style.strokeDashoffset = `-${offset}`
            }

            if (glowRef.current) {
                // Glow intensity based on level
                const opacity = Math.min(level * 1.5, 0.8)
                glowRef.current.style.opacity = `${opacity}`
                glowRef.current.style.strokeWidth = `${4 + level * 10}px`
            }

            rafId = requestAnimationFrame(animate)
        }

        rafId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafId)
    }, [source, sourceHandleId, activeColor])

    return (
        <>
            <path
                id={id}
                ref={glowRef}
                style={{ ...style, stroke: activeColor, fill: 'none', filter: 'blur(4px)', pointerEvents: 'none' }}
                className="react-flow__edge-path-glow"
                d={edgePath}
            />
            <path
                id={id}
                ref={pathRef}
                style={{ ...style, fill: 'none', transition: 'stroke 0.2s' }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
        </>
    )
}

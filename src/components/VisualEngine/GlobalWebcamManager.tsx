import React, { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../store/visualStore'

/**
 * GlobalWebcamManager handles a persistent webcam stream.
 * It stays mounted as long as the VisualEngine is active,
 * preventing camera teardown during visualizer switches.
 */
export function GlobalWebcamManager() {
    const setWebcamTexture = useVisualStore(s => s.setWebcamTexture)
    const setWebcamAllowed = useVisualStore(s => s.setWebcamAllowed)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const textureRef = useRef<THREE.VideoTexture | null>(null)

    useEffect(() => {
        // Initialize video element once
        const video = document.createElement('video')
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        videoRef.current = video

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                }
            })
                .then(stream => {
                    video.srcObject = stream
                    video.onloadedmetadata = () => {
                        video.play()
                        const tex = new THREE.VideoTexture(video)
                        tex.minFilter = THREE.LinearFilter
                        tex.magFilter = THREE.LinearFilter
                        textureRef.current = tex
                        setWebcamTexture(tex)
                        setWebcamAllowed(true)
                    }
                })
                .catch(err => {
                    console.error('Global Webcam Error:', err)
                    setWebcamAllowed(false)
                })
        }

        return () => {
            if (video.srcObject) {
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
            }
            setWebcamTexture(null)
            setWebcamAllowed(false)
        }
    }, [setWebcamTexture, setWebcamAllowed])

    // VideoTexture automatically updates by default in Three.js,
    // but we can ensure it stays fresh here if needed.
    useFrame(() => {
        if (textureRef.current) {
            textureRef.current.needsUpdate = true
        }
    })

    return null // Pure logic component
}

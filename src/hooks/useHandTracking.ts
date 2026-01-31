/**
 * HandTrackingManager — AI-Vision for Spatial Control
 * 
 * Objectives:
 * 1. Initialize MediaPipe Hands.
 * 2. Process webcam feed at high frequency.
 * 3. Detect "virtual contact" and "spatial gestures".
 * 4. Emit landmarks to visualStore.
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { useEffect, useRef } from 'react'
import { useVisualStore } from '../store/visualStore'

export function useHandTracking() {
    const handLandmarkerRef = useRef<HandLandmarker | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const requestRef = useRef<number>()
    const isEnabled = useVisualStore(s => s.handTrackingEnabled)
    const setHandData = useVisualStore(s => s.setHandData)

    useEffect(() => {
        if (!isEnabled) {
            cancelAnimationFrame(requestRef.current!)
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
            return
        }

        const initialize = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            )

            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2
            })

            // Setup Webcam
            const video = document.createElement('video')
            video.autoplay = true
            video.playsInline = true
            video.muted = true // Prevent feedback

            // Fullscreen background style for "Big" impact, or large overlay
            Object.assign(video.style, {
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                width: '320px', // Large PIP
                height: '240px',
                objectFit: 'cover',
                zIndex: '50',
                borderRadius: '12px',
                border: '2px solid #3390ec',
                transform: 'scaleX(-1)', // Mirror
                opacity: '0.8',
                pointerEvents: 'none'
            })

            document.body.appendChild(video)
            videoRef.current = video

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, frameRate: 60 } // Higher res
            })
            video.srcObject = stream

            video.addEventListener('loadeddata', predict)
        }

        const predict = () => {
            if (!videoRef.current || !handLandmarkerRef.current) return

            const results = handLandmarkerRef.current.detectForVideo(
                videoRef.current,
                performance.now()
            )

            if (results.landmarks && results.landmarks.length > 0) {
                // We'll take the first hand for now
                const landmarks = results.landmarks[0]
                setHandData(landmarks.map(l => ({ x: l.x, y: l.y, z: l.z })))
            } else {
                setHandData(null)
            }

            requestRef.current = requestAnimationFrame(predict)
        }

        initialize().catch(err => {
            console.error('Hand Tracking Init Failed:', err)
        })

        return () => {
            cancelAnimationFrame(requestRef.current!)
            if (videoRef.current) {
                if (videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream
                    stream.getTracks().forEach(track => track.stop())
                }
                videoRef.current.remove() // Remove from DOM
            }
        }
    }, [isEnabled, setHandData])

    return null
}

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
            videoRef.current = video

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, frameRate: 30 }
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
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [isEnabled, setHandData])

    return null
}

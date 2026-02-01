/**
 * PoseTrackingManager — AI-Vision for Skeleton Tracking
 * 
 * Objectives:
 * 1. Initialize MediaPipe Pose.
 * 2. Process webcam feed at high frequency.
 * 3. Emit skeleton landmarks to visualStore.
 */

import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { useEffect, useRef } from 'react'
import { useVisualStore } from '../store/visualStore'

export function usePoseTracking() {
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const requestRef = useRef<number>()
    const isEnabled = useVisualStore(s => s.poseTrackingEnabled)
    const setPoseData = useVisualStore(s => s.setPoseData)

    useEffect(() => {
        if (!isEnabled) {
            cancelAnimationFrame(requestRef.current!)
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
            if (videoRef.current) videoRef.current.remove()
            return
        }

        const initialize = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            )

            poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 1
            })

            // Setup Webcam
            const video = document.createElement('video')
            video.autoplay = true
            video.playsInline = true
            video.muted = true // Prevent feedback

            // Hidden video element, or we can show it for debug
            // Minimal, circular video feedback
            Object.assign(video.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '160px',
                height: '160px',
                objectFit: 'cover',
                zIndex: '50',
                borderRadius: '50%',
                border: '2px solid #3390ec',
                boxShadow: '0 0 20px rgba(51, 144, 236, 0.4)',
                transform: 'scaleX(-1)', // Mirror
                opacity: '0.8',
                pointerEvents: 'none',
                display: 'block'
            })

            document.body.appendChild(video)
            videoRef.current = video

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, frameRate: 60 }
            })
            video.srcObject = stream
            video.play()

            video.addEventListener('loadeddata', predict)
        }

        const predict = () => {
            if (!videoRef.current || !poseLandmarkerRef.current) return

            if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                const results = poseLandmarkerRef.current.detectForVideo(
                    videoRef.current,
                    performance.now()
                )

                if (results.landmarks && results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0]
                    setPoseData(landmarks.map(l => ({
                        x: l.x,
                        y: l.y,
                        z: l.z,
                        visibility: l.visibility ?? 1.0
                    })))
                } else {
                    setPoseData(null)
                }
            }

            requestRef.current = requestAnimationFrame(predict)
        }

        initialize().catch(err => {
            console.error('Pose Tracking Init Failed:', err)
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
    }, [isEnabled, setPoseData])

    return null
}

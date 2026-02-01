import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D tVideo;
  uniform sampler2D tPrev;
  uniform float uTime;
  uniform float uAudio;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    
    // Vortex displacement
    float dist = distance(uv, vec2(0.5));
    float angle = uTime * 0.1 + dist * 2.0;
    vec2 rotUv = uv + vec2(cos(angle), sin(angle)) * 0.002 * uAudio;
    
    // Feedback with slight scale and rotation
    vec2 feedbackUv = (uv - 0.5) * (0.99 - uAudio * 0.02) + 0.5;
    vec4 prev = texture2D(tPrev, feedbackUv);
    
    // Webcam input (mirrored)
    vec2 videoUv = vec2(1.0 - uv.x, uv.y);
    vec4 video = texture2D(tVideo, videoUv);
    
    // Luma key effect
    float luma = dot(video.rgb, vec3(0.299, 0.587, 0.114));
    
    // Mix based on luma and audio
    vec4 finalColor = mix(prev * 0.98, video, 0.1 + uAudio * 0.3);
    
    // Chromatic aberration in the feedback
    finalColor.r = mix(finalColor.r, texture2D(tPrev, feedbackUv + 0.005 * uAudio).r, 0.5);
    finalColor.b = mix(finalColor.b, texture2D(tPrev, feedbackUv - 0.005 * uAudio).b, 0.5);
    
    // Bloom/Glow based on audio
    finalColor.rgb += video.rgb * step(0.6, luma) * uAudio * 2.0;

    gl_FragColor = vec4(finalColor.rgb, 1.0);
  }
`

export function FeedbackVortex() {
    const { size, gl } = useThree()
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const videoRef = useRef<HTMLVideoElement>(null!)
    const targets = useMemo(() => {
        const t1 = new THREE.WebGLRenderTarget(size.width, size.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        })
        const t2 = t1.clone()
        return [t1, t2]
    }, [size])

    const readTarget = useRef(0)

    useEffect(() => {
        const video = document.createElement('video')
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        videoRef.current = video

        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 60 }
            }
        }).then(stream => {
            video.srcObject = stream
            video.play()
        }).catch(err => console.error("Webcam failed", err))

        return () => {
            if (video.srcObject) {
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    const videoTexture = useMemo(() => {
        const tex = new THREE.VideoTexture(videoRef.current || document.createElement('video'))
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        return tex
    }, [])

    const uniforms = useMemo(() => ({
        tVideo: { value: videoTexture },
        tPrev: { value: null as any },
        uTime: { value: 0 },
        uAudio: { value: 0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) }
    }), [videoTexture, size])

    useFrame((state) => {
        const { gl, scene, camera } = state

        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uAudio.value = intensity

        // First pass: render feedback
        const read = targets[readTarget.current]
        const write = targets[1 - readTarget.current]

        uniforms.tPrev.value = read.texture

        gl.setRenderTarget(write)
        gl.render(scene, camera)
        gl.setRenderTarget(null)

        readTarget.current = 1 - readTarget.current
    })

    return (
        <mesh position={[0, 0, 0]}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={false}
                depthWrite={false}
                depthTest={false}
            />
        </mesh>
    )
}

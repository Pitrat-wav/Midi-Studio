/**
 * StudioRoom.tsx — 3D Studio Environment
 * 
 * Заменяет космический фон на профессиональную музыкальную студию:
 * - Тёмное помещение с неоновым освещением
 * - Стены с панелями оборудования
 * - Пол с отражениями
 * - Трековые светильники на потолке
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioStore } from '../../store/audioStore'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'
import { RackCabinets } from './RackCabinets'

export function StudioRoom() {
    const isPlaying = useAudioStore(s => s.isPlaying)
    const bridge = useAudioVisualBridge()
    
    // Рефы для аудио-реактивных элементов
    const floorRef = useRef<THREE.Mesh>(null!)
    const ceilingLightRef = useRef<THREE.PointLight>(null!)
    const neonStripRef = useRef<THREE.Mesh>(null!)
    
    // Аудио-реактивное освещение
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        
        // Пульсация неонового освещения в ритме музыки
        const kickPulse = bridge.getPulse('kick') * 0.5
        const snarePulse = bridge.getPulse('snare') * 0.3
        
        if (ceilingLightRef.current) {
            ceilingLightRef.current.intensity = THREE.MathUtils.lerp(
                ceilingLightRef.current.intensity,
                0.5 + kickPulse + snarePulse,
                0.1
            )
        }
        
        // Мерцание неоновых полос
        if (neonStripRef.current) {
            const material = neonStripRef.current.material as THREE.MeshBasicMaterial
            material.opacity = THREE.MathUtils.lerp(
                material.opacity,
                0.8 + kickPulse * 0.2,
                0.05
            )
        }
        
        // Отражения на полу
        if (floorRef.current) {
            const material = floorRef.current.material as THREE.MeshStandardMaterial
            material.roughness = THREE.MathUtils.lerp(
                material.roughness,
                0.1 + snarePulse * 0.1,
                0.1
            )
        }
    })
    
    // Материалы студии
    const wallMaterial = useMemo(() => (
        new THREE.MeshStandardMaterial({
            color: '#1a1a25',
            roughness: 0.8,
            metalness: 0.2,
        })
    ), [])
    
    const floorMaterial = useMemo(() => (
        new THREE.MeshStandardMaterial({
            color: '#0d0d12',
            roughness: 0.2,
            metalness: 0.8,
            envMapIntensity: 1.5,
        })
    ), [])
    
    const ceilingMaterial = useMemo(() => (
        new THREE.MeshStandardMaterial({
            color: '#08080c',
            roughness: 0.9,
            metalness: 0.1,
        })
    ), [])
    
    const neonMaterial = useMemo(() => (
        new THREE.MeshBasicMaterial({
            color: '#00f0ff',
            transparent: true,
            opacity: 0.8,
        })
    ), [])
    
    return (
        <group>
            {/* ========================================================================
                STUDIO GEOMETRY
                ======================================================================== */}
                
            {/* Floor — полированный бетон с отражениями */}
            <mesh 
                ref={floorRef}
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, -3, 0]}
                receiveShadow
            >
                <planeGeometry args={[100, 100]} />
                <primitive object={floorMaterial} attach="material" />
            </mesh>
            
            {/* Ceiling — тёмный потолок */}
            <mesh 
                rotation={[Math.PI / 2, 0, 0]} 
                position={[0, 8, 0]}
                receiveShadow
            >
                <planeGeometry args={[100, 100]} />
                <primitive object={ceilingMaterial} attach="material" />
            </mesh>
            
            {/* Back Wall — задняя стена с панелями */}
            <mesh 
                position={[0, 2.5, -20]}
                receiveShadow
            >
                <planeGeometry args={[60, 22]} />
                <primitive object={wallMaterial} attach="material" />
            </mesh>
            
            {/* Left Wall — левая стена */}
            <mesh 
                rotation={[0, Math.PI / 2, 0]} 
                position={[-30, 2.5, 0]}
                receiveShadow
            >
                <planeGeometry args={[60, 22]} />
                <primitive object={wallMaterial} attach="material" />
            </mesh>
            
            {/* Right Wall — правая стена */}
            <mesh 
                rotation={[0, -Math.PI / 2, 0]} 
                position={[30, 2.5, 0]}
                receiveShadow
            >
                <planeGeometry args={[60, 22]} />
                <primitive object={wallMaterial} attach="material" />
            </mesh>
            
            {/* ========================================================================
                NEON LIGHTING STRIPS
                ======================================================================== */}
                
            {/* Ceiling Neon Strip — голубая неоновая полоса */}
            <mesh ref={neonStripRef} position={[0, 7.5, -10]}>
                <boxGeometry args={[40, 0.1, 0.2]} />
                <primitive object={neonMaterial} attach="material" />
            </mesh>
            
            <mesh position={[0, 7.5, 10]}>
                <boxGeometry args={[40, 0.1, 0.2]} />
                <primitive object={neonMaterial} attach="material" />
            </mesh>
            
            {/* Side Neon Strips — фиолетовые полосы по бокам */}
            <mesh position={[-19.9, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[40, 0.1, 0.2]} />
                <meshBasicMaterial color="#bf00ff" transparent opacity={0.6} attach="material" />
            </mesh>
            
            <mesh position={[19.9, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <boxGeometry args={[40, 0.1, 0.2]} />
                <meshBasicMaterial color="#bf00ff" transparent opacity={0.6} attach="material" />
            </mesh>
            
            {/* ========================================================================
                STUDIO LIGHTING
                ======================================================================== */}
                
            {/* Ambient Light — базовое освещение */}
            <ambientLight intensity={0.15} />
            
            {/* Ceiling Spotlights — трековые светильники */}
            <group position={[0, 7, 0]}>
                {[[-15, 0, -8], [0, 0, -8], [15, 0, -8]].map((pos, i) => (
                    <spotLight
                        key={i}
                        position={pos as [number, number, number]}
                        target={new THREE.Object3D()}
                        intensity={0.8}
                        angle={Math.PI / 6}
                        penumbra={0.5}
                        distance={30}
                        color="#ffffff"
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                    />
                ))}
            </group>
            
            {/* Colored Accent Lights — цветные акценты */}
            <pointLight
                ref={ceilingLightRef}
                position={[0, 6, -15]}
                intensity={0.5}
                distance={40}
                color="#00f0ff"
            />
            
            <pointLight
                position={[-15, 4, 10]}
                intensity={0.3}
                distance={30}
                color="#bf00ff"
            />
            
            <pointLight
                position={[15, 4, 10]}
                intensity={0.3}
                distance={30}
                color="#ff9500"
            />
            
            {/* ========================================================================
                STUDIO EQUIPMENT
                ======================================================================== */}
                
            {/* Rack Cabinets — стойки с оборудованием вдоль стен */}
            <RackCabinets />
            
            {/* ========================================================================
                CENTRAL ARTIFACT — аудио-реактивный объект в центре
                ======================================================================== */}
            <Float 
                speed={isPlaying ? 2 : 0.5} 
                rotationIntensity={isPlaying ? 0.5 : 0.1} 
                floatIntensity={isPlaying ? 0.5 : 0.1}
            >
                <mesh position={[0, 0, -10]}>
                    <octahedronGeometry args={[2, 0]} />
                    <MeshDistortMaterial
                        color="#00f0ff"
                        envMapIntensity={1}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        metalness={0.9}
                        distort={isPlaying ? 0.4 : 0.1}
                        speed={isPlaying ? 3 : 1}
                    />
                </mesh>
            </Float>
            
            {/* ========================================================================
                ATMOSPHERIC EFFECTS
                ======================================================================== */}
                
            {/* Volumetric Fog-like particles */}
            <StudioParticles />
        </group>
    )
}

/**
 * StudioParticles — атмосферные частицы (пыль в лучах света)
 */
function StudioParticles() {
    const particlesRef = useRef<THREE.Points>(null!)
    const particleCount = 500
    
    const positions = useMemo(() => {
        const pos = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 50      // x
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20  // y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 40  // z
        }
        return pos
    }, [])
    
    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.02
        }
    })
    
    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="#00f0ff"
                transparent
                opacity={0.3}
                sizeAttenuation
            />
        </points>
    )
}

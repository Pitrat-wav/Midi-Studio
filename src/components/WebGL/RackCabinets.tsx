/**
 * RackCabinets.tsx — Studio Equipment Racks
 * 
 * 3D модели стоек с оборудованием вдоль стен студии:
 * - Синтезаторы
 * - Drum машины
 * - Эффект процессоры
 * - Микшерные пульты
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RackUnitProps {
    position: [number, number, number]
    color?: string
    label?: string
    isLed?: boolean
}

function RackUnit({ position, color = '#1a1a25', label, isLed = false }: RackUnitProps) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const ledRef = useRef<THREE.Mesh>(null!)
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        
        // LED мигание
        if (ledRef.current) {
            const material = ledRef.current.material as THREE.MeshBasicMaterial
            material.opacity = 0.5 + Math.sin(t * 3) * 0.3
        }
    })
    
    return (
        <group position={position}>
            {/* Rack Unit Body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[18, 2, 3]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.3}
                    metalness={0.8}
                />
            </mesh>
            
            {/* Front Panel */}
            <mesh position={[0, 0, 1.51]}>
                <boxGeometry args={[17.8, 1.8, 0.1]} />
                <meshStandardMaterial
                    color="#0a0a0f"
                    roughness={0.5}
                    metalness={0.6}
                />
            </mesh>
            
            {/* Rack Ears */}
            <mesh position={[-9.2, 0, 0]}>
                <boxGeometry args={[0.5, 2, 3]} />
                <meshStandardMaterial color="#252535" roughness={0.4} metalness={0.7} />
            </mesh>
            <mesh position={[9.2, 0, 0]}>
                <boxGeometry args={[0.5, 2, 3]} />
                <meshStandardMaterial color="#252535" roughness={0.4} metalness={0.7} />
            </mesh>
            
            {/* LED Indicator */}
            {isLed && (
                <mesh ref={ledRef} position={[8, 0.5, 1.56]}>
                    <circleGeometry args={[0.15, 16]} />
                    <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
                </mesh>
            )}
            
            {/* Label Text Placeholder */}
            {label && (
                <mesh position={[-6, 0, 1.56]}>
                    <planeGeometry args={[2, 0.5]} />
                    <meshBasicMaterial color="#444455" />
                </mesh>
            )}
            
            {/* Knobs */}
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[-4 + i * 2.5, -0.3, 1.56]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
                    <meshStandardMaterial color="#0a0a0f" roughness={0.4} metalness={0.8} />
                </mesh>
            ))}
        </group>
    )
}

/**
 * Synth Rack — стойка с синтезаторами
 */
function SynthRack({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Rack Frame */}
            <mesh castShadow>
                <boxGeometry args={[20, 18, 4]} />
                <meshStandardMaterial
                    color="#12121a"
                    roughness={0.5}
                    metalness={0.6}
                />
            </mesh>
            
            {/* Rack Units */}
            <RackUnit position={[0, 6, 2]} color="#1a1a25" label="OSC 1" isLed />
            <RackUnit position={[0, 3, 2]} color="#1a1a25" label="OSC 2" isLed />
            <RackUnit position={[0, 0, 2]} color="#1a1a25" label="FILTER" isLed />
            <RackUnit position={[0, -3, 2]} color="#1a1a25" label="ENV" isLed />
            <RackUnit position={[0, -6, 2]} color="#1a1a25" label="LFO" isLed />
            
            {/* Neon Accent Strip */}
            <mesh position={[0, 8.5, 2.1]}>
                <boxGeometry args={[18, 0.1, 0.2]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} />
            </mesh>
        </group>
    )
}

/**
 * Drum Machine Rack — стойка с drum машинами
 */
function DrumMachineRack({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Rack Frame */}
            <mesh castShadow>
                <boxGeometry args={[20, 14, 4]} />
                <meshStandardMaterial
                    color="#12121a"
                    roughness={0.5}
                    metalness={0.6}
                />
            </mesh>
            
            {/* TR-808 Style Unit */}
            <group position={[0, 4, 2]}>
                <mesh castShadow>
                    <boxGeometry args={[18, 2.5, 3]} />
                    <meshStandardMaterial color="#5d2906" roughness={0.4} metalness={0.5} />
                </mesh>
                {/* Pads */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <mesh key={i} position={[-7 + i * 2.8, 0.3, 1.56]}>
                        <boxGeometry args={[0.8, 0.8, 0.1]} />
                        <meshStandardMaterial 
                            color={i < 4 ? '#ff3c00' : '#ffd000'} 
                            emissive={i < 4 ? '#ff3c00' : '#ffd000'}
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                ))}
            </group>
            
            {/* TR-909 Style Unit */}
            <group position={[0, 0, 2]}>
                <mesh castShadow>
                    <boxGeometry args={[18, 2.5, 3]} />
                    <meshStandardMaterial color="#e0e0d0" roughness={0.5} metalness={0.3} />
                </mesh>
                {/* Pads */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <mesh key={i} position={[-7 + i * 2.8, 0.3, 1.56]}>
                        <boxGeometry args={[0.8, 0.8, 0.1]} />
                        <meshStandardMaterial color="#333333" roughness={0.6} />
                    </mesh>
                ))}
            </group>
            
            {/* Effects Unit */}
            <RackUnit position={[0, -4, 2]} color="#1a1a25" label="FX" isLed />
            
            {/* Neon Accent */}
            <mesh position={[0, 6.5, 2.1]}>
                <boxGeometry args={[18, 0.1, 0.2]} />
                <meshBasicMaterial color="#ff9500" transparent opacity={0.7} />
            </mesh>
        </group>
    )
}

/**
 * Mixer Rack — микшерная стойка
 */
function MixerRack({ position }: { position: [number, number, number] }) {
    const fadersRef = useRef<THREE.Group>(null!)
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        
        // Анимация фейдеров
        if (fadersRef.current) {
            fadersRef.current.children.forEach((child, i) => {
                if (child instanceof THREE.Mesh) {
                    child.position.y = Math.sin(t * 2 + i * 0.5) * 0.3
                }
            })
        }
    })
    
    return (
        <group position={position}>
            {/* Mixer Console */}
            <mesh castShadow>
                <boxGeometry args={[24, 8, 6]} />
                <meshStandardMaterial color="#0a0a0f" roughness={0.3} metalness={0.7} />
            </mesh>
            
            {/* Fader Bank */}
            <group ref={fadersRef} position={[0, 1, 3.1]}>
                {[-8, -5, -2, 1, 4, 7].map((x, i) => (
                    <mesh key={i} position={[x, 0, 0]}>
                        <boxGeometry args={[0.8, 2, 0.8]} />
                        <meshStandardMaterial color="#1a1a25" roughness={0.4} metalness={0.6} />
                    </mesh>
                ))}
            </group>
            
            {/* VU Meters */}
            {[-6, -2, 2, 6].map((x, i) => (
                <group key={i} position={[x, 2.5, 3.05]}>
                    <mesh>
                        <planeGeometry args={[1.5, 2]} />
                        <meshStandardMaterial color="#0a0a0f" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, -0.5, 0.01]}>
                        <planeGeometry args={[1.3, 0.3]} />
                        <meshBasicMaterial color="#00ff88" />
                    </mesh>
                </group>
            ))}
            
            {/* Master Knob */}
            <mesh position={[10, -2, 3.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1, 1, 0.3, 32]} />
                <meshStandardMaterial color="#c5a059" roughness={0.3} metalness={0.9} />
            </mesh>
        </group>
    )
}

/**
 * RackCabinets — основная композиция стоек
 */
export function RackCabinets() {
    return (
        <group>
            {/* Left Wall Racks */}
            <SynthRack position={[-19.5, 0, -10]} />
            <DrumMachineRack position={[-19.5, 0, 5]} />
            
            {/* Right Wall Racks */}
            <MixerRack position={[19.5, 0, -10]} />
            <SynthRack position={[19.5, 0, 5]} />
            
            {/* Back Wall Decorative Elements */}
            <mesh position={[-10, 8, -19.8]}>
                <boxGeometry args={[2, 0.1, 2]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.5} />
            </mesh>
            <mesh position={[10, 8, -19.8]}>
                <boxGeometry args={[2, 0.1, 2]} />
                <meshBasicMaterial color="#bf00ff" transparent opacity={0.5} />
            </mesh>
        </group>
    )
}

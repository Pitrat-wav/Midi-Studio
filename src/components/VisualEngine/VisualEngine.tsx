import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useVisualStore, VISUALIZER_REGISTRY } from '../../store/visualStore'
import { Stars, OrbitControls } from '@react-three/drei'
import { usePoseTracking } from '../../hooks/usePoseTracking'

// Visualizers
import { FeedbackVortex } from './visualizers/FeedbackVortex'
import { QuantumParticles } from './visualizers/QuantumParticles'
import { FractalVision } from './visualizers/FractalVision'
import { NeonWeave } from './visualizers/NeonWeave'
import { PlasmaOrb } from './visualizers/PlasmaOrb'
import { LiquidMercury } from './visualizers/LiquidMercury'
import { GravityWell } from './visualizers/GravityWell'
import { CyberTunnel } from './visualizers/CyberTunnel'
import { KaleidoSphere } from './visualizers/KaleidoSphere'

// Batch imports
import * as Batch1 from './visualizers/VisualBatch1'
import * as Batch2 from './visualizers/VisualBatch2'
import * as Batch3 from './visualizers/VisualBatch3'
import * as Batch2D from './visualizers/VisualBatch2D'

export function VisualEngine() {
    const index = useVisualStore(s => s.visualizerIndex)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    usePoseTracking()

    const renderVisualizer = () => {
        switch (index) {
            case 0: return <FeedbackVortex />
            case 1: return <QuantumParticles />
            case 2: return <FractalVision />
            case 3: return <NeonWeave />
            case 4: return <PlasmaOrb />
            case 5: return <LiquidMercury />
            case 6: return <GravityWell />
            case 7: return <CyberTunnel />
            case 8: return <KaleidoSphere />

            // Batch 1 (9-18)
            case 9: return <Batch1.AuraField />
            case 10: return <Batch1.CircuitCity />
            case 11: return <Batch1.VoxelWaves />
            case 12: return <Batch1.StringTheory />
            case 13: return <Batch1.Metablob />
            case 14: return <Batch1.PrismPortal />
            case 15: return <Batch1.DataRain />
            case 16: return <Batch1.NebulaCloud />
            case 17: return <Batch1.HexagonGrid />
            case 18: return <Batch1.LidarScan />

            // Batch 2 (19-28)
            case 19: return <Batch2.Hypercube />
            case 20: return <Batch2.GlitchWorld />
            case 21: return <Batch2.SpiralGalaxy />
            case 22: return <Batch2.CrystalCave />
            case 23: return <Batch2.GrowthTendrils />
            case 24: return <Batch2.GeometricChaos />
            case 25: return <Batch2.SolarFlare />
            case 26: return <Batch2.DepthRings />
            case 27: return <Batch2.Frequency360 />
            case 28: return <Batch2.TriangleRain />

            // Batch 3 (29-38)
            case 29: return <Batch3.VectorField />
            case 30: return <Batch3.ElectricStorm />
            case 31: return <Batch3.FluidGlass />
            case 32: return <Batch3.SpeedWarp />
            case 33: return <Batch3.AbstractSolid />
            case 34: return <Batch3.LaserGrid />
            case 35: return <Batch3.DoubleHelix />
            case 36: return <Batch3.PulsarStar />
            case 37: return <Batch3.FractalForest />
            case 38: return <Batch3.GlassShards />

            // Batch 2D (39-48)
            case 39: return <Batch2D.RetroOscilloscope />
            case 40: return <Batch2D.VibrantSpectrum />
            case 41: return <Batch2D.RadialPulse />
            case 42: return <Batch2D.GlitchScanner />
            case 43: return <Batch2D.LavaLamp2D />
            case 44: return <Batch2D.NeonWavelet />
            case 45: return <Batch2D.BinaryStar2D />
            case 46: return <Batch2D.GradientFlow />
            case 47: return <Batch2D.PixelNoise />
            case 48: return <Batch2D.AbstractGrid2D />

            default: return <Stars />
        }
    }

    return (
        <div className="visual-engine-container" style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#000', zIndex: 5
        }}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={['#000']} />

                    {renderVisualizer()}

                    <ambientLight intensity={0.1} />
                    <pointLight position={[10, 10, 10]} intensity={intensity * 5} color="#3390ec" />
                    <pointLight position={[-10, -10, -10]} intensity={intensity * 2} color="#ff3b30" />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <OrbitControls enableZoom={false} enablePan={false} />
                </Suspense>
            </Canvas>
        </div>
    )
}

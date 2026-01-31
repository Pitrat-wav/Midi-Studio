/**
 * SouthParkStage.tsx
 * Main character stage - Characters AS instruments
 * Cartman=Drums, Kenny=Bass, Kyle/Stan=Synth, Butters=Drone
 */

import { CharacterSprite } from './CharacterSprite'

export function SouthParkStage() {
    // Character depth layer - in front of crowd, behind foreground
    const STAGE_Z = -5

    return (
        <group>
            {/* DRUMS: Eric Cartman (Center, largest) */}
            <CharacterSprite
                texturePath="/assets/visuals/sp_cartman.png"
                position={[0, -6, STAGE_Z]}
                scale={10}
                audioChannel="kick"
                reactivity={0.8}
                enableSquash={true}
            />

            {/* BASS: Kenny McCormick (Left) */}
            <CharacterSprite
                texturePath="/assets/visuals/sp_kenny.png"
                position={[-8, -7, STAGE_Z - 1]}
                scale={6}
                audioChannel="bass"
                reactivity={0.6}
                enableSquash={true}
            />

            {/* SYNTH/LEAD: Kyle Broflovski (Right) */}
            <CharacterSprite
                texturePath="/assets/visuals/sp_kyle.png"
                position={[6, -7, STAGE_Z - 1]}
                scale={6}
                audioChannel="lead"
                reactivity={0.6}
                enableSquash={true}
            />

            {/* PADS/HARMONY: Stan Marsh (Far Right) */}
            <CharacterSprite
                texturePath="/assets/visuals/sp_stan.png"
                position={[10, -7.5, STAGE_Z - 2]}
                scale={5}
                audioChannel="pads"
                reactivity={0.5}
                enableSquash={true}
            />

            {/* DRONE: Butters (Far Left back) */}
            <CharacterSprite
                texturePath="/assets/visuals/sp_butters.png"
                position={[-12, -7.5, STAGE_Z - 2]}
                scale={4}
                audioChannel="drone"
                reactivity={0.4}
                enableSquash={true}
            />
        </group>
    )
}

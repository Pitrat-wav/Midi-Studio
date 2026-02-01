export class AIService {
    static async generateTexture(prompt: string): Promise<string> {
        console.log(`[AI-GEN] Generating texture for: "${prompt}"`)

        // Mock API call delay
        await new Promise(r => setTimeout(r, 2000))

        // Return a stable "AI" placeholder image (mocking Stable Diffusion)
        const mockTextures = [
            '/assets/visuals/whisk_preset_1.png',
            '/assets/visuals/whisk_preset_2.png',
            '/assets/visuals/whisk_preset_3.png'
        ]
        const random = mockTextures[Math.floor(Math.random() * mockTextures.length)]
        console.log(`[AI-GEN] Success! URL: ${random}`)
        return random
    }

    static async chatAgent(context: string): Promise<string> {
        console.log(`[AI-CHAT] Sending context: "${context}"`)

        await new Promise(r => setTimeout(r, 1500))

        const responses = [
            "I've optimized the oscillator detune for a thicker sound.",
            "Added a high-pass filter to clean up the mud.",
            "Analyzing signal flow... everything looks correct.",
            "Generated a new bassline sequence based on your prompt."
        ]
        const reply = responses[Math.floor(Math.random() * responses.length)]
        console.log(`[AI-CHAT] Reply: ${reply}`)
        return reply
    }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLES_DIR = path.join(__dirname, '../public/samples');
const MANIFEST_PATH = path.join(__dirname, '../src/data/sampleManifest.json');

// Ensure directory exists
if (!fs.existsSync(SAMPLES_DIR)) {
    console.log(`Creating samples directory at ${SAMPLES_DIR}`);
    fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

function scanSamples() {
    console.log('Scanning for samples...');
    const samples = [];

    try {
        const files = fs.readdirSync(SAMPLES_DIR);

        files.forEach(file => {
            if (file.startsWith('.')) return; // Skip hidden files

            const ext = path.extname(file).toLowerCase();
            if (['.wav', '.mp3', '.ogg', '.aif', '.aiff'].includes(ext)) {
                samples.push({
                    name: file,
                    path: `/samples/${file}`,
                    category: 'user'
                });
            }
        });

        // Ensure manifest directory exists
        const manifestDir = path.dirname(MANIFEST_PATH);
        if (!fs.existsSync(manifestDir)) {
            fs.mkdirSync(manifestDir, { recursive: true });
        }

        const content = JSON.stringify(samples, null, 2);
        fs.writeFileSync(MANIFEST_PATH, content);

        console.log(`✅ Generated manifest with ${samples.length} samples at ${MANIFEST_PATH}`);

    } catch (err) {
        console.error('Error scanning samples:', err);
        process.exit(1);
    }
}

scanSamples();

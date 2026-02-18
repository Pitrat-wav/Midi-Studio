# 🎹 Midi Studio Pro 3D (Studio Elite)

**Next-Gen Generative Music Environment & Visualizer**

Studio Elite is a fully immersive, 3D-first Digital Audio Workstation (DAW) and Generative Music Environment running directly in the browser. It combines node-based synthesis, spatial audio navigation, and professional arrangement tools into a unified "Game-Like" experience.

![Studio Preview](public/assets/preview.png)
*(Replace this placeholder with a screenshot of the main 3D interface)*

## 📚 Documentation

We have comprehensive documentation to help you get started, whether you are a user or a developer.

*   **[User Guide](docs/USER_GUIDE.md)**: Learn how to make music, use the 3D interface, and export MIDI.
*   **[Developer Guide](docs/DEVELOPMENT.md)**: Setup instructions, build commands, and contribution guidelines.
*   **[Architecture](docs/ARCHITECTURE.md)**: High-level system design, data flow, and technology stack.
*   **[API Reference](docs/API.md)**: Backend API endpoints and authentication.

## 🚀 Quick Start

### Prerequisites
*   Node.js v18+
*   npm

### Installation

**Note:** This project tracks specific platform binaries in `node_modules`. You **must** use the legacy peer deps flag.

```bash
# 1. Install frontend dependencies
npm install --legacy-peer-deps

# 2. Install backend dependencies
cd backend && npm install && cd ..
```

### Running the App

```bash
# Start Frontend (http://localhost:3000)
npm run dev

# Start Backend (http://localhost:3001) in a separate terminal
cd backend && npm run dev
```

## ✨ Key Features

*   **3D Interface**: Navigate a virtual studio where every object is a synthesizer or effect.
*   **Generative Engines**:
    *   **Acid Bass**: TB-303 style monosynth with accent/slide logic.
    *   **Euclidean Drums**: Polyrhythmic beat generation.
    *   **Turing Machine**: Probabilistic melody generation.
*   **Visualizers**: Reactive shaders that pulse to the music (Cosmic, Cyber, Pixel themes).
*   **Hand Tracking**: Control parameters with your webcam using MediaPipe.
*   **Telegram Integration**: Export your loops directly to Telegram as MIDI files.

## 🛠 Tech Stack

*   **Frontend**: React 18, TypeScript, Vite, Zustand
*   **3D Engine**: Three.js, React Three Fiber (R3F), Drei
*   **Audio Engine**: Tone.js
*   **Backend**: Node.js, Express, Telegraf

## 📸 Gallery

| 3D Studio | Node Graph | Visualizer |
|-----------|------------|------------|
| ![3D](public/assets/3d-view.png) | ![Nodes](public/assets/nodes.png) | ![Vis](public/assets/visuals.png) |

*(Note: Please add actual screenshots to `public/assets/` to replace these placeholders)*

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---
*Built for the Telegram App Platform | 2026*

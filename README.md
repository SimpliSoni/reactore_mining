# REACTORE - Mining Digital Twin SOC

A high-performance, real-time visualization of an underground mine safety operations center. Built with Three.js and TypeScript, this project demonstrates advanced autonomous equipment management, predictive collision avoidance, and industrial-grade monitoring.

## 📺 Project Demo

- live at : https://reactore-mining.vercel.app/
- [Watch the System Demo (demo.mp4)](./demo.mp4)

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Three.js](https://img.shields.io/badge/Powered%20By-Three.js-black)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

## ✨ Core Features

- **Digital Twin Visualization**: LiDAR-scan aesthetic with technical grids and CAD-style equipment.
- **Predictive CAS**: Two-tier Collision Avoidance System using Bounding Volume Hierarchy (BVH).
- **Autonomous Navigation**: Equipment follows a complex navigation graph across tunnels and caverns.
- **Real-Time SOC Dashboard**: High-fidelity UI overlay for telemetry and proximity monitoring.
- **Picture-in-Picture (PIP)**: Chasing camera for selected equipment.
- **Manual Control**: Directly pilot equipment (MAN-01) with physics-based steering.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🎮 Interaction

- **Drive (MAN-01)**: `W`, `A`, `S`, `D`
- **Camera Pan**: Arrow Keys
- **Rotate**: `Q`, `E` or Right-Click Drag
- **Zoom**: Mouse Scroll
- **Toggle Heatmap**: `H`

## 📂 Project Structure

- `src/core`: The simulation engine, navigation logic, and equipment management.
- `src/world`: Procedural mine generation and equipment models.
- `src/tools`: Spatial indexing (BVH) and utility functions.
- `src/ui`: Styling and dashboard interactions.

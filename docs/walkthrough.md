# Reactore Mining Digital Twin - Technical Walkthrough

## 🏗️ Project Overview

**Reactore** is a high-performance, real-time "Digital Twin" of an underground mining environment. It serves as a **Safety Operations Center (SOC)** visualization tool, designed to monitor autonomous equipment, manage collision risks, and provide situational awareness in a complex 3D tunnel network.

This project leverages **Three.js** and **TypeScript** to create an industrial-grade simulation that emphasizes technical precision, visual excellence, and real-time data integration.

### 📺 System Demo

![System Demo](../demo.mp4)

---

## 🚀 What We Have Achieved So Far

### 1. Procedural Mine Infrastructure (`MineStructure.ts`)

We have implemented a sophisticated procedural generation system for the underground environment:

- **LiDAR-Scan Aesthetic**: Tunnels are rendered with a technical, high-contrast look featuring technical grids and wireframe overlays.
- **Dynamic Lighting**: Integrated ambient and point lighting that mimics the harsh but necessary illumination of a real mine.
- **Industrial Scale**: The environment is built to a realistic scale, providing a sense of depth and complexity.

### 2. Autonomous Equipment Logic (`Truck.ts`)

The simulation features intelligent, autonomous haulage trucks:

- **State-Driven Behavior**: Trucks operate on a state machine (Idling, Moving, Warning, Critical).
- **Physics-Based Movement**: Real-time calculation of velocity, steering angles, and path following.
- **Safety Zones**: Each vehicle projects dynamic safety buffers (Green/Yellow/Red) that react to nearby obstacles and other vehicles.

### 3. Collision Avoidance System (CAS)

A two-tier collision detection system ensures site safety:

- **BVH Spatial Indexing**: Using Bounding Volume Hierarchy to perform high-speed proximity checks across hundreds of potential collision points.
- **Predictive Alerts**: The system calculates "Time to Collision" and triggers visual/auditory warnings before an incident occurs.

### 4. Navigation Intelligence (`NavGraph.ts`)

A specialized navigation graph manages vehicle traffic:

- **Waypoint System**: Trucks follow a complex network of nodes and edges representing mine tunnels.
- **Traffic Management**: Logic to prevent deadlocks and manage narrow passage intersections.

### 5. Advanced SOC Dashboard (`index.html`, `style.css`)

A premium, "Mission Control" style interface provides deep insight into the simulation:

- **Real-Time Telemetry**: Live updates of vehicle position (XYZ), velocity, and heading.
- **Proximity Matrix**: A dedicated UI component that monitors the distance between all active units.
- **Event Logging**: A stream of safety alerts, mission starts, and system status changes.
- **Interactive Manual Control**: The ability for an operator to take manual control of a unit (MAN-01) for specific tasks.

---

## 🛠️ Technical Architecture

### Core Engine (`Engine.ts`)

The "heart" of the application, managing the Three.js scene, renderer, and the main simulation loop. It ensures a consistent 60fps experience even with multiple high-fidelity models.

### Equipment Manager (`EquipmentManager.ts`)

Handles the lifecycle of all vehicles in the scene. It acts as a bridge between the simulation logic and the UI, broadcasting state changes via a central **StateBus**.

### Visual Philosophy

- **Palette**: Deep blacks, industrial cyans (#00f0ff), safety golds (#ffd700), and warning reds (#af2b1e).
- **Typography**: Utilizing `JetBrains Mono` and `Outfit` for a clean, technical, and modern data-rich feel.
- **Glassmorphism**: UI panels use blur effects and semi-transparency to maintain immersion in the 3D world.

---

## 🎮 Interaction & Monitoring

| Action                    | Control                       |
| :------------------------ | :---------------------------- |
| **Manual Drive (MAN-01)** | `W` `A` `S` `D`               |
| **Camera Orbit**          | Right-Click Drag or `Q` / `E` |
| **Camera Pan**            | Arrow Keys                    |
| **Toggle Heatmap**        | `H`                           |
| **Toggle Dashboard**      | UI Button ("DASHBOARD")       |

---

## 📈 Future Roadmap

- **Dynamic Path Planning**: Re-routing vehicles in real-time based on tunnel blockages.
- **Enhanced Heatmaps**: Visualizing traffic congestion over time.
- **Multi-Level Support**: Adding vertical shafts and multi-floor navigation.
- **Data Persistence**: Connecting the simulation to a mock backend for historical replay.

---

_This walkthrough documents the state of the Reactore Mining Digital Twin as of Phase 2 Implementation._

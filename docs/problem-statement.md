# THREE.JS INTERVIEW PROBLEMS - MINING INDUSTRY FOCUS

## Problem 1: Underground Tunnel Extension Planner

**Focus:** 3D geometry, path visualization, planning

### Scenario

You're building a visualization tool for mining engineers to plan new tunnel extensions. The system needs to show the existing mine structure and allow planning of new tunnels while checking for intersections with existing infrastructure.

**Requirements**

1. Mine Structure Setup
   • Create a 3D grid-based underground mine environment (100m × 100m × 50m)
   • Display existing tunnels as 3D corridors (hollow tubes/boxes with walls)
   • Show at least 3 existing tunnels in different directions
   • Add support pillars (vertical structures) at regular intervals
   • Create a distinct starting point and main excavation chamber
2. New Tunnel Extension Planning
   • Allow user to click two points in the 3D space to define a new tunnel route
   • Visualize the proposed tunnel path as a semi-transparent tube
   • Color code: Green = safe to excavate, Red = intersects with existing structure
   • Display tunnel statistics: Length, gradient angle, volume to excavate
   • Show real-time intersection detection with existing tunnels and pillars
3. Interactive Controls & Visualization
   • Camera controls: Rotate, zoom, pan to explore the mine
   • Click to place waypoints for tunnel extension
   • Button to "confirm" tunnel and add it to the mine structure
   • Button to "undo" last action
   • Toggle visibility of different tunnel sections
   • Display warnings if tunnel violates safety constraints (e.g., too steep, too close to surface)
4. Optional Enhancements (if time permits)
   • Add a 2D cross-section view showing depth profile
   • Implement tunnel branching (multiple extensions from one point)
   • Show excavation volume and estimated time calculations
   • Add lighting simulation showing safety zones and danger areas
   Provided Resources
   • Three.js library (pre-loaded)
   • HTML template with 3D canvas and UI controls
   • Basic mine layout data (tunnel coordinates)
   Key Concepts to Demonstrate
   • 3D line/path rendering and intersection detection
   • Raycasting for point placement
   • Real-time collision/intersection checking
   Deliverables
   • Functional tunnel planning visualization
   • Working intersection detection system
   • Clean, documented code explaining geometry calculations
   • Explanation of approach to intersection checking

# Problem 2: Equipment Safety & Collision Avoidance System

**Focus:** 3D collision detection, real-time monitoring, safety zones

## Scenario

Underground mining equipment (trucks, excavators, drilling rigs) moves through tunnels. Build a visualization system that tracks equipment movement and detects collision hazards with the tunnel structure, other equipment, and safety zones.

**Requirements**

1. Mine Environment & Equipment Setup
   • Create a branching tunnel system with multiple corridors (at least 3 main tunnels)
   • Place static equipment/obstacles: Drilling rigs, support structures, fuel stations
   • Add dynamic equipment: Mining truck that moves through tunnels
   • Define safety zones around equipment and excavation areas
   • Show walls and tunnel boundaries clearly
2. Equipment Movement & Collision Detection
   • Implement autonomous equipment movement along predefined tunnel paths
   • Real-time collision detection between:
   o Equipment ↔ Tunnel walls
   o Equipment ↔ Equipment
   o Equipment ↔ Safety zones
   • Color-coded warnings: Yellow = caution zone, Red = collision imminent
   • Display collision distance/proximity alerts on UI
   • Implement emergency stop that halts equipment motion
3. Monitoring Dashboard & Visualization
   • Real-time status panel showing all equipment locations
   • Display equipment status: Moving, stopped, warning, alarm
   • Show proximity warnings and near-miss events
   • Interactive camera: Follow equipment or free-look mode
   • Ability to pause/resume equipment movement
   • Visual highlighting of safety zones and danger areas
4. Optional Enhancements (if time permits)
   • Implement multiple equipment units moving simultaneously
   • Add path planning showing equipment route
   • Implement automatic route recalculation if collision detected
   • Add historical trail showing equipment path
   • Real-time 3D alert notifications
   • Speed control for different equipment types
   Provided Resources
   • Three.js library with collision detection helpers
   • HTML template with equipment status dashboard
   • Tunnel layout and equipment data
   Key Concepts to Demonstrate
   • Bounding box / sphere collision detection
   • Real-time spatial calculations
   • Multi-object tracking and monitoring
   • Safety-critical system thinking
   • Performance optimization for continuous collision checks
   Deliverables
   • Working collision detection system
   • Multi-equipment monitoring dashboard
   • Real-time safety alerts and warnings
   • Code explanation of collision algorithm and performance considerations

What You Need to Do

1. Understand the problem scenario (read carefully!)
2. Sketch your approach before coding (geometry, collision strategy, data flow)
3. Start with static visualization, then add dynamics
4. Implement collision/monitoring incrementally
5. Test with edge cases (equipment near boundaries, multiple collisions, etc.)
6. Comment as you code, especially complex calculations
   Common Pitfalls to Avoid
   • ❌ Collision detection too expensive (calculate for every frame inefficiently)
   • ❌ Particle systems causing lag (use object pooling)
   • ❌ UI not updating in sync with 3D view
   • ❌ Ignoring edge cases (equipment at boundaries, multiple simultaneous collisions)
   • ❌ Hard-coded values instead of configurable parameters

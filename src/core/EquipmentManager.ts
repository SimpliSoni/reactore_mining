import * as THREE from "three";
import { Truck } from "../world/Truck";
import { NavGraph } from "./NavGraph";
import { BVHManager } from "../tools/BVHManager";
import { stateBus } from "./StateBus";

export class EquipmentManager {
  private trucks: Truck[] = [];
  private navGraph: NavGraph;
  private scene: THREE.Scene;
  private bvhManager: BVHManager;

  // Tunnel/Cavern structures for distance-from-curve collision
  private tunnelStructures: {
    curve: THREE.CatmullRomCurve3;
    radius: number;
  }[] = [];

  private heatmapGroup: THREE.Group;
  private lastHeatmapUpdate: number = 0;

  // Invisible safety zones (Active Digging Sites and Fuel Station)
  private safetyZones: THREE.Sphere[] = [
    new THREE.Sphere(new THREE.Vector3(40, 0, 0), 15), // Generic Dig
    new THREE.Sphere(new THREE.Vector3(0, 0, 60), 14), // Rig Dig
    new THREE.Sphere(new THREE.Vector3(-60, 0, 0), 16), // Fuel Depot
  ];

  // Manual Control State
  private manualTruck: Truck | null = null;
  private movementInput = {
    forward: 0,
    turn: 0,
  };

  constructor(scene: THREE.Scene, navGraph: NavGraph) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.bvhManager = BVHManager.getInstance();
    this.heatmapGroup = new THREE.Group();
    this.heatmapGroup.visible = false;
    this.scene.add(this.heatmapGroup);

    window.addEventListener("keydown", (e) => {
      if (e.key === "h" || e.key === "H") {
        this.heatmapGroup.visible = !this.heatmapGroup.visible;
      }
      this.handleInput(e.key.toLowerCase(), true);
    });

    window.addEventListener("keyup", (e) => {
      this.handleInput(e.key.toLowerCase(), false);
    });

    this.initSafetyZoneVisuals();
  }

  public setTunnelStructures(
    structures: { curve: THREE.CatmullRomCurve3; radius: number }[],
  ) {
    this.tunnelStructures = structures;
  }

  private getClosestPointOnCurve(
    curve: THREE.CatmullRomCurve3,
    pos: THREE.Vector3,
  ): THREE.Vector3 {
    // Safety: Curves with fewer than 2 points can't be interpolated
    // (caverns use single-point dummy curves — just return that point)
    if (curve.points.length < 2) {
      return curve.points[0].clone();
    }

    // Sample the curve and find closest point (XZ plane only for flat tunnels)
    let closestDist = Infinity;
    let closestPoint = new THREE.Vector3();
    const samples = 200;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = curve.getPointAt(t);
      // Only check XZ distance (tunnels are flat on Y)
      const dx = pos.x - pt.x;
      const dz = pos.z - pt.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < closestDist) {
        closestDist = d;
        closestPoint = pt.clone();
      }
    }
    return closestPoint;
  }

  private handleInput(key: string, isDown: boolean) {
    if (!this.manualTruck) return;
    const speed = 0.2; // manual speed mult
    const turnSpeed = 1.0;

    switch (key) {
      case "w":
        this.movementInput.forward = isDown ? speed : 0;
        break;
      case "s":
        this.movementInput.forward = isDown ? -speed : 0;
        break;
      case "a":
        this.movementInput.turn = isDown ? turnSpeed : 0;
        break;
      case "d":
        this.movementInput.turn = isDown ? -turnSpeed : 0;
        break;
    }
  }

  private initSafetyZoneVisuals() {
    // Show safety zones in "Digital Twin" mode with subtle blue circles
    this.safetyZones.forEach((zone) => {
      const circleGeo = new THREE.RingGeometry(
        zone.radius - 0.5,
        zone.radius,
        64,
      );
      const circleMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const circle = new THREE.Mesh(circleGeo, circleMat);
      circle.position.copy(zone.center);
      circle.position.y = -3.9; // Just above floor
      circle.rotation.x = Math.PI / 2;
      this.scene.add(circle);
    });
  }

  public spawnManualTruck(id: string, startPos: THREE.Vector3) {
    const truck = new Truck(id, startPos);
    truck.isManual = true;
    this.manualTruck = truck;
    this.trucks.push(truck);
    this.scene.add(truck.mesh);
  }

  public spawnTruck(id: string) {
    const startNodeId = this.navGraph.getRandomNodeId();
    const startNode = this.navGraph
      .getNodes()
      .find((n) => n.id === startNodeId);

    if (startNode) {
      const truck = new Truck(id, startNode.position.clone());
      this.trucks.push(truck);
      this.scene.add(truck.mesh);
      this.assignNewRoute(truck, startNodeId);
    }
  }

  private assignNewRoute(truck: Truck, startNodeId: string) {
    const endNodeId = this.navGraph.getConnectedNodeId(startNodeId);
    const path = this.navGraph.getPath(startNodeId, endNodeId);

    if (path) {
      truck.setPath(path);
      // Recursively assign next path when finished (handled in update)
    }
  }

  public update(delta: number) {
    // Process Manual Truck Input
    if (this.manualTruck) {
      this.manualTruck.manualVelocity = this.movementInput.forward;
      this.manualTruck.manualSteering = this.movementInput.turn;

      let status: "GREEN" | "YELLOW" | "RED" = "GREEN";

      // 1. Environment Collision Check (Distance-from-Curve)
      // Check if the truck is within any tunnel or cavern
      const truckPos = this.manualTruck.mesh.position;
      let insideAnyStructure = false;
      for (const structure of this.tunnelStructures) {
        const closestPoint = this.getClosestPointOnCurve(
          structure.curve,
          truckPos,
        );
        const dx = truckPos.x - closestPoint.x;
        const dz = truckPos.z - closestPoint.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const effectiveRadius = structure.radius;

        if (dist < effectiveRadius - 2) {
          // Comfortably inside
          insideAnyStructure = true;
          break;
        }
        if (dist < effectiveRadius) {
          // Inside but near wall
          insideAnyStructure = true;
          if (dist > effectiveRadius - 3) {
            status = "YELLOW";
          }
          break;
        }
      }
      if (!insideAnyStructure && this.tunnelStructures.length > 0) {
        status = "RED";
        // Don't block movement — just warn. Player can still drive.
        stateBus.emit("EMERGENCY_HALT", {
          id: this.manualTruck.id,
          reason: "WALL_COLLISION_WARNING",
        });
      }

      // 2. Safety Zone Check
      let inSafetyZone = false;
      for (const zone of this.safetyZones) {
        if (zone.containsPoint(this.manualTruck.mesh.position)) {
          inSafetyZone = true;
          break;
        }
      }
      if (status !== "RED" && inSafetyZone) {
        status = "YELLOW";
        // Limit speed in safety zone
        if (this.manualTruck.manualVelocity > 0.08) {
          this.manualTruck.manualVelocity = 0.08;
        }
      }

      this.manualTruck.manualStatus = status;
    }

    this.trucks.forEach((truck) => {
      if (truck.isManual) {
        // Autonomous checks below don't fully apply, but we still do vehicle-to-vehicle below
      } else {
        // Autonomous Updates
        // 1. Safety Zone Check
        let inSafetyZone = false;
        for (const zone of this.safetyZones) {
          if (zone.containsPoint(truck.mesh.position)) {
            inSafetyZone = true;
            break;
          }
        }
        truck.setThrottled(inSafetyZone);

        // NOTE: BVH environment collision is disabled for autonomous trucks
        // because they operate *inside* the tube geometry, causing false positives.
        // Autonomous trucks are path-guided and stay within tunnels by design.
      }

      // 3. Vehicle-to-Vehicle Collision — ONLY between manual truck and autonomous
      // Autonomous trucks NEVER collide with each other
      if (truck.isManual) {
        this.trucks.forEach((other) => {
          if (other.isManual || other.isHalted) return;
          const dist = truck.mesh.position.distanceTo(other.mesh.position);
          if (dist < 12) {
            if (truck.manualStatus !== "RED") truck.manualStatus = "YELLOW";
            if (dist < 6) {
              truck.manualStatus = "RED";
              stateBus.emit("COLLISION_WARNING", {
                truckA: truck.id,
                truckB: other.id,
              });
            }
          }
        });
      }

      // Update Heatmap
      let inZone = false;
      for (const zone of this.safetyZones) {
        if (zone.containsPoint(truck.mesh.position)) inZone = true;
      }

      let isMoving = truck.isManual
        ? Math.abs(truck.manualVelocity) > 0
        : !truck.isHalted;

      if (inZone && isMoving) {
        if (performance.now() - this.lastHeatmapUpdate > 500) {
          this.addHeatmapPoint(truck.mesh.position);
          this.lastHeatmapUpdate = performance.now();
        }
      }

      truck.update(delta);

      // Re-assign path if idle for autonomous
      if (!truck.isManual) {
        // @ts-ignore (accessing private for brevity in this sim)
        if (truck.targetPosition === null) {
          const newStart = this.navGraph.getRandomNodeId();
          this.assignNewRoute(truck, newStart);
        }
      }
    });
  }

  private addHeatmapPoint(pos: THREE.Vector3) {
    const geo = new THREE.PlaneGeometry(3, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = -3.95; // floor level
    mesh.rotation.x = -Math.PI / 2;
    this.heatmapGroup.add(mesh);
  }

  public getProximityData() {
    const data: { a: string; b: string; dist: number }[] = [];
    for (let i = 0; i < this.trucks.length; i++) {
      for (let j = i + 1; j < this.trucks.length; j++) {
        const dist = this.trucks[i].mesh.position.distanceTo(
          this.trucks[j].mesh.position,
        );
        data.push({ a: this.trucks[i].id, b: this.trucks[j].id, dist });
      }
    }
    data.sort((a, b) => a.dist - b.dist);
    return data.slice(0, 3);
  }

  public getSelectedTelemetry() {
    if (this.trucks.length > 0) {
      return this.trucks[0].getVelocityInfo();
    }
    return null;
  }

  public getTrucks() {
    return this.trucks;
  }
}

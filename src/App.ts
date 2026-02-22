import { Engine } from "./core/Engine";
import { MineStructure } from "./world/MineStructure";
import { NavGraph } from "./core/NavGraph";
import { EquipmentManager } from "./core/EquipmentManager";
import { BVHManager } from "./tools/BVHManager";
import * as THREE from "three";

export class App {
  private engine: Engine;
  private mineStructure: MineStructure;
  private navGraph: NavGraph;
  private equipmentManager: EquipmentManager;
  private bvhManager: BVHManager;

  constructor() {
    this.engine = new Engine();
    this.mineStructure = new MineStructure(this.engine);
    this.navGraph = new NavGraph();
    this.bvhManager = BVHManager.getInstance();
    this.equipmentManager = new EquipmentManager(
      this.engine.scene,
      this.navGraph,
    );

    this.initSimulation();
    this.initStateSync();
  }

  private initSimulation() {
    // 1. Generate BVH for static environment
    setTimeout(() => {
      // Collect specific meshes from MineStructure
      const staticObjects = this.mineStructure.structures.map((s) => s.mesh);

      // Also add the floor if needed for collision (usually not, but helps)
      const floor = this.engine.scene.getObjectByName("static_floor");
      if (floor) staticObjects.push(floor as any);

      this.bvhManager.generateBVH(staticObjects);
      console.log("BVH Generation Complete");

      // Pass tunnel/cavern structures to EquipmentManager for manual truck wall detection
      this.equipmentManager.setTunnelStructures(
        this.mineStructure.structures.map((s) => ({
          curve: s.curve,
          radius: s.radius,
        })),
      );

      // 2. Spawn Equipment
      this.equipmentManager.spawnManualTruck(
        "MAN-01",
        new THREE.Vector3(-30, 0, 10),
      );

      this.equipmentManager.spawnTruck("TRK-01");
      this.equipmentManager.spawnTruck("TRK-02");
      this.equipmentManager.spawnTruck("TRK-03");
      this.equipmentManager.spawnTruck("DRL-01");
    }, 100);

    // 3. Simulation Loop
    this.engine.renderer.setAnimationLoop(() => {
      const delta = this.engine.clock.getDelta();
      this.equipmentManager.update(delta);

      this.engine.update(delta);

      this.engine.composer.render();
      this.engine.renderPIP();
      this.engine.css2dRenderer.render(this.engine.scene, this.engine.camera);

      this.updateDashboard();
    });
  }

  private updateDashboard() {
    // Update telemetries
    const telemetry = this.equipmentManager.getSelectedTelemetry();
    if (telemetry) {
      const xyzLabel = document.getElementById("telemetry-xyz");
      const vLabel = document.getElementById("telemetry-v");
      if (xyzLabel)
        xyzLabel.innerText = `[${telemetry.x}, ${telemetry.y}, ${telemetry.z}]`;
      if (vLabel) vLabel.innerText = `${telemetry.v} m/s`;
    }

    // Update Proximity Matrix
    const proximityData = this.equipmentManager.getProximityData();
    const matrixContainer = document.getElementById("proximity-matrix");
    if (matrixContainer) {
      matrixContainer.innerHTML = "";
      proximityData.forEach((p) => {
        const div = document.createElement("div");
        div.className = "log-entry";
        div.innerText = `${p.a} <> ${p.b} : ${p.dist.toFixed(1)}m`;
        if (p.dist < 12) div.classList.add("warning");
        if (p.dist < 6) div.classList.add("danger");
        matrixContainer.appendChild(div);
      });
    }
  }

  private initStateSync() {
    // Listen to decoupled state events for UI reactions
    window.addEventListener("engine:EMERGENCY_HALT", (e: any) => {
      this.logEvent(`EMERGENCY HALT: ${e.detail.id}`, "danger");
      document.body.classList.add("alert-flash");
      setTimeout(() => document.body.classList.remove("alert-flash"), 1000);
    });

    window.addEventListener("engine:COLLISION_WARNING", (e: any) => {
      this.logEvent(
        `COLLISION PREDICTED: ${e.detail.truckA} & ${e.detail.truckB}`,
        "warning",
      );
    });

    window.addEventListener("engine:POSITION_UPDATE", () => {
      // Update dashboard UI if needed
    });
  }

  private logEvent(msg: string, type: string) {
    const logContainer = document.getElementById("event-log");
    if (logContainer) {
      const entry = document.createElement("div");
      entry.className = `log-entry ${type}`;
      entry.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logContainer.prepend(entry);
    }
  }

  public init() {
    console.log("Phase 2 - Monitoring Dashboard Online");
  }
}

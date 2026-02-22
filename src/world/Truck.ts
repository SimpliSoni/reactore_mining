import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { stateBus } from "../core/StateBus";

export class Truck {
  public mesh: THREE.Group;
  public id: string;
  public speed: number = 0.15;
  public currentSpeed: number = 0.15;
  public boundingBox: THREE.Box3 = new THREE.Box3();
  public safetyRadius: number = 10;

  private label!: CSS2DObject;
  private path: THREE.Vector3[] = [];
  private pathIndex: number = 0;
  private targetPosition: THREE.Vector3 | null = null;
  private emissiveMat!: THREE.MeshStandardMaterial;

  private innerZone!: THREE.Mesh;
  private outerZone!: THREE.Mesh;
  private pathRibbon!: THREE.Line;
  public isHalted: boolean = false;

  // Manual Control properties
  public isManual: boolean = false;
  public manualVelocity: number = 0;
  public manualSteering: number = 0;
  public manualStatus: "GREEN" | "YELLOW" | "RED" = "GREEN";

  constructor(id: string, startPos: THREE.Vector3) {
    this.id = id;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(startPos);

    this.createModel();
    this.createLabel();
    this.createZonesAndRibbon();
  }

  private createZonesAndRibbon() {
    // Inner Zone (Red): physical footprint + 0.5m
    const innerGeo = new THREE.BoxGeometry(5, 3.5, 8);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.innerZone = new THREE.Mesh(innerGeo, innerMat);
    this.innerZone.position.y = 1.75;
    this.mesh.add(this.innerZone);

    // Outer Zone (Yellow): Velocity-dependent wedge
    const outerGeo = new THREE.BoxGeometry(6, 3.5, 1);
    outerGeo.translate(0, 0, 0.5); // scale outward from back
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.outerZone = new THREE.Mesh(outerGeo, outerMat);
    this.outerZone.position.set(0, 1.75, 4); // front of truck
    this.mesh.add(this.outerZone);

    // Path Ribbon
    const ribbonGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    const ribbonMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });
    this.pathRibbon = new THREE.Line(ribbonGeo, ribbonMat);
    // Ribbon is added to scene in EquipmentManager or we can just keep it absolute
    // Wait, adding to this.mesh means it rotates. We should add it to the scene or handle world coordinates.
    // We'll add it to the mesh, but its points will be updated in local space based on remaining path.
    this.mesh.add(this.pathRibbon);
  }

  private createModel() {
    // High-Detail CAD-Style Truck Abstraction
    this.emissiveMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.8,
    });

    // Body
    const bodyGeo = new THREE.BoxGeometry(4, 1.8, 7);
    const body = new THREE.Mesh(bodyGeo, this.emissiveMat);
    body.position.y = 1.6;
    body.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), edgeMat));
    this.mesh.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(3.2, 1.8, 2.5);
    const cabin = new THREE.Mesh(cabinGeo, this.emissiveMat);
    cabin.position.y = 3.4;
    cabin.position.z = 1.5;
    cabin.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(cabinGeo), edgeMat),
    );
    this.mesh.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.9,
    });
    const positions = [
      [-2.2, 1.2, 2.5],
      [2.2, 1.2, 2.5],
      [-2.2, 1.2, -2.5],
      [2.2, 1.2, -2.5],
    ];
    positions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.add(
        new THREE.LineSegments(new THREE.EdgesGeometry(wheelGeo), edgeMat),
      );
      this.mesh.add(wheel);
    });
  }

  private createLabel() {
    const div = document.createElement("div");
    div.className = "equipment-label";
    div.innerHTML = `
      <div class="label-id">${this.id}</div>
      <div class="label-status">IDLE</div>
    `;
    div.style.backgroundColor = "rgba(0,0,0,0.8)";
    div.style.color = "#ffffff";
    div.style.padding = "4px 8px";
    div.style.borderRadius = "4px";
    div.style.fontSize = "12px";
    div.style.fontFamily = "monospace";
    div.style.border = "1px solid #ffd700";
    div.style.pointerEvents = "none";

    this.label = new CSS2DObject(div);
    this.label.position.set(0, 5, 0);
    this.mesh.add(this.label);
  }

  public setPath(path: THREE.Vector3[]) {
    this.path = path;
    this.pathIndex = 0;
    this.targetPosition = path[0];
    this.updateStatus("MOVING", "#00ff00", 0x00ff00);
  }

  public getVelocityInfo() {
    return {
      x: this.mesh.position.x.toFixed(2),
      y: this.mesh.position.y.toFixed(2),
      z: this.mesh.position.z.toFixed(2),
      v: (this.currentSpeed * 60).toFixed(1),
    };
  }

  public update(delta: number) {
    if (this.isHalted && !this.isManual) return; // Data Freeze for autonomous

    if (this.isManual) {
      this.updateManual(delta);
    } else {
      this.updateAutonomous(delta);
    }
  }

  private updateManual(delta: number) {
    // Apply steering
    this.mesh.rotateY(this.manualSteering * delta);

    // Calculate forward vector based on current rotation
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      this.mesh.quaternion,
    );

    // Always allow movement — collision status is informational only
    this.mesh.position.add(
      forward.multiplyScalar(this.manualVelocity * delta * 60),
    );

    this.boundingBox.setFromObject(this.innerZone);

    // Visuals based on status
    const distPerSec = Math.abs(this.manualVelocity * 60);
    const wedgeLength = Math.max(1, distPerSec * 4);
    this.outerZone.scale.set(1, 1, wedgeLength);

    if (this.manualStatus === "RED") {
      this.updateStatus("COLLISION", "#AF2B1E", 0xaf2b1e); // Red
      (this.innerZone.material as THREE.Material).opacity = 0.6; // Flash
    } else if (this.manualStatus === "YELLOW") {
      this.updateStatus("CAUTION", "#E5BE01", 0xe5be01); // Yellow
      (this.innerZone.material as THREE.Material).opacity = 0.15;
    } else {
      this.updateStatus("MANUAL DRIVING", "#00ff00", 0x00ff00); // Green
      (this.innerZone.material as THREE.Material).opacity = 0.15;
    }

    this.currentSpeed = this.manualVelocity;

    // Update Path Ribbon to show just a short line forward for manual mode
    const localPoints = [
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, -1.5, wedgeLength),
    ];
    this.pathRibbon.geometry.setFromPoints(localPoints);

    stateBus.emit("POSITION_UPDATE", {
      id: this.id,
      pos: this.mesh.position,
      velocity: distPerSec,
    });
  }

  private updateAutonomous(delta: number) {
    if (!this.targetPosition) return;

    const distance = this.mesh.position.distanceTo(this.targetPosition);
    if (distance < 0.5) {
      this.pathIndex++;
      if (this.pathIndex < this.path.length) {
        this.targetPosition = this.path[this.pathIndex];
      } else {
        this.targetPosition = null;
        this.updateStatus("ARRIVED", "#ffff00", 0xffff00);
        this.currentSpeed = 0;
        return;
      }
    }

    const dir = this.targetPosition.clone().sub(this.mesh.position).normalize();
    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      dir,
    );
    this.mesh.quaternion.slerp(targetQuaternion, 0.2);

    this.mesh.position.add(dir.multiplyScalar(this.currentSpeed * delta * 60));
    this.boundingBox.setFromObject(this.innerZone); // update physics bounds based on inner zone

    // Update Outer Buffer Length
    const distPerSec = this.currentSpeed * 60;
    const wedgeLength = Math.max(1, distPerSec * 4); // Stretch forward based on speed
    this.outerZone.scale.set(1, 1, wedgeLength);

    // Update Path Ribbon
    // Calculate path points in local space
    const localPoints: THREE.Vector3[] = [];
    localPoints.push(new THREE.Vector3(0, 0, 0)); // origin

    // Project next 10 seconds of movement
    const projectedDistance = distPerSec * 10;
    let accumulatedDist = 0;
    let currPos = this.mesh.position.clone();

    // Map the remaining path points to World, then convert to Local
    const worldPoints = [currPos];
    for (let i = this.pathIndex; i < this.path.length; i++) {
      const pt: THREE.Vector3 = this.path[i];
      worldPoints.push(pt);
      accumulatedDist += currPos.distanceTo(pt);
      currPos = pt;
      if (accumulatedDist > projectedDistance) break;
    }

    worldPoints.forEach((wp) => {
      const localPt = this.mesh.worldToLocal(wp.clone());
      localPt.y = -1.5; // floor level
      localPoints.push(localPt);
    });

    this.pathRibbon.geometry.setFromPoints(localPoints);

    stateBus.emit("POSITION_UPDATE", {
      id: this.id,
      pos: this.mesh.position,
      velocity: distPerSec,
    });
  }

  public setThrottled(isThrottled: boolean) {
    if (this.isHalted) return;
    this.currentSpeed = isThrottled ? this.speed * 0.3 : this.speed;
    if (isThrottled) {
      this.updateStatus("SAFETY SLOW", "#E5BE01", 0xe5be01); // ISO Safety Yellow
    } else if (this.targetPosition) {
      this.updateStatus("MOVING", "#00ff00", 0x00ff00);
    }
  }

  public halt() {
    this.isHalted = true;
    this.currentSpeed = 0;
    this.updateStatus("EMERGENCY-HALT", "#AF2B1E", 0xaf2b1e); // ISO Danger Red
    (this.innerZone.material as THREE.Material).opacity = 0.6; // Flash
  }

  private updateStatus(status: string, color: string, hexColor: number) {
    const statusEl = this.label.element.querySelector(
      ".label-status",
    ) as HTMLElement;
    if (statusEl) {
      statusEl.innerText = status;
      statusEl.style.color = color;
    }
    if (this.emissiveMat) {
      this.emissiveMat.emissive.setHex(hexColor);
    }
  }
}

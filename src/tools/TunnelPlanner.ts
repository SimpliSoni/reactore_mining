import * as THREE from "three";
import { Engine } from "../core/Engine";
import { CollisionManager } from "./CollisionManager";

export class TunnelPlanner {
  private engine: Engine;
  private collisionManager: CollisionManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private workingPlane: THREE.Plane;

  // State
  private startPoint: THREE.Vector3 | null = null;

  // Visuals
  private startMarker: THREE.Mesh;
  private previewMesh: THREE.Mesh | null = null;
  private safeMaterial: THREE.MeshStandardMaterial;
  private dangerMaterial: THREE.MeshStandardMaterial;

  constructor(engine: Engine, collisionManager: CollisionManager) {
    this.engine = engine;
    this.collisionManager = collisionManager;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Working plane at Y = 0
    this.workingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Materials setup with emissive properties for Bloom effect
    this.safeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
    });

    this.dangerMaterial = new THREE.MeshStandardMaterial({
      color: 0xff2a2a,
      emissive: 0xff2a2a,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
    });

    const markerGeo = new THREE.SphereGeometry(1, 16, 16);
    this.startMarker = new THREE.Mesh(markerGeo, this.safeMaterial);
    this.startMarker.visible = false;
    this.engine.scene.add(this.startMarker);

    this.initEvents();
  }

  private initEvents() {
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("click", this.onClick.bind(this));
  }

  private onMouseMove(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (this.startPoint) {
      this.raycaster.setFromCamera(this.mouse, this.engine.camera);
      const intersectPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.workingPlane, intersectPoint);

      if (intersectPoint) {
        this.updatePreview(intersectPoint);
      }
    }
  }

  private onClick(event: MouseEvent) {
    // Ignore clicks on UI
    const target = event.target as HTMLElement;
    if (target.closest(".panel") && !target.closest(".tunnel-label")) {
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.engine.camera);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.workingPlane, intersectPoint);

    if (intersectPoint) {
      if (!this.startPoint) {
        // First click - Drop start waypoint
        this.startPoint = intersectPoint.clone();
        this.startMarker.position.copy(this.startPoint);
        this.startMarker.visible = true;
        window.dispatchEvent(new Event("planningStarted"));
      } else {
        // Second click - End waypoint
        this.finalizeTunnel(intersectPoint);
      }
    }
  }

  private updatePreview(endPoint: THREE.Vector3) {
    if (!this.startPoint) return;

    // Clean up previous preview
    if (this.previewMesh) {
      this.engine.scene.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
    }

    // Create new tube
    const distance = this.startPoint.distanceTo(endPoint);
    if (distance < 0.1) return;

    const curve = new THREE.LineCurve3(this.startPoint, endPoint);
    const radius = 2; // Matches existing tunnels
    const geometry = new THREE.TubeGeometry(curve, 20, radius, 8, false);

    // Check collision
    const isCollision = this.collisionManager.checkCollision(curve, radius);
    const material = isCollision ? this.dangerMaterial : this.safeMaterial;

    this.previewMesh = new THREE.Mesh(geometry, material);
    this.engine.scene.add(this.previewMesh);
  }

  private finalizeTunnel(endPoint: THREE.Vector3) {
    // We trigger an event rather than cleaning it up immediately so the UI can attach labels
    if (this.previewMesh) {
      const isCollision = this.previewMesh.material === this.dangerMaterial;

      const startNode = this.startPoint!.clone();
      const endNode = endPoint.clone();
      const curve = new THREE.LineCurve3(startNode, endNode);
      const r = 2;

      const customEvent = new CustomEvent("tunnelPlanned", {
        detail: {
          mesh: this.previewMesh,
          curve: curve,
          isCollision: isCollision,
          radius: r,
        },
      });
      window.dispatchEvent(customEvent);

      this.previewMesh = null; // Detach from preview logic
    }

    this.startPoint = null;
    this.startMarker.visible = false;
  }
}

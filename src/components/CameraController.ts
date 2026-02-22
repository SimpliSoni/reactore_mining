import * as THREE from "three";
import gsap from "gsap";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: MapControls;

  constructor(camera: THREE.PerspectiveCamera, controls: MapControls) {
    this.camera = camera;
    this.controls = controls;
  }

  public frameTarget(targetPosition: THREE.Vector3) {
    // Find a good camera position based on the target
    const offset = new THREE.Vector3(20, 30, 20); // Isometric offset
    const optimalCamPos = targetPosition.clone().add(offset);

    // Animate Camera Position
    gsap.to(this.camera.position, {
      x: optimalCamPos.x,
      y: optimalCamPos.y,
      z: optimalCamPos.z,
      duration: 1.5,
      ease: "power3.inOut",
    });

    // Animate Controls Target
    gsap.to(this.controls.target, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 1.5,
      ease: "power3.inOut",
    });
  }
}

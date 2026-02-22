import * as THREE from "three";
import { Engine } from "../core/Engine";

export class Environment {
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
    this.initLighting();
    this.initGrid();
  }

  private initLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // dim
    this.engine.scene.add(ambientLight);

    // Point lights to simulate dramatic depth
    const pointLight1 = new THREE.PointLight(0x00f0ff, 1.5, 100);
    pointLight1.position.set(20, 10, -20);
    this.engine.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffaa00, 1.5, 100);
    pointLight2.position.set(-20, 10, 20);
    this.engine.scene.add(pointLight2);
  }

  private initGrid() {
    // High-tech topographical map look
    const size = 300;
    const divisions = 60; // 5m per square
    const colorCenterLine = 0x333333;
    const colorGrid = 0x111116;

    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      colorCenterLine,
      colorGrid,
    );

    gridHelper.position.y = -4.05; // Just above the pitch black floor

    // Add a bit of glow effect to the grid lines
    gridHelper.material = new THREE.LineBasicMaterial({
      color: 0x222228,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.engine.scene.add(gridHelper);
  }
}

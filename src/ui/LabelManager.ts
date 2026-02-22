import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export class LabelManager {
  public createTunnelLabel(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    isCollision: boolean,
  ): CSS2DObject {
    const distance = start.distanceTo(end);

    // Calculate incline angle
    const dy = end.y - start.y;
    const dxz = new THREE.Vector2(end.x - start.x, end.z - start.z).length();
    let angle = 0;
    if (dxz > 0) {
      angle = THREE.MathUtils.radToDeg(Math.atan2(dy, dxz));
    }

    const volume = Math.PI * Math.pow(radius, 2) * distance;

    const div = document.createElement("div");
    div.className = `tunnel-label ${isCollision ? "error" : ""}`;

    div.innerHTML = `
            <div class="title">${isCollision ? "COLLISION DETECTED" : "EVALUATED TUNNEL"}</div>
            <div class="data-row"><span>Length:</span> <span class="val">${distance.toFixed(1)}m</span></div>
            <div class="data-row"><span>Gradient:</span> <span class="val">${angle.toFixed(1)}°</span></div>
            <div class="data-row"><span>Est. Volume:</span> <span class="val">${volume.toFixed(0)}m³</span></div>
        `;

    const label = new CSS2DObject(div);

    // Place label at the midpoint
    const midPoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    label.position.copy(midPoint);

    return label;
  }
}

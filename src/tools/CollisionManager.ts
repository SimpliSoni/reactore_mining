import * as THREE from "three";
import { MineStructure } from "../world/MineStructure";

export class CollisionManager {
  private mineStructure: MineStructure;

  constructor(mineStructure: MineStructure) {
    this.mineStructure = mineStructure;
  }

  public checkCollision(
    newCurve: THREE.LineCurve3 | THREE.CatmullRomCurve3,
    newRadius: number,
  ): boolean {
    // Sample points along the new curve
    const segments = 20;
    const newPoints = newCurve.getPoints(segments);

    for (const structure of this.mineStructure.structures) {
      const existingCurve = structure.curve;
      const existingRadius = structure.radius;
      const existingPoints = existingCurve.getPoints(50);

      // Minimum required distance between centerlines for safety margin
      const minDistance = newRadius + existingRadius;

      // Check distance between line segments
      for (let i = 0; i < newPoints.length - 1; i++) {
        const p1 = newPoints[i];
        const p2 = newPoints[i + 1];

        for (let j = 0; j < existingPoints.length - 1; j++) {
          const q1 = existingPoints[j];
          const q2 = existingPoints[j + 1];

          const dist = this.getShortestDistanceBetweenLineSegments(
            p1,
            p2,
            q1,
            q2,
          );
          if (dist < minDistance) {
            return true; // Collision detected!
          }
        }
      }
    }
    return false;
  }

  // Math helper to find shortest distance between two line segments in 3D
  private getShortestDistanceBetweenLineSegments(
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    q1: THREE.Vector3,
    q2: THREE.Vector3,
  ): number {
    const u = p2.clone().sub(p1);
    const v = q2.clone().sub(q1);
    const w = p1.clone().sub(q1);

    const a = u.dot(u);
    const b = u.dot(v);
    const c = v.dot(v);
    const d = u.dot(w);
    const e = v.dot(w);

    const D = a * c - b * b;
    let sc,
      sN,
      sD = D;
    let tc,
      tN,
      tD = D;

    if (D < 1e-8) {
      sN = 0.0;
      sD = 1.0;
      tN = e;
      tD = c;
    } else {
      sN = b * e - c * d;
      tN = a * e - b * d;
      if (sN < 0.0) {
        sN = 0.0;
        tN = e;
        tD = c;
      } else if (sN > sD) {
        sN = sD;
        tN = e + b;
        tD = c;
      }
    }

    if (tN < 0.0) {
      tN = 0.0;
      if (-d < 0.0) sN = 0.0;
      else if (-d > a) sN = sD;
      else {
        sN = -d;
        sD = a;
      }
    } else if (tN > tD) {
      tN = tD;
      if (-d + b < 0.0) sN = 0;
      else if (-d + b > a) sN = sD;
      else {
        sN = -d + b;
        sD = a;
      }
    }

    sc = Math.abs(sN) < 1e-8 ? 0.0 : sN / sD;
    tc = Math.abs(tN) < 1e-8 ? 0.0 : tN / tD;

    const dP = w
      .clone()
      .add(u.clone().multiplyScalar(sc))
      .sub(v.clone().multiplyScalar(tc));
    return dP.length();
  }
}

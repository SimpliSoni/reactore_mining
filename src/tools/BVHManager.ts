import * as THREE from "three";
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from "three-mesh-bvh";

// Extend Three.js types to include BVH properties
// @ts-ignore
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// @ts-ignore
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
// @ts-ignore
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export class BVHManager {
  private static instance: BVHManager;
  private bvhMeshes: THREE.Mesh[] = [];

  private constructor() {}

  public static getInstance(): BVHManager {
    if (!BVHManager.instance) {
      BVHManager.instance = new BVHManager();
    }
    return BVHManager.instance;
  }

  /**
   * Generates BVH for a given mesh or array of meshes.
   * This is a heavy operation, so do it once for static environment.
   */
  public generateBVH(objects: THREE.Object3D[]) {
    objects.forEach((obj) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.computeBoundsTree();
          this.bvhMeshes.push(child);
        }
      });
    });
  }

  /**
   * Checks if a point or sphere is colliding with any BVH meshes.
   * Optimized for production: uses the bounds tree.
   */
  public checkSphereCollision(sphere: THREE.Sphere): boolean {
    for (const mesh of this.bvhMeshes) {
      // @ts-ignore
      const res = mesh.geometry.boundsTree.shapecast({
        intersectsBounds: (box: THREE.Box3) => box.intersectsSphere(sphere),
        intersectsTriangle: (tri: any) => {
          if (tri.intersectsSphere) return tri.intersectsSphere(sphere);
          return false;
        },
      });
      if (res) return true;
    }
    return false;
  }

  /**
   * Checks for intersection between an AABB and the BVH environment.
   */
  public checkBoxCollision(box: THREE.Box3): boolean {
    for (const mesh of this.bvhMeshes) {
      // @ts-ignore
      const res = mesh.geometry.boundsTree.shapecast({
        intersectsBounds: (otherBox: THREE.Box3) => otherBox.intersectsBox(box),
        intersectsTriangle: (tri: any) => {
          if (tri.intersectsBox) return tri.intersectsBox(box);
          return false;
        },
      });
      if (res) return true;
    }
    return false;
  }
}

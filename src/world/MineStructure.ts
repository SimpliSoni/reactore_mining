import * as THREE from "three";
import { Engine } from "../core/Engine";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export class MineStructure {
  private engine: Engine;
  public structures: {
    mesh: THREE.Mesh;
    curve: THREE.CatmullRomCurve3;
    radius: number;
  }[] = [];

  constructor(engine: Engine) {
    this.engine = engine;
    this.generateExistingTunnels();
    this.generateStaticEquipment();
  }

  private generateStaticEquipment() {
    // 1. Fuel Station in Fuel Depot (-60, 0, 0)
    const fuelGroup = new THREE.Group();
    fuelGroup.position.set(-60, -4, 0); // Ground level of cavern

    // Fuel Tank base
    const tankGeo = new THREE.CylinderGeometry(3, 3, 6, 16);
    tankGeo.translate(0, 3, 0); // pivot at bottom
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.8,
    });
    const tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.set(-4, 0, -4);

    const tank2 = new THREE.Mesh(tankGeo, tankMat);
    tank2.position.set(-4, 0, 4);

    // Connective piping
    const pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(-4, 5, 0);

    // Emissive signage/accents
    const lightGeo = new THREE.BoxGeometry(0.2, 4, 0.2);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green for fuel
    const light1 = new THREE.Mesh(lightGeo, lightMat);
    light1.position.set(-2, 3, -4);
    const light2 = new THREE.Mesh(lightGeo, lightMat);
    light2.position.set(-2, 3, 4);

    fuelGroup.add(tank1, tank2, pipe, light1, light2);
    this.engine.scene.add(fuelGroup);

    // Collision bounds for Fuel Station
    const fuelCollisionGeo = new THREE.BoxGeometry(6, 6, 12);
    fuelCollisionGeo.translate(0, 3, 0);
    const fuelCollisionMesh = new THREE.Mesh(
      fuelCollisionGeo,
      new THREE.MeshBasicMaterial(),
    );
    fuelCollisionMesh.position.copy(fuelGroup.position);
    fuelCollisionMesh.position.x -= 4; // center over tanks
    this.structures.push({
      mesh: fuelCollisionMesh,
      curve: new THREE.CatmullRomCurve3([fuelCollisionMesh.position]),
      radius: 6, // Used for proximity but mainly bvh needs the mesh
    });

    // 2. Drilling Rig in Excavation Area (0, 0, 60)
    const drillGroup = new THREE.Group();
    drillGroup.position.set(0, -4, 60);

    // Rig Base
    const baseGeo = new THREE.BoxGeometry(6, 1, 8);
    baseGeo.translate(0, 0.5, 0);
    const rigBase = new THREE.Mesh(baseGeo, tankMat);

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.5, 1.5, 12, 4);
    mastGeo.translate(0, 6, 0);
    const mast = new THREE.Mesh(
      mastGeo,
      new THREE.MeshStandardMaterial({
        color: 0x442200,
        roughness: 0.9,
        metalness: 0.5,
      }),
    );
    mast.position.set(0, 1, -2);
    mast.rotation.x = -0.1;

    // Laser/Drill bit effect
    const laserGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 4);
    laserGeo.translate(0, -4, 0); // point down
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const laser = new THREE.Mesh(laserGeo, laserMat);
    laser.position.set(0, 6, -1);
    laser.rotation.x = 0.5;

    drillGroup.add(rigBase, mast, laser);
    this.engine.scene.add(drillGroup);

    // Collision bounds for Drilling Rig
    const drillCollisionGeo = new THREE.BoxGeometry(6, 12, 8);
    drillCollisionGeo.translate(0, 6, 0);
    const drillCollisionMesh = new THREE.Mesh(
      drillCollisionGeo,
      new THREE.MeshBasicMaterial(),
    );
    drillCollisionMesh.position.copy(drillGroup.position);
    this.structures.push({
      mesh: drillCollisionMesh,
      curve: new THREE.CatmullRomCurve3([drillCollisionMesh.position]),
      radius: 5,
    });
  }

  private generateExistingTunnels() {
    // Define Caverns (Central Hub, Processing Area, Fuel Depot, Excavation Site)
    const caverns = [
      { id: "hub", pos: new THREE.Vector3(0, 0, 0), radius: 18, type: "HUB" },
      {
        id: "fuel",
        pos: new THREE.Vector3(-60, 0, 0),
        radius: 15,
        type: "FUEL",
      },
      {
        id: "process",
        pos: new THREE.Vector3(60, 0, 0),
        radius: 16,
        type: "PROCESS",
      },
      { id: "dig1", pos: new THREE.Vector3(0, 0, 60), radius: 14, type: "DIG" },
      {
        id: "dig2",
        pos: new THREE.Vector3(0, 0, -60),
        radius: 14,
        type: "DIG",
      },
      {
        id: "dig3",
        pos: new THREE.Vector3(50, 0, 40),
        radius: 12,
        type: "DIG",
      },
      {
        id: "dig4",
        pos: new THREE.Vector3(-40, 0, -40),
        radius: 12,
        type: "DIG",
      },
    ];

    const paths = [
      // Main East-West Artery
      [
        new THREE.Vector3(-60, 0, 0),
        new THREE.Vector3(-30, 0, 10),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(30, 0, -10),
        new THREE.Vector3(60, 0, 0),
      ],
      // Main North-South Artery
      [
        new THREE.Vector3(0, 0, -60),
        new THREE.Vector3(-5, 0, -30),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(5, 0, 30),
        new THREE.Vector3(0, 0, 60),
      ],
      // Diagonal Branch
      [
        new THREE.Vector3(-40, 0, -40),
        new THREE.Vector3(-20, 0, -10),
        new THREE.Vector3(0, 0, 0), // Link to hub
        new THREE.Vector3(20, 0, 20),
        new THREE.Vector3(50, 0, 40),
      ],
    ];

    // Clean dark material for tunnel walls
    const baseMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a0c,
      transparent: true,
      opacity: 0.8,
      depthWrite: true,
    });

    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.4,
    });

    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    paths.forEach((points) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubularSegments = 256; // Higher detail for production grade
      const radialSegments = 16;
      const radius = 5; // Wider tunnels for equipment in the city
      const closed = false;

      const geometry = new THREE.TubeGeometry(
        curve,
        tubularSegments,
        radius,
        radialSegments,
        closed,
      );

      const tunnelGroup = new THREE.Group();

      const tunnelMesh = new THREE.Mesh(geometry, baseMaterial);
      tunnelMesh.name = "static_tunnel";
      // We keep the mesh for BVH collision
      this.structures.push({
        mesh: tunnelMesh,
        curve: curve,
        radius: radius,
      });

      const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        wireframeMaterial,
      );

      const pc = new THREE.Points(geometry, pointsMaterial);

      tunnelGroup.add(tunnelMesh);
      tunnelGroup.add(wireframe);
      tunnelGroup.add(pc);

      // Add distance markers along the curve
      const length = curve.getLength();
      for (let i = 0; i <= length; i += 20) {
        if (i === 0) continue; // Skip starting overlap
        const point = curve.getPointAt(i / length);

        const div = document.createElement("div");
        div.className = "distance-marker";
        div.innerText = `${Math.round(i)}m`;

        const label = new CSS2DObject(div);
        label.position.copy(point);
        label.position.y += radius + 1; // Top of the tunnel
        tunnelGroup.add(label);
      }

      // Add Support Arches along the tunnel
      const archGeo = new THREE.TorusGeometry(
        radius + 0.1,
        0.3,
        8,
        24,
        Math.PI,
      );
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        emissive: 0x0a0a0a,
        roughness: 0.8,
        metalness: 0.5,
      });
      // Emissive warning trim
      const trimGeo = new THREE.TorusGeometry(
        radius + 0.15,
        0.05,
        4,
        16,
        Math.PI,
      );
      const trimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

      for (let i = 10; i < length; i += 30) {
        const point = curve.getPointAt(i / length);
        const tangent = curve.getTangentAt(i / length);

        const archGroup = new THREE.Group();
        const arch = new THREE.Mesh(archGeo, archMat);
        const trim = new THREE.Mesh(trimGeo, trimMat);

        archGroup.add(arch);
        archGroup.add(trim);

        archGroup.position.copy(point);
        // Align arch to face down the tunnel
        archGroup.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          tangent,
        );
        // Keep the arch upright
        archGroup.rotation.x = -Math.PI / 2;

        tunnelGroup.add(archGroup);
      }

      this.engine.scene.add(tunnelGroup);
    });

    // Generate Caverns
    caverns.forEach((cavern) => {
      const cavernGroup = new THREE.Group();
      cavernGroup.position.copy(cavern.pos);

      // Main cavern cylinder (Dome)
      const cavGeo = new THREE.CylinderGeometry(
        cavern.radius,
        cavern.radius,
        cavern.radius * 0.8,
        32,
        1,
        false,
      );
      // Move pivot to bottom
      cavGeo.translate(0, (cavern.radius * 0.8) / 2, 0);

      const cavMesh = new THREE.Mesh(cavGeo, baseMaterial);
      cavMesh.position.y = -4; // Sink into ground slightly below tunnel level
      cavMesh.name = `cavern_${cavern.id}`;

      this.structures.push({
        mesh: cavMesh,
        curve: new THREE.CatmullRomCurve3([cavern.pos]), // Dummy curve
        radius: cavern.radius,
      });

      const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(cavGeo),
        wireframeMaterial,
      );
      wireframe.position.y = -4;

      const pc = new THREE.Points(cavGeo, pointsMaterial);
      pc.position.y = -4;

      cavernGroup.add(cavMesh);
      cavernGroup.add(wireframe);
      cavernGroup.add(pc);

      // Central Pillar
      if (cavern.radius > 14) {
        const pillarGeo = new THREE.CylinderGeometry(
          2,
          2,
          cavern.radius * 0.8,
          16,
        );
        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.9,
          metalness: 0.8,
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.y = (cavern.radius * 0.8) / 2 - 4 - 0.1;

        // Emissive rings on pillar
        const ringGeo = new THREE.TorusGeometry(2.1, 0.1, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = pillar.position.y + 2;

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.y = pillar.position.y - 2;

        cavernGroup.add(pillar);
        cavernGroup.add(ring1);
        cavernGroup.add(ring2);

        // Add pillar to collision structures
        // Since it's inside the cavern mesh (which is a cylinder bounds),
        // we should actually add the pillar explicitly so vehicles hit it.
        // Adjust pillar world position
        const pillarWorldMesh = new THREE.Mesh(pillarGeo, pillarMat);
        pillarWorldMesh.position.copy(cavern.pos);
        pillarWorldMesh.position.y = pillar.position.y;
        this.structures.push({
          mesh: pillarWorldMesh,
          curve: new THREE.CatmullRomCurve3([cavernGroup.position]),
          radius: 2,
        });
      }

      // Add Label
      const div = document.createElement("div");
      div.className = "cavern-label";
      div.style.color = "#00f0ff";
      div.style.fontFamily = "monospace";
      div.style.fontSize = "16px";
      div.style.fontWeight = "bold";
      div.style.textShadow = "0 0 5px #00f0ff";
      div.style.marginTop = "-20px";
      div.innerText = `${cavern.type} [${cavern.id.toUpperCase()}]`;

      const label = new CSS2DObject(div);
      label.position.set(0, cavern.radius * 0.8 - 3, 0);
      cavernGroup.add(label);

      this.engine.scene.add(cavernGroup);
    });

    // Add a base floor to anchor the scene (technical grid)
    const floorGeo = new THREE.PlaneGeometry(400, 400);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      depthWrite: false,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -4.1; // Slightly below tunnel floor
    floorMesh.name = "static_floor";
    this.engine.scene.add(floorMesh);
  }
}

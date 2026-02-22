import * as THREE from "three";

export interface NavNode {
  id: string;
  position: THREE.Vector3;
  connections: string[]; // IDs of connected nodes
}

export class NavGraph {
  private nodes: Map<string, NavNode> = new Map();

  constructor() {
    this.initDefaultGraph();
  }

  private initDefaultGraph() {
    // NavGraph waypoints follow the MineStructure tunnel curve control points
    // so trucks stay inside the visual tunnel geometry.

    // East-West Artery: FUEL → Hub → PROCESS
    // Curve: (-60,0,0) → (-30,0,10) → (0,0,0) → (30,0,-10) → (60,0,0)
    // North-South Artery: DIG2(south) → Hub → DIG1(north)
    // Curve: (0,0,-60) → (-5,0,-30) → (0,0,0) → (5,0,30) → (0,0,60)
    // Diagonal: DIG4(SW) → Hub → DIG3(NE)
    // Curve: (-40,0,-40) → (-20,0,-10) → (0,0,0) → (20,0,20) → (50,0,40)

    const defaultNodes: NavNode[] = [
      // East-West Artery
      {
        id: "FUEL",
        position: new THREE.Vector3(-60, 0, 0),
        connections: ["EW1"],
      },
      {
        id: "EW1",
        position: new THREE.Vector3(-30, 0, 10),
        connections: ["FUEL", "HUB"],
      },
      {
        id: "HUB",
        position: new THREE.Vector3(0, 0, 0),
        connections: ["EW1", "EW2", "NS1", "NS2", "DG1", "DG2"],
      },
      {
        id: "EW2",
        position: new THREE.Vector3(30, 0, -10),
        connections: ["HUB", "PROC"],
      },
      {
        id: "PROC",
        position: new THREE.Vector3(60, 0, 0),
        connections: ["EW2"],
      },

      // North-South Artery
      {
        id: "NS1",
        position: new THREE.Vector3(-5, 0, -30),
        connections: ["DIG2", "HUB"],
      },
      {
        id: "DIG2",
        position: new THREE.Vector3(0, 0, -60),
        connections: ["NS1"],
      },
      {
        id: "NS2",
        position: new THREE.Vector3(5, 0, 30),
        connections: ["HUB", "DIG1"],
      },
      {
        id: "DIG1",
        position: new THREE.Vector3(0, 0, 60),
        connections: ["NS2"],
      },

      // Diagonal Branch
      {
        id: "DG1",
        position: new THREE.Vector3(-20, 0, -10),
        connections: ["DIG4", "HUB"],
      },
      {
        id: "DIG4",
        position: new THREE.Vector3(-40, 0, -40),
        connections: ["DG1"],
      },
      {
        id: "DG2",
        position: new THREE.Vector3(20, 0, 20),
        connections: ["HUB", "DIG3"],
      },
      {
        id: "DIG3",
        position: new THREE.Vector3(50, 0, 40),
        connections: ["DG2"],
      },
    ];

    defaultNodes.forEach((node) => this.nodes.set(node.id, node));
  }

  public getPath(startId: string, endId: string): THREE.Vector3[] | null {
    // For Phase 2, we return a simple linear path if nodes are connected
    // In production, this would use A*
    const startNode = this.nodes.get(startId);
    const endNode = this.nodes.get(endId);

    if (startNode && endNode && startNode.connections.includes(endId)) {
      return [startNode.position.clone(), endNode.position.clone()];
    }
    return null;
  }

  public getNodes(): NavNode[] {
    return Array.from(this.nodes.values());
  }

  public getRandomNodeId(): string {
    const keys = Array.from(this.nodes.keys());
    return keys[Math.floor(Math.random() * keys.length)];
  }

  public getConnectedNodeId(nodeId: string): string {
    const node = this.nodes.get(nodeId);
    if (node && node.connections.length > 0) {
      return node.connections[
        Math.floor(Math.random() * node.connections.length)
      ];
    }
    return nodeId;
  }
}

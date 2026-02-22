import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public pipCamera: THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer;
  public css2dRenderer: CSS2DRenderer;
  public controls: MapControls;
  public clock: THREE.Clock;

  private frustumSize: number = 100;
  private keys: Record<string, boolean> = {};

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#1a1a1e"); // Dark Slate Industrial Gray

    // Crisp Industrial Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    this.scene.add(sunLight);

    // Init Camera (Isometric View)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      (this.frustumSize * aspect) / -2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      this.frustumSize / -2,
      0.1,
      2000,
    );

    // Precise Isometric Angle: 45 deg Y, 35.264 deg X
    // We achieve this by placing the camera at a specific diagonal
    const isoDist = 200;
    this.camera.position.set(isoDist, isoDist, isoDist);
    this.camera.lookAt(0, 0, 0);

    // Multi-View PIP: 2D Top-Down LiDAR Camera
    const pipFrustum = 80;
    this.pipCamera = new THREE.OrthographicCamera(
      pipFrustum / -2,
      pipFrustum / 2,
      pipFrustum / 2,
      pipFrustum / -2,
      0.1,
      1000,
    );
    this.pipCamera.position.set(0, 200, 0);
    this.pipCamera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const appContainer = document.getElementById("app");
    if (appContainer) {
      appContainer.appendChild(this.renderer.domElement);
    }

    this.css2dRenderer = new CSS2DRenderer();
    this.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
    this.css2dRenderer.domElement.style.position = "absolute";
    this.css2dRenderer.domElement.style.top = "0px";
    this.css2dRenderer.domElement.style.pointerEvents = "none";
    if (appContainer) {
      appContainer.appendChild(this.css2dRenderer.domElement);
    }

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4, // subtle glow
      0.2, // radius
      0.9, // threshold
    );
    this.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.screenSpacePanning = false; // Pan in XZ plane
    this.controls.minZoom = 0.3;
    this.controls.maxZoom = 6;

    // Enable rotation for better exploration
    this.controls.enableRotate = true;
    this.controls.rotateSpeed = 0.5;
    this.controls.maxPolarAngle = Math.PI / 2.5; // Don't flip below ground
    this.controls.minPolarAngle = Math.PI / 8; // Don't go fully top-down

    this.clock = new THREE.Clock();

    window.addEventListener("resize", this.onWindowResize.bind(this));
    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
  }

  private handleKeyboardPanning(delta: number) {
    const panSpeed = 100 * delta;
    const move = new THREE.Vector3();

    // Arrow keys for camera panning, Q/E for rotation
    if (this.keys["ArrowUp"]) move.z -= 1;
    if (this.keys["ArrowDown"]) move.z += 1;
    if (this.keys["ArrowLeft"]) move.x -= 1;
    if (this.keys["ArrowRight"]) move.x += 1;

    // Q/E to orbit camera around target
    if (this.keys["KeyQ"]) {
      const angle = delta * 1.5;
      this.rotateControlsAroundTarget(angle);
    }
    if (this.keys["KeyE"]) {
      const angle = -delta * 1.5;
      this.rotateControlsAroundTarget(angle);
    }

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(panSpeed);
      // Rotate movement relative to camera direction
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      const angle = Math.atan2(camDir.x, camDir.z);
      const rx = move.x * Math.cos(angle) - move.z * Math.sin(angle);
      const rz = move.x * Math.sin(angle) + move.z * Math.cos(angle);

      this.controls.target.x += rx;
      this.controls.target.z += rz;
      this.camera.position.x += rx;
      this.camera.position.z += rz;
    }
  }

  private rotateControlsAroundTarget(angle: number) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += angle;
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.controls.target).add(offset);
    this.camera.lookAt(this.controls.target);
  }

  private onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = (this.frustumSize * aspect) / -2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = this.frustumSize / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  public renderPIP() {
    // Sync PIP Camera position with main camera's target
    this.pipCamera.position.x = this.controls.target.x;
    this.pipCamera.position.z = this.controls.target.z;

    const pipSize = 250;
    const padding = 20;
    const x = window.innerWidth - pipSize - padding;

    // Three.js viewport uses bottom-left for origin, so y = window.innerHeight - padding - pipSize
    const viewportY = window.innerHeight - padding - pipSize;

    this.renderer.setViewport(x, viewportY, pipSize, pipSize);
    this.renderer.setScissor(x, viewportY, pipSize, pipSize);
    this.renderer.setScissorTest(true);

    // Render overlay border
    this.renderer.render(this.scene, this.pipCamera);

    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setScissorTest(false);
  }

  public update(delta: number) {
    this.handleKeyboardPanning(delta);
    this.controls.update();
  }
}

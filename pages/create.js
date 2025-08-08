// pages/create.js
import React, { useEffect, useRef, useState } from "react";

export default function CreatePage() {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [nftCount, setNftCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let THREE, rendererBg, rendererMain, bgScene, mainScene, bgCamera, mainCamera, animationId;
    let nftGroup, particlesGeo, torus;

    async function initScene() {
      // dynamic import of three to avoid SSR issues
      THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

      const container = mountRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // bg renderer (subtle particles)
      rendererBg = new THREE.WebGLRenderer({ antialias: false, alpha: true, canvas: document.createElement("canvas") });
      rendererBg.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererBg.setSize(width, height);
      rendererBg.domElement.style.position = "absolute";
      rendererBg.domElement.style.inset = 0;
      rendererBg.domElement.style.width = "100%";
      rendererBg.domElement.style.height = "100%";
      container.appendChild(rendererBg.domElement);

      // main renderer (NFTs)
      rendererMain = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: document.createElement("canvas") });
      rendererMain.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererMain.setSize(width, height);
      rendererMain.domElement.style.position = "absolute";
      rendererMain.domElement.style.inset = 0;
      rendererMain.domElement.style.width = "100%";
      rendererMain.domElement.style.height = "100%";
      container.appendChild(rendererMain.domElement);

      // Background scene
      bgScene = new THREE.Scene();
      bgCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      bgCamera.position.z = 12;

      const particleCount = 420;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        const c = new THREE.Color().setHSL(0.56 + Math.random() * 0.06, 0.6, 0.48 + Math.random() * 0.08);
        colors[i * 3 + 0] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      particlesGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const particlesMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.95 });
      const particles = new THREE.Points(particlesGeo, particlesMat);
      bgScene.add(particles);

      // Floating torus
      torus = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.25, 64, 128),
        new THREE.MeshStandardMaterial({ color: 0x2aa6ff, emissive: 0x06213a, metalness: 0.3, roughness: 0.45, emissiveIntensity: 0.6 })
      );
      torus.rotation.x = 0.6;
      bgScene.add(torus);
      bgScene.add(new THREE.AmbientLight(0xffffff, 0.3));
      const dl = new THREE.DirectionalLight(0x9ad8ff, 0.6);
      dl.position.set(5, 10, 7);
      bgScene.add(dl);

      // Main scene (NFTs)
      mainScene = new THREE.Scene();
      mainCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      mainCamera.position.z = 8;
      mainScene.add(new THREE.AmbientLight(0xffffff, 0.9));
      nftGroup = new THREE.Group();
      mainScene.add(nftGroup);

      // Orbit controls (subtle)
      const controls = new OrbitControls(mainCamera, rendererMain.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 4;
      controls.maxDistance = 20;

      // Fetch NFTs from serverless endpoint
      try {
        const apiRes = await fetch("/api/fx1-nft?contract=0x24c42adfb620f3835fcb31fbdf3c1773fac76970");
        const json = await apiRes.json();
        const items = (json && json.nfts) ? json.nfts : [];
        if (!mounted) return;
        setNftCount(items.length);
        // Create planes for each NFT (limit for performance on lower screens)
        const maxItems = Math.min(items.length, 28); // limit to 28 for perf
        const angleStep = (2 * Math.PI) / (maxItems || 6);
        const radius = 5;
        for (let i = 0; i < maxItems; i++) {
          const it = items[i];
          const url = it.image || it.mediaGateway || it.imageUrl;
          if (!url) continue;

          // prefer smaller size images if available (some IPFS imgs large) - still client side
          const texture = new THREE.TextureLoader().load(url);
          const w = 1.6, h = 1.6;
          const planeGeo = new THREE.PlaneGeometry(w, h);
          const planeMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(planeGeo, planeMat);
          const a = i * angleStep;
          mesh.position.set(radius * Math.cos(a), 0.8 + (Math.sin(i) * 0.25), radius * Math.sin(a));
          mesh.lookAt(0, 0.8, 0);
          mesh.userData = { zoraUrl: `https://zora.co/collect/${it.contract || "0x24c42..."}${it.tokenId ? `/${it.tokenId}` : ""}` };
          nftGroup.add(mesh);
        }
      } catch (err) {
        console.error("Failed to load NFTs:", err);
      } finally {
        if (mounted) setLoading(false);
      }

      // Raycaster for clicks
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      function onPointerDown(e) {
        const rect = rendererMain.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, mainCamera);
        const hits = raycaster.intersectObjects(nftGroup.children, true);
        if (hits.length) {
          const url = hits[0].object.userData.zoraUrl;
          if (url) window.open(url, "_blank");
        }
      }
      rendererMain.domElement.style.cursor = "pointer";
      window.addEventListener("pointerdown", onPointerDown);

      // Resize handling
      function onResize() {
        if (!container) return;
        const w = container.clientWidth, h = container.clientHeight;
        rendererBg.setSize(w, h);
        rendererMain.setSize(w, h);
        bgCamera.aspect = w / h; bgCamera.updateProjectionMatrix();
        mainCamera.aspect = w / h; mainCamera.updateProjectionMatrix();
      }
      window.addEventListener("resize", onResize);

      // Animation loop
      const clock = new THREE.Clock();
      function animate() {
        animationId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        // particle drift
        const pos = particlesGeo.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3 + 1] += Math.sin(t * 0.06 + i) * 0.0008;
          if (pos[i * 3 + 1] > 20) pos[i * 3 + 1] = -20;
        }
        particlesGeo.attributes.position.needsUpdate = true;
        torus.rotation.y += 0.004;
        torus.rotation.x += 0.002;

        // rotate gallery
        nftGroup.rotation.y += 0.0025;

        rendererBg.render(bgScene, bgCamera);
        rendererMain.render(mainScene, mainCamera);
      }
      animate();

      // cleanup function
      return () => {
        mounted = false;
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("resize", onResize);
        try {
          container.removeChild(rendererBg.domElement);
          container.removeChild(rendererMain.domElement);
        } catch (e) { /* ignore */ }
      };
    } // end initScene

    const cleanupPromise = initScene();
    return () => {
      mounted = false;
      cleanupPromise.then((fn) => { if (typeof fn === "function") fn(); }).catch(()=>{});
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#03061a 0%, #04102a 100%)", color: "#fff", paddingBottom: 48 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px 20px 20px" }}>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>🎨 Become an FX1 Creator</h1>
        <p style={{ color: "#cbd5e1", maxWidth: 900 }}>
          Create original art, mint on-chain, and earn every time your work is collected.
          FX1 gives creators the tools to turn imagination into on-chain collectibles — with AI tools, IPFS hosting, and a gallery that shows your work in 3D.
        </p>

        <div style={{ display: "flex", gap: 16, marginTop: 22, flexWrap: "wrap" }}>
          <a href="/mint" className="fx1-cta" style={{ background: "#ff2d6d", padding: "12px 18px", borderRadius: 10, color: "#fff", textDecoration: "none" }}>🚀 Start Creating</a>
          <a href="https://dalle.com" target="_blank" rel="noreferrer" className="fx1-cta">DALL·E 3</a>
          <a href="https://www.midjourney.com" target="_blank" rel="noreferrer" className="fx1-cta">MidJourney</a>
          <a href="https://leonardo.ai" target="_blank" rel="noreferrer" className="fx1-cta">Leonardo.AI</a>
        </div>

        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>
          {/* Left: 3D Stage */}
          <div style={{ height: 640, borderRadius: 12, overflow: "hidden", position: "relative", background: "linear-gradient(180deg,#061022 0%, #071230 60%)" }}>
            <div ref={mountRef} style={{ width: "100%", height: "100%", position: "relative" }}>
              {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ color: "#9fbbe6" }}>Loading FX1 Gallery…</div>
              </div>}
            </div>
          </div>

          {/* Right: Creator steps & AI tools */}
          <aside style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>How it works</h3>
            <ol style={{ paddingLeft: 18 }}>
              <li>Design with your favorite AI or tool (DALL·E, MidJourney, Leonardo).</li>
              <li>Pin your assets to IPFS via Piñata (we can help automate this).</li>
              <li>Mint your piece on Zora / Manifold and list it in FX1 Gallery.</li>
              <li>Share and earn when collectors buy or trade your work.</li>
            </ol>

            <h4 style={{ marginTop: 18 }}>Featured AI Tools</h4>
            <ul>
              <li>🖼️ DALL·E 3 — imaginative illustration</li>
              <li>🌌 MidJourney — mood & photorealism</li>
              <li>✨ Leonardo.AI — concept & fantasy</li>
              <li>🎬 Runway ML — motion & video art</li>
            </ul>

            <div style={{ marginTop: 12 }}>
              <a href="/upload" className="fx1-cta" style={{ display: "inline-block", marginBottom: 8 }}>Upload & Pin to IPFS</a>
              <a href="/mint" className="fx1-cta" style={{ display: "inline-block" }}>Mint on Zora</a>
            </div>

            <div style={{ marginTop: 18, color: "#9fbbe6" }}>
              Live NFTs in gallery: <strong>{nftCount}</strong>
            </div>
          </aside>
        </div>

        <div style={{ marginTop: 28, color: "#94a3b8", fontSize: 13 }}>
          Tip: For best results, pin your final artwork to IPFS via Piñata and then mint using your Zora smart contract URL. Need automation? We can add a server endpoint to pin + mint in one flow.
        </div>
      </div>
    </div>
  );
}

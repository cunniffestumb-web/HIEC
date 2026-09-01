(() => {
  const THREE_CDN = 'vendor/three/three.min.js';

  let scene, camera, renderer, container, resizeObserver;
  let moleculeGroup;
  // reaction sprites and animation
  let reactionSprites = [];
  let animationId = null;

  function ensureContainer() {
    container = document.getElementById('moleculeModel');
    if (!container) {
      console.warn('[chemistry-3d] #moleculeModel not found.');
      return false;
    }
    const style = getComputedStyle(container);
    if (style.position === 'static') {
      container.style.position = 'relative';
    }
    return true;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.THREE) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load: ' + src));
      document.head.appendChild(s);
    });
  }

  function initThreeScene() {
    if (!ensureContainer()) return;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Append canvas to container
    container.appendChild(canvas);
    // Attach pointer interactions (rotate/pan/zoom)
    addInteraction(canvas);

    // Scene & camera
    scene = new THREE.Scene();
    const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 0, 8);

    // expose debug hooks for outer UI
    window.__chem3d = {
        get camera() { return camera; },
        get renderer() { return renderer; },
        get container() { return container; },
        get scene() { return scene; },
        getZ: () => camera ? camera.position.z : undefined
    };

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Molecule group
    moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    window.moleculeGroup = moleculeGroup;

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderThree();
    };

    window.addEventListener('resize', onResize);
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);
    }

    renderThree();
  }

  function clearMolecule() {
    // remove reaction sprites if any
    if (reactionSprites.length) {
      reactionSprites.forEach((spr) => {
        if (spr.parent) spr.parent.remove(spr);
        if (spr.material && spr.material.map) spr.material.map.dispose();
        if (spr.material) spr.material.dispose();
        if (spr.geometry) spr.geometry.dispose();
      });
      reactionSprites = [];
    }

    if (!moleculeGroup) return;
    while (moleculeGroup.children.length) {
      const obj = moleculeGroup.children.pop();
      obj.traverse && obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
      obj.removeFromParent();
    }
  }

  function atom(color, radius, x = 0, y = 0, z = 0) {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    // mark as atom for reaction sprites
    mesh.userData.isAtom = true;
    return mesh;
  }

  // Create a cylinder bond between two points in 3D space
  function createBond(startVec3, endVec3, radius = 0.07, color = 0xaaaaaa) {
    const start = startVec3.clone();
    const end = endVec3.clone();
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    if (len === 0) return new THREE.Group();

    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const geo = new THREE.CylinderGeometry(radius, radius, len, 20);
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);

    // Orient cylinder (Y axis) to the direction vector
    const up = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    mesh.position.copy(mid);
    return mesh;
  }

  // create ring-like sprite texture for reaction effect
  function makeRingTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,255,150,0.95)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }

  function ensureAnimate() {
    if (animationId !== null) return; // already running
    const loop = () => {
      animationId = requestAnimationFrame(loop);
      // animate reaction sprites scaling and fade
      if (reactionSprites.length) {
        const now = performance.now() * 0.001; // seconds
        const period = 4.0; // slower animation
        for (const spr of reactionSprites) {
          const phase = spr.userData.phase || 0;
          const t = (now + phase) % period;
          const k = t / period; // 0..1
          const s = 0.5 + k * 1.8; // scale from 0.5 -> 2.3
          spr.scale.set(s, s, 1);
          if (spr.material && 'opacity' in spr.material) {
            spr.material.opacity = 1.0 - k; // fade out
            spr.material.needsUpdate = true;
          }
          // keep sprite facing camera implicitly (Sprite does this by default)
        }
      }
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    loop();
  }

  function stopAnimateIfIdle() {
    if (!reactionSprites.length && animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function renderMolecule3D(name) {
    if (!window.THREE || !moleculeGroup) return;
    clearMolecule();

    const mol = (name || 'water').toLowerCase();
    if (mol === 'water') {
      // H2O: Oxygen (red) + 2 Hydrogens (white) ~104.5°
      const O = atom(0xff3b3b, 0.5, 0, 0, 0);
      const angle = 104.5 * Math.PI / 180;
      const d = 1.2;
      const x = Math.sin(angle / 2) * d;
      const y = Math.cos(angle / 2) * d;
      const H1 = atom(0xffffff, 0.35, x, y, 0);
      const H2 = atom(0xffffff, 0.35, -x, y, 0);
      moleculeGroup.add(O, H1, H2);
      // Bonds
      moleculeGroup.add(
        createBond(O.position, H1.position),
        createBond(O.position, H2.position)
      );
    } else if (mol === 'methane') {
      // CH4: Carbon center + 4 Hydrogens at tetrahedral positions
      const C = atom(0x444444, 0.55, 0, 0, 0);
      const r = 1.5;
      const t = Math.sqrt(1 / 3);
      const Hs = [
        atom(0xffffff, 0.35, r * t, r * t, r * t),
        atom(0xffffff, 0.35, -r * t, -r * t, r * t),
        atom(0xffffff, 0.35, -r * t, r * t, -r * t),
        atom(0xffffff, 0.35, r * t, -r * t, -r * t),
      ];
      moleculeGroup.add(C, ...Hs);
      // Bonds
      Hs.forEach((H) => moleculeGroup.add(createBond(C.position, H.position)));
    } else if (mol === 'caffeine') {
      // Caffeine: approximate purine-like fused rings (6+5), with 4 ring nitrogens,
      // two carbonyl oxygens, and three N-methyl substituents (visual, not to scale)
      const C_COLOR = 0x444444;
      const N_COLOR = 0x3366ff;
      const O_COLOR = 0xff3b3b;
      const H_COLOR = 0xffffff;

      const ringR = 1.6; // hexagon radius
      const hex = [
        new THREE.Vector3(-ringR, 0, 0),
        new THREE.Vector3(-ringR * 0.5, ringR * 0.866, 0),
        new THREE.Vector3(ringR * 0.5, ringR * 0.866, 0),
        new THREE.Vector3(ringR, 0, 0),
        new THREE.Vector3(ringR * 0.5, -ringR * 0.866, 0),
        new THREE.Vector3(-ringR * 0.5, -ringR * 0.866, 0),
      ];
      // build a fused pentagon sharing the edge between hex[2] and hex[3]
      const pA = new THREE.Vector3(ringR + 1.0, ringR * 0.7, 0);
      const pB = new THREE.Vector3(ringR * 0.7, ringR + 0.9, 0);
      const pC = new THREE.Vector3(ringR * 0.1, ringR + 0.7, 0);

      // ring positions (unique 9 atoms): 0..5 from hex, 6..8 are pentagon new vertices
      const ringPositions = [...hex, pA, pB, pC];

      // Assign ring atom types (approximate caffeine ring pattern)
      // N at indices: 1, 3, 5, 6 (four nitrogens in ring); others Carbon
      const isNitrogen = (idx) => (idx === 1 || idx === 3 || idx === 5 || idx === 6);

      // Helper: center of ring for outward directions
      const center = ringPositions.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).multiplyScalar(1 / ringPositions.length);

      // Place ring atoms
      const ringAtoms = ringPositions.map((pos, i) => {
        const col = isNitrogen(i) ? N_COLOR : C_COLOR;
        const r = isNitrogen(i) ? 0.3 : 0.32;
        const a = atom(col, r, pos.x, pos.y, pos.z);
        moleculeGroup.add(a);
        return a;
      });

      // Bonds: hexagon
      for (let i = 0; i < 6; i++) {
        const a = ringPositions[i];
        const b = ringPositions[(i + 1) % 6];
        moleculeGroup.add(createBond(a, b, 0.06));
      }
      // Bonds: pentagon fused on hex[2]-hex[3]
      const pent = [2, 3, 6, 7, 8];
      for (let i = 0; i < pent.length; i++) {
        const a = ringPositions[pent[i]];
        const b = ringPositions[pent[(i + 1) % pent.length]];
        moleculeGroup.add(createBond(a, b, 0.06));
      }

      // Carbonyl oxygens (2): attach to two carbon ring atoms roughly outward
      const carbonylTargets = [0, 4]; // choose two carbons on opposite sides
      carbonylTargets.forEach((idx) => {
        const base = ringPositions[idx];
        const dir = base.clone().sub(center).normalize();
        const Opos = base.clone().add(dir.clone().multiplyScalar(0.95));
        const Oatom = atom(O_COLOR, 0.3, Opos.x, Opos.y, Opos.z);
        moleculeGroup.add(Oatom);
        // mimic double bond with slight z offsets
        const off = new THREE.Vector3(0, 0, 0.05);
        moleculeGroup.add(createBond(base.clone().add(off), Opos.clone().add(off), 0.045));
        moleculeGroup.add(createBond(base.clone().sub(off), Opos.clone().sub(off), 0.045));
      });

      // Three N-methyl groups at N positions: indices 1, 3, 6
      const methylOn = [1, 3, 6];
      methylOn.forEach((idx) => {
        const base = ringPositions[idx];
        const dir = base.clone().sub(center).normalize();
        const Cpos = base.clone().add(dir.clone().multiplyScalar(1.15));
        const Catom = atom(C_COLOR, 0.36, Cpos.x, Cpos.y, Cpos.z);
        moleculeGroup.add(Catom);
        moleculeGroup.add(createBond(base, Cpos, 0.06));
        // Place three H atoms at exact tetrahedral geometry around the methyl carbon.
        // Let w be the unit vector along the C->base bond (for CH bonds to make 109.47° with it).
        const w = dir.clone().negate().normalize(); // C->base direction
        // Build orthonormal frame (u, v) perpendicular to w
        const ref = Math.abs(w.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const u = new THREE.Vector3().crossVectors(w, ref).normalize();
        const v = new THREE.Vector3().crossVectors(w, u).normalize();
        // For a perfect tetrahedron: for the three CH bonds, dot(x, w) = cos(109.471...) = -1/3
        // So x = alpha*w + beta*(cosφ*u + sinφ*v), with alpha = -1/3, beta = 2*sqrt(2)/3, φ = 0, 120°, 240°
        const hDist = 0.6;            // approximate C–H bond length in our scene units
        const alpha = -1/3;
        const beta = Math.sqrt(8/9);
        const phis = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
        phis.forEach((phi) => {
          const dirCH = u.clone().multiplyScalar(Math.cos(phi) * beta)
            .add(v.clone().multiplyScalar(Math.sin(phi) * beta))
            .add(w.clone().multiplyScalar(alpha))
            .normalize();
          const hp = Cpos.clone().add(dirCH.multiplyScalar(hDist));
          const Hat = atom(H_COLOR, 0.28, hp.x, hp.y, hp.z);
          moleculeGroup.add(Hat);
          moleculeGroup.add(createBond(Cpos, hp, 0.05));
        });
      });

    } else {
      // Unknown => default to water
      return renderMolecule3D('water');
    }

    moleculeGroup.rotation.set(0, 0, 0);
    renderThree();
  }

  function renderThree() {
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function disposeThree() {
    try {
      if (resizeObserver && container) {
        resizeObserver.unobserve(container);
      }
    } catch (_) { }
    resizeObserver = null;

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }

    if (scene) {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    scene = null;
    camera = null;
    moleculeGroup = null;
    reactionSprites = [];
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    delete window.moleculeGroup;
    // clear global exposure
    try {
        delete window.__chem3d;
        delete window.__chem3dZ;
    } catch (e) {}
  }

  // Add/Remove reaction effect: sprites on each atom, facing camera
  function toggleReaction3D() {
    if (!moleculeGroup || !window.THREE) return;
    if (reactionSprites.length) {
      // remove all
      reactionSprites.forEach((spr) => {
        if (spr.parent) spr.parent.remove(spr);
        if (spr.material && spr.material.map) spr.material.map.dispose();
        if (spr.material) spr.material.dispose();
        if (spr.geometry) spr.geometry.dispose();
      });
      reactionSprites = [];
      stopAnimateIfIdle();
      renderThree();
      return;
    }
    // add sprites to each atom
    const tex = makeRingTexture();
    const atoms = [];
    moleculeGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isAtom) atoms.push(obj);
    });
    atoms.forEach((a, idx) => {
      const mat = new THREE.SpriteMaterial({ map: tex, color: 0x00ff96, transparent: true, opacity: 0.9, depthWrite: false });
      const spr = new THREE.Sprite(mat);
      spr.scale.set(1.0, 1.0, 1.0);
      spr.userData.phase = (idx % 5) * 0.3; // staggered phases
      a.add(spr);
      reactionSprites.push(spr);
    });
    ensureAnimate();
  }

  function adjustZoom3D(deltaY) {
    if (!camera) return;
    // Wheel deltaY > 0 => zoom out
    const factor = Math.exp(deltaY * 0.001);
    const z = THREE.MathUtils.clamp(camera.position.z * factor, 2.0, 15.0);
    camera.position.z = z;
    renderThree();
  }

  // Pointer interactions: rotate vs pan
  function addInteraction(canvas) {
    if (!canvas) return;

    let isDragging = false;
    let mode = 'rotate'; // or 'pan'
    let lastX = 0, lastY = 0;

    const ROT_SPEED = 0.005; // radians per pixel

    function getWorldPerPixel() {
      if (!camera || !container) return 0.01;
      const distance = Math.abs(camera.position.z);
      const fovRad = (camera.fov || 45) * Math.PI / 180;
      const h = Math.max(container.clientHeight, 1);
      return (2 * Math.tan(fovRad / 2) * distance) / h; // world units per pixel at the origin plane
    }

    function onPointerDown(e) {
      if (!moleculeGroup) return;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      isDragging = true;
      lastX = e.clientX; lastY = e.clientY;
      // Shift / Ctrl / Meta 或中键/右键 => 平移；否则旋转
      if (e.button === 1 || e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey) {
        mode = 'pan';
      } else {
        mode = 'rotate';
      }
      if (container) container.classList.add('dragging');
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging || !moleculeGroup) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;

      if (mode === 'rotate') {
        moleculeGroup.rotation.y += dx * ROT_SPEED;
        // 允许上下方向不受角度限制（移除俯仰角限制）
        moleculeGroup.rotation.x += dy * ROT_SPEED;
      } else {
        // 平移：在相机平面内（X/Y）移动分子整体
        const scale = getWorldPerPixel();
        moleculeGroup.position.x += -dx * scale; // 鼠标右移 => 物体向左移
        moleculeGroup.position.y += dy * scale;   // 鼠标下移 => 物体向下移（屏幕坐标Y向下）
      }

      if (typeof window.updateRotationIndicator === 'function') {
        try { window.updateRotationIndicator(); } catch (_) {}
      }
      renderThree();
    }

    function onPointerUp(e) {
      isDragging = false;
      try { canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      if (container) container.classList.remove('dragging');
    }

    function onContextMenu(e) {
      // 右键用于平移，不弹出菜单
      e.preventDefault();
    }

    function onWheel(e) {
      if (!camera) return;
      e.preventDefault();
      adjustZoom3D(e.deltaY);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // 键盘 WASD 平移：左键旋转不变，按 W/A/S/D 在屏幕坐标系内平移分子
    const downKeys = new Set();
    let keyAnimId = 0;
    let lastTS = 0;

    function getViewHeightWorld() {
      if (!camera || !container) return 1;
      const distance = Math.abs(camera.position.z);
      const fovRad = (camera.fov || 45) * Math.PI / 180;
      // 屏幕垂直方向对应的世界单位高度
      return 2 * Math.tan(fovRad / 2) * distance;
    }

    function stepKeyboard(ts) {
      if (!moleculeGroup) { keyAnimId = 0; return; }
      if (!lastTS) lastTS = ts;
      const dt = Math.max(0.001, Math.min(0.05, (ts - lastTS) / 1000)); // 1ms~50ms
      lastTS = ts;

      // 速度基于视锥高度，保证不同缩放下手感一致
      const viewH = getViewHeightWorld();
      const speed = viewH * 0.6; // 每秒移动 0.6 个屏幕高度

      let moveX = 0, moveY = 0;
      if (downKeys.has('a')) moveX -= 1;
      if (downKeys.has('d')) moveX += 1;
      if (downKeys.has('w')) moveY += 1; // 向上
      if (downKeys.has('s')) moveY -= 1; // 向下

      if (moveX !== 0 || moveY !== 0) {
        // 归一化对角线速度
        const len = Math.hypot(moveX, moveY) || 1;
        moveX /= len; moveY /= len;
        moleculeGroup.position.x -= moveX * speed * dt;
        moleculeGroup.position.y -= moveY * speed * dt;
        renderThree();
      }

      if (downKeys.size > 0) {
        keyAnimId = requestAnimationFrame(stepKeyboard);
      } else {
        keyAnimId = 0;
      }
    }

    function startKeyAnim() {
      if (!keyAnimId) {
        lastTS = 0;
        keyAnimId = requestAnimationFrame(stepKeyboard);
      }
    }

    function handleKey(e, isDown) {
      const k = (e.key || '').toLowerCase();
      if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
        if (isDown) downKeys.add(k); else downKeys.delete(k);
        e.preventDefault();
        if (downKeys.size > 0) startKeyAnim();
      }
    }

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
  }

  function resetView3D() {
    if (moleculeGroup) {
      moleculeGroup.rotation.set(0, 0, 0);
      moleculeGroup.position.set(0, 0, 0);
    }
    if (camera) camera.position.set(0, 0, 6);
    renderThree();
  }

  async function loadThreeAndInit(defaultMolecule) {
    try {
      // 显示加载遮罩（若存在），避免用户看到未渲染状态
      const loadingEl = document.getElementById('chemLoading');
      if (loadingEl) loadingEl.style.display = '';

      if (!window.THREE) {
        await loadScript(THREE_CDN);
      }
      initThreeScene();
      renderMolecule3D(defaultMolecule || 'water');
      // 3D就绪后隐藏所有2D分子结构
      document.querySelectorAll('.molecule-structure').forEach((el) => {
        el.style.display = 'none';
      });
      renderThree();
      // 同步刷新右下角旋转指示器
      if (typeof window.updateRotationIndicator === 'function') {
        window.updateRotationIndicator();
      }
    } catch (e) {
      console.warn('[chemistry-3d] Initialization failed, fallback to 2D.', e);
      // 回退：显示默认 2D 水分子
      try {
        document.querySelectorAll('.molecule-structure').forEach((el) => {
          el.style.display = el.getAttribute('data-molecule') === 'water' ? 'block' : 'none';
        });
        // 同步一次指示器，确保右下角UI渲染
        if (typeof window.updateRotationIndicator === 'function') {
          window.updateRotationIndicator();
        }
      } catch(_) {}
    } finally {
      // 无论成功或失败，都隐藏加载遮罩，失败时将回退到2D
      const loadingEl2 = document.getElementById('chemLoading');
      if (loadingEl2) {
        loadingEl2.style.display = 'none';
        loadingEl2.setAttribute('aria-busy', 'false');
      }
    }
  }

  // Expose globals for existing code integration
  window.loadThreeAndInit = loadThreeAndInit;
  window.initThreeScene = initThreeScene;
  window.renderMolecule3D = renderMolecule3D;
  window.renderThree = renderThree;
  window.disposeThree = disposeThree;
  window.toggleReaction3D = toggleReaction3D;
  window.adjustZoom3D = adjustZoom3D;
  window.resetView3D = resetView3D;
})();

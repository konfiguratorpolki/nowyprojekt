// ============================================================
//  SHELF3D.JS — wspólna biblioteka budowania modeli 3D półek
//  Używana przez: index.html i editor.html
//  Wymaga: Three.js (r128), gsap
//  Nie dotykaj logiki UI — to czyste funkcje geometrii
// ============================================================

// ─── MATERIAŁ BAZOWY (fallback gdy brak fabryki) ────────────
const SHELF3D_MATERIAL = { color: 0x8B7355, metalness: 0, roughness: 0.82 };

// ─── GRUBOŚĆ PŁYTY w jednostkach Three.js (1 jednostka = 10 cm) ───
const SHELF3D_THICKNESS = 0.18;

// ─── FABRYKA MATERIAŁÓW ─────────────────────────────────────
//  Ustawiana z zewnątrz przez shelf3d_setFactory()
//  Sygnatura: SHELF3D_MAT_FACTORY(type, w, h, d) → THREE.Material
let SHELF3D_MAT_FACTORY = null;

function shelf3d_setFactory(factory) {
    SHELF3D_MAT_FACTORY = factory;
}

// Tworzy materiał dla deski i zapisuje metadane do userData
// Zwraca gotowy materiał (z fabryki lub domyślny szary)
function _mkBoard(mesh, type, w, h, d) {
    mesh.userData.shelfMatInfo = { type, w, h, d };
    return SHELF3D_MAT_FACTORY
        ? SHELF3D_MAT_FACTORY(type, w, h, d)
        : new THREE.MeshStandardMaterial(SHELF3D_MATERIAL);
}

// ============================================================
//  buildShelfModel(config) → THREE.Group
// ============================================================
function buildShelfModel(config) {
    const group = new THREE.Group();
    const {
        width: widthNum, height: heightVal, depth: depthVal,
        shelfCount: shelfCountVal, shelfType,
        noTopShelf, noBottomShelf,
        addDividersTop, addDividersMiddle, addDividersBottom
    } = config;

    if (!widthNum || !heightVal || !depthVal || shelfCountVal === undefined) return group;

    const thickness  = SHELF3D_THICKNESS;
    const width      = widthNum / 10;
    const height     = parseFloat(heightVal) / 10;
    const depth      = parseFloat(depthVal) / 10;
    const shelfCount = parseInt(shelfCountVal);
    const shelfW     = width - 2 * thickness;   // szerokość deski poziomej

    if (isNaN(width) || isNaN(height) || isNaN(depth) || width <= 0 || height <= 0 || depth <= 0) return group;

    // ─── Dolna półka ───
    let topPanel, bottomPanel;
    if (!noBottomShelf) {
        const geo = new THREE.BoxGeometry(shelfW, thickness, depth);
        bottomPanel = new THREE.Mesh(geo);
        bottomPanel.material = _mkBoard(bottomPanel, 'shelf', shelfW, thickness, depth);
        bottomPanel.position.set(0, -height / 2 + thickness / 2, 0);
        bottomPanel.name = 'bottomPanel';
        group.add(bottomPanel);
    }

    // ─── Górna półka ───
    if (!noTopShelf) {
        const geo = new THREE.BoxGeometry(shelfW, thickness, depth);
        topPanel = new THREE.Mesh(geo);
        topPanel.material = _mkBoard(topPanel, 'shelf', shelfW, thickness, depth);
        topPanel.position.set(0, height / 2 - thickness / 2, 0);
        topPanel.name = 'topPanel';
        group.add(topPanel);
    }

    // ─── Boki ───
    const sideGeo  = new THREE.BoxGeometry(thickness, height, depth);

    const leftSide = new THREE.Mesh(sideGeo);
    leftSide.material = _mkBoard(leftSide, 'side', thickness, height, depth);
    leftSide.position.set(-width / 2 + thickness / 2, 0, 0);
    leftSide.name = 'leftSide';
    group.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo.clone());
    rightSide.material = _mkBoard(rightSide, 'side', thickness, height, depth);
    rightSide.position.set(width / 2 - thickness / 2, 0, 0);
    rightSide.name = 'rightSide';
    group.add(rightSide);

    // ─── Półki wewnętrzne ───
    const internalShelves = [];

    if (!isNaN(shelfCount) && shelfCount > 0) {
        if (shelfType === 'mug_shelf' && heightVal === '60' && topPanel) {
            const fixedGap = 1.09;
            const topPanelBottomY = topPanel.position.y - thickness / 2;
            let lastShelfY = topPanelBottomY;
            for (let i = 0; i < 3; i++) {
                const shelfY = lastShelfY - fixedGap - thickness / 2;
                const geo = new THREE.BoxGeometry(shelfW, thickness, depth);
                const mesh = new THREE.Mesh(geo);
                mesh.material = _mkBoard(mesh, 'shelf', shelfW, thickness, depth);
                mesh.position.set(0, shelfY, 0);
                mesh.name = `internalShelf_${i}`;
                group.add(mesh);
                internalShelves.push(mesh);
                lastShelfY = shelfY - thickness / 2;
            }
        } else {
            const topThickness    = topPanel    ? thickness : 0;
            const bottomThickness = bottomPanel ? thickness : 0;
            const totalAvailable  = height - topThickness - bottomThickness;

            if (totalAvailable >= shelfCount * thickness) {
                const useCustom = config.customPositions && config.customPositions.length === shelfCount;

                if (useCustom) {
                    const bottomY = -height / 2 + thickness;
                    for (let i = 0; i < shelfCount; i++) {
                        const shelfY = bottomY + config.customPositions[i] / 10;
                        const geo = new THREE.BoxGeometry(shelfW, thickness, depth);
                        const mesh = new THREE.Mesh(geo);
                        mesh.material = _mkBoard(mesh, 'shelf', shelfW, thickness, depth);
                        mesh.position.set(0, shelfY, 0);
                        mesh.name = `internalShelf_${i}`;
                        group.add(mesh);
                        internalShelves.push(mesh);
                    }
                } else {
                    const gap    = (height - 2 * thickness - shelfCount * thickness) / (shelfCount + 1);
                    const startY = -height / 2 + thickness;
                    for (let i = 1; i <= shelfCount; i++) {
                        const shelfY = startY + i * gap + (i - 0.5) * thickness;
                        const geo = new THREE.BoxGeometry(shelfW, thickness, depth);
                        const mesh = new THREE.Mesh(geo);
                        mesh.material = _mkBoard(mesh, 'shelf', shelfW, thickness, depth);
                        mesh.position.set(0, shelfY, 0);
                        mesh.name = `internalShelf_${i - 1}`;
                        group.add(mesh);
                        internalShelves.push(mesh);
                    }
                }
            }
        }
    }

    // ─── Przegródki kubkowe ───
    if (shelfType === 'mug_shelf' && topPanel && bottomPanel && internalShelves.length > 0) {
        if (addDividersTop || addDividersMiddle || addDividersBottom) {
            const innerWidth = width - 2 * thickness;
            let levels = [];
            internalShelves.sort((a, b) => a.position.y - b.position.y);

            if (heightVal === '60' && internalShelves.length === 3) {
                levels = [
                    { top: topPanel.position.y - thickness / 2,            bottom: internalShelves[2].position.y + thickness / 2 },
                    { top: internalShelves[2].position.y - thickness / 2,  bottom: internalShelves[1].position.y + thickness / 2 },
                    { top: internalShelves[1].position.y - thickness / 2,  bottom: internalShelves[0].position.y + thickness / 2 },
                    { top: internalShelves[0].position.y - thickness / 2,  bottom: bottomPanel.position.y + thickness / 2 }
                ];
            } else if (heightVal === '40' && internalShelves.length === 2) {
                levels = [
                    { top: topPanel.position.y - thickness / 2,            bottom: internalShelves[1].position.y + thickness / 2 },
                    { top: internalShelves[1].position.y - thickness / 2,  bottom: internalShelves[0].position.y + thickness / 2 },
                    { top: internalShelves[0].position.y - thickness / 2,  bottom: bottomPanel.position.y + thickness / 2 }
                ];
            }

            const drawDividersForLevel = (levelData) => {
                const levelH = Math.max(0.01, levelData.top - levelData.bottom);
                if (levelH <= 0.01) return;
                const yCenter = levelData.bottom + levelH / 2;
                const divGeo  = new THREE.BoxGeometry(thickness, levelH, depth);

                if (widthNum == 84) {
                    const n = 3;
                    const spacing = innerWidth / (n + 1);
                    for (let i = 1; i <= n; i++) {
                        const mesh = new THREE.Mesh(divGeo.clone());
                        mesh.material = _mkBoard(mesh, 'side', thickness, levelH, depth);
                        mesh.position.set(-innerWidth / 2 + i * spacing, yCenter, 0);
                        mesh.name = `divider_h84_${i}`;
                        group.add(mesh);
                    }
                } else {
                    const n = widthNum == 60 ? 3 : widthNum == 44 ? 2 : 0;
                    if (n > 0) {
                        const spacing = innerWidth / (n + 1);
                        for (let i = 1; i <= n; i++) {
                            const mesh = new THREE.Mesh(divGeo.clone());
                            mesh.material = _mkBoard(mesh, 'side', thickness, levelH, depth);
                            mesh.position.set(-innerWidth / 2 + i * spacing, yCenter, 0);
                            mesh.name = `divider_${i}`;
                            group.add(mesh);
                        }
                    }
                }
            };

            if (addDividersTop    && levels[0]) drawDividersForLevel(levels[0]);
            if (addDividersMiddle && levels[1]) drawDividersForLevel(levels[1]);
            if (addDividersBottom && levels[2]) drawDividersForLevel(levels[2]);
        }
    }

    return group;
}

// ============================================================
//  createSingleModule(config, material) → THREE.Group
// ============================================================
function createSingleModule(config, material) {
    const { width, height, depth, shelfCount, thickness, noTopShelf, noBottomShelf } = config;
    const moduleGroup = new THREE.Group();
    const shelfW = width - 2 * thickness;
    let topPanel, bottomPanel;

    const mk = (mesh, type, w, h, d) => {
        mesh.material = _mkBoard(mesh, type, w, h, d);
        return mesh;
    };

    if (!noBottomShelf) {
        const geo = new THREE.BoxGeometry(shelfW, thickness, depth);
        bottomPanel = mk(new THREE.Mesh(geo), 'shelf', shelfW, thickness, depth);
        bottomPanel.position.y = -height / 2 + thickness / 2;
        bottomPanel.name = 'bottomPanel';
        moduleGroup.add(bottomPanel);
    }
    if (!noTopShelf) {
        const geo = new THREE.BoxGeometry(shelfW, thickness, depth);
        topPanel = mk(new THREE.Mesh(geo), 'shelf', shelfW, thickness, depth);
        topPanel.position.y = height / 2 - thickness / 2;
        topPanel.name = 'topPanel';
        moduleGroup.add(topPanel);
    }

    const sideGeo = new THREE.BoxGeometry(thickness, height, depth);
    const leftSide = mk(new THREE.Mesh(sideGeo), 'side', thickness, height, depth);
    leftSide.position.x = -width / 2 + thickness / 2;
    leftSide.name = 'leftSide';
    moduleGroup.add(leftSide);

    const rightSide = mk(new THREE.Mesh(sideGeo.clone()), 'side', thickness, height, depth);
    rightSide.position.x = width / 2 - thickness / 2;
    rightSide.name = 'rightSide';
    moduleGroup.add(rightSide);

    const topThickness    = !noTopShelf    ? thickness : 0;
    const bottomThickness = !noBottomShelf ? thickness : 0;
    const availableHeight = height - topThickness - bottomThickness;
    const startY = !noBottomShelf ? (-height / 2 + bottomThickness) : (-height / 2);

    if (shelfCount > 0) {
        const gap = (availableHeight - shelfCount * thickness) / (shelfCount + 1);
        const innerGeo = new THREE.BoxGeometry(shelfW, thickness, depth);
        for (let i = 0; i < shelfCount; i++) {
            const shelf = mk(new THREE.Mesh(innerGeo.clone()), 'shelf', shelfW, thickness, depth);
            shelf.position.y = startY + (i + 1) * gap + (i + 0.5) * thickness;
            shelf.name = `internalShelf_${i}`;
            moduleGroup.add(shelf);
        }
    }
    return moduleGroup;
}

// ============================================================
//  buildModularShelf(config) → THREE.Group
// ============================================================
function buildModularShelf(config) {
    const mainGroup = new THREE.Group();
    if (!config.moduleWidth || !config.moduleHeight || !config.connectingShelfWidth || !config.depth) return mainGroup;

    const mat       = new THREE.MeshStandardMaterial(SHELF3D_MATERIAL);
    const thickness = SHELF3D_THICKNESS;
    const moduleH   = parseInt(config.moduleHeight);
    const shelfNum  = moduleH === 40 ? 2 : moduleH === 80 ? 5 : 3;

    const moduleConfig = {
        width:         config.moduleWidth / 10,
        height:        config.moduleHeight / 10,
        depth:         config.depth / 10,
        shelfCount:    shelfNum,
        thickness,
        noTopShelf:    config.modularNoTopShelf,
        noBottomShelf: config.modularNoBottomShelf
    };
    const connectW = config.connectingShelfWidth / 10;

    const leftModule  = createSingleModule(moduleConfig, mat);
    leftModule.name   = 'leftModule';
    leftModule.position.x = -(connectW / 2 + moduleConfig.width / 2);

    const rightModule = createSingleModule(moduleConfig, mat);
    rightModule.name  = 'rightModule';
    rightModule.position.x = connectW / 2 + moduleConfig.width / 2;

    mainGroup.add(leftModule, rightModule);

    const connectGeo = new THREE.BoxGeometry(connectW, thickness, moduleConfig.depth);
    const yPositions = [];
    const leftTop    = leftModule.getObjectByName('topPanel');
    const leftBottom = leftModule.getObjectByName('bottomPanel');

    if (leftTop)    yPositions.push(leftTop.position.y);
    Array.from(leftModule.children)
        .filter(c => c.name.startsWith('internalShelf_'))
        .sort((a, b) => b.position.y - a.position.y)
        .forEach(s => yPositions.push(s.position.y));
    if (leftBottom) yPositions.push(leftBottom.position.y);

    for (let i = 0; i < yPositions.length - 1; i++) {
        const shelf = new THREE.Mesh(connectGeo.clone());
        shelf.material = _mkBoard(shelf, 'shelf', connectW, thickness, moduleConfig.depth);
        shelf.position.y = (yPositions[i] + yPositions[i + 1]) / 2;
        shelf.name = i === 0 && leftTop
            ? 'connecting_shelf_top'
            : i === yPositions.length - 2 && leftBottom
                ? 'connecting_shelf_bottom'
                : `connecting_shelf_${i}`;
        mainGroup.add(shelf);
    }

    return mainGroup;
}

// ============================================================
//  shelf3d_clearScene(scene, shelfGroupRef) → null
// ============================================================
function shelf3d_clearScene(scene, shelfGroup) {
    if (shelfGroup) {
        shelfGroup.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else if (child.material) {
                    child.material.dispose();
                }
            }
        });
        scene.remove(shelfGroup);
    }
    return null;
}

// ============================================================
//  shelf3d_rebuildAndAnimate(config, ctx) → Promise
// ============================================================
function shelf3d_rebuildAndAnimate(config, ctx) {
    const { scene, camera, controls } = ctx;

    if (camera && controls) {
        const isMobile = window.innerWidth < 768;
        const h = parseInt(config.height || config.moduleHeight) || 60;
        const cz = isMobile ? (h >= 80 ? 11 : 9) : (h >= 80 ? 10 : 7);
        gsap.to(camera.position, { x: -4, y: 0.5, z: cz, duration: 0.4, ease: 'power1.inOut', onUpdate: () => controls.update() });
        controls.target.set(0, 0, 0);
    }

    return new Promise(resolve => {
        if (ctx.currentAnimationTimeline) ctx.currentAnimationTimeline.kill();

        const shelfType = config.shelfType;
        const tl = gsap.timeline({
            onComplete: () => {
                controls.enabled = true;
                if (ctx.shelfGroup) ctx.shelfGroup.rotation.set(0, 0, 0);
                if (typeof ctx.onComplete === 'function') ctx.onComplete();
                resolve();
            }
        });
        ctx.currentAnimationTimeline = tl;
        controls.enabled = false;

        // ─── Animacja wyjścia starego modelu ───
        if (ctx.shelfGroup && ctx.shelfGroup.children.length > 0) {
            if (shelfType === 'mug_shelf') {
                tl.to(ctx.shelfGroup.children.map(p => p.position), {
                    x: () => `random(-10, 10, 2)`,
                    y: () => `random(-10, 10, 2)`,
                    z: () => `random(-10, 10, 2)`,
                    duration: 0.6, ease: 'power2.inOut', stagger: 0.02
                }, 0);
            } else {
                tl.to(ctx.shelfGroup.children.map(p => p.position), {
                    y: '-=10', duration: 0.5, ease: 'power2.inOut', stagger: 0.02
                }, 0);
                const mats = [];
                ctx.shelfGroup.traverse(c => {
                    if (c.isMesh) {
                        const arr = Array.isArray(c.material) ? c.material : (c.material ? [c.material] : []);
                        arr.forEach(m => { m.transparent = true; mats.push(m); });
                    }
                });
                if (mats.length > 0) tl.to(mats, { opacity: 0, duration: 0.4 }, '-=0.3');
            }
            tl.add(() => { ctx.shelfGroup = shelf3d_clearScene(scene, ctx.shelfGroup); });
        }

        // ─── Budowa i animacja wejścia nowego modelu ───
        if (shelfType === 'modular') {
            tl.add(() => {
                ctx.shelfGroup = buildModularShelf(config);
                if (!ctx.shelfGroup || ctx.shelfGroup.children.length === 0) { tl.progress(1); return; }

                const box    = new THREE.Box3().setFromObject(ctx.shelfGroup);
                const center = box.getCenter(new THREE.Vector3());
                ctx.shelfGroup.children.forEach(c => c.position.sub(center));

                const finalPos = new Map();
                ctx.shelfGroup.traverse(c => { if (c.isMesh) finalPos.set(c, c.position.clone()); });

                const lm  = ctx.shelfGroup.getObjectByName('leftModule');
                const rm  = ctx.shelfGroup.getObjectByName('rightModule');
                const cs  = ctx.shelfGroup.children.filter(c => c.name.startsWith('connecting_shelf_')).sort((a, b) => b.position.y - a.position.y);

                const lm_l = lm.getObjectByName('leftSide');
                const lm_r = lm.getObjectByName('rightSide');
                const lm_t = lm.getObjectByName('topPanel');
                const lm_b = lm.getObjectByName('bottomPanel');
                const lm_s = lm.children.filter(c => c.name.startsWith('internalShelf_')).sort((a, b) => b.position.y - a.position.y);

                const rm_l = rm.getObjectByName('leftSide');
                const rm_r = rm.getObjectByName('rightSide');
                const rm_t = rm.getObjectByName('topPanel');
                const rm_b = rm.getObjectByName('bottomPanel');
                const rm_s = rm.children.filter(c => c.name.startsWith('internalShelf_')).sort((a, b) => b.position.y - a.position.y);

                ctx.shelfGroup.traverse(c => { if (c.isMesh) gsap.set(c.position, { y: c.position.y + 25 }); });
                if (lm_b) gsap.set(lm_b.position, { x: lm_b.position.x - 15 });
                if (rm_b) gsap.set(rm_b.position, { x: rm_b.position.x + 15 });

                const box2  = new THREE.Box3().setFromObject(ctx.shelfGroup);
                const size  = box2.getSize(new THREE.Vector3());
                const scale = Math.min(Math.max((14 / Math.max(size.x, size.y, size.z)) * 1.9, 0.5), 3.0);
                ctx.shelfGroup.scale.set(scale, scale, scale);
                scene.add(ctx.shelfGroup);

                const at = '>+0.1';
                if (lm_l && rm_r) tl.to([lm_l.position, rm_r.position], { y: (i) => finalPos.get(i === 0 ? lm_l : rm_r).y, duration: 0.5, ease: 'power2.out' }, at);
                if (lm_b && rm_b) tl.to([lm_b.position, rm_b.position], { x: (i) => finalPos.get(i === 0 ? lm_b : rm_b).x, y: finalPos.get(lm_b).y, duration: 0.4, ease: 'power2.out' }, `${at}+=0.1`);
                if (lm_r && rm_l) tl.to([lm_r.position, rm_l.position], { y: (i) => finalPos.get(i === 0 ? lm_r : rm_l).y, duration: 0.5, ease: 'power2.out' }, `${at}+=0.2`);
                const allS = [...lm_s, ...rm_s];
                if (allS.length)  tl.to(allS.map(s => s.position),  { y: (i) => finalPos.get(allS[i]).y, duration: 0.4, ease: 'power1.out', stagger: 0.03 }, `${at}+=0.3`);
                if (cs.length)    tl.to(cs.map(s => s.position),    { y: (i) => finalPos.get(cs[i]).y,   duration: 0.4, ease: 'power1.out', stagger: 0.04 }, `${at}+=0.5`);
                if (lm_t && rm_t) tl.to([lm_t.position, rm_t.position], { y: (i) => finalPos.get(i === 0 ? lm_t : rm_t).y, duration: 0.5, ease: 'power2.out' }, `${at}+=0.7`);
            });

        } else if (shelfType === 'mug_shelf') {
            tl.add(() => {
                ctx.shelfGroup = buildShelfModel(config);
                if (!ctx.shelfGroup || ctx.shelfGroup.children.length === 0) { tl.progress(1); return; }
                const box     = new THREE.Box3().setFromObject(ctx.shelfGroup);
                const centerY = box.getCenter(new THREE.Vector3()).y;
                ctx.shelfGroup.children.forEach(c => { c.position.y -= centerY; });
                ctx.shelfGroup.position.set(0, 0, 0);
                ctx.shelfGroup.scale.set(1.1, 1.1, 1.1);
                scene.add(ctx.shelfGroup);

                tl.fromTo(ctx.shelfGroup.children.map(p => p.position),
                    { y: (i, el) => el.y + 6 },
                    { y: (i, el) => el.y, duration: 0.5, ease: 'power2.out', stagger: 0.03 },
                    '>');
            });

        } else {
            tl.add(() => {
                ctx.shelfGroup = buildShelfModel(config);
                if (!ctx.shelfGroup || ctx.shelfGroup.children.length === 0) { tl.progress(1); return; }

                const box    = new THREE.Box3().setFromObject(ctx.shelfGroup);
                const center = box.getCenter(new THREE.Vector3());
                ctx.shelfGroup.children.forEach(c => c.position.sub(center));

                const finalPos = new Map();
                ctx.shelfGroup.children.forEach(c => finalPos.set(c.name, c.position.clone()));

                const leftSide    = ctx.shelfGroup.getObjectByName('leftSide');
                const rightSide   = ctx.shelfGroup.getObjectByName('rightSide');
                const topPanel    = ctx.shelfGroup.getObjectByName('topPanel');
                const bottomPanel = ctx.shelfGroup.getObjectByName('bottomPanel');
                const shelves     = ctx.shelfGroup.children.filter(c => c.name.startsWith('internalShelf_')).sort((a, b) => finalPos.get(a.name).y - finalPos.get(b.name).y);
                const dividers    = ctx.shelfGroup.children.filter(c => c.name.startsWith('divider_'));

                ctx.shelfGroup.children.forEach((c, i) => {
                    const fp = finalPos.get(c.name);
                    gsap.set(c.position, { x: fp.x, z: fp.z, y: 15 + i * 0.05 });
                });
                ctx.shelfGroup.position.y = 0;
                ctx.shelfGroup.scale.set(1.1, 1.1, 1.1);
                scene.add(ctx.shelfGroup);

                const at = '>+0.1';
                if (bottomPanel) tl.to(bottomPanel.position, { y: finalPos.get('bottomPanel').y, duration: 0.5, ease: 'power2.out' }, at);
                if (leftSide && rightSide) tl.to([leftSide.position, rightSide.position], { y: finalPos.get('leftSide').y, duration: 0.5, ease: 'power2.out' }, `${at}+=0.05`);
                if (shelves.length)  tl.to(shelves.map(s => s.position),  { y: (i) => finalPos.get(shelves[i].name).y,  duration: 0.35, ease: 'power2.out', stagger: 0.03 }, `${at}+=0.1`);
                if (dividers.length) tl.to(dividers.map(d => d.position), { y: (i) => finalPos.get(dividers[i].name).y, duration: 0.35, ease: 'power2.out', stagger: 0.01 }, `${at}+=0.15`);
                if (topPanel) tl.to(topPanel.position, { y: finalPos.get('topPanel').y, duration: 0.5, ease: 'power2.out' }, `${at}+=0.2`);
            });
        }
    });
}

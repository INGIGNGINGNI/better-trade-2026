import * as THREE from '../vendor/three/three.module.min.js';
import { reference, fromReference } from './floor-plan-reference.js?v=1';

/* Reconstructed from floor-plan.webp; construction details checked against the
   high-resolution Asset-element/floor-plan.png. The partition's front foot is
   (0,0,0). X runs along the stage, Z towards the pavilions. Inferred dimensions.
   Repeated furniture and trusses are instanced to keep rendering inexpensive. */
export async function createFloorPlanModel() {
    const model = new THREE.Group();
    const batches = new Map(), materials = new Map(), geometries = new Map();
    const cube = new THREE.BoxGeometry(1, 1, 1);
    const tubeGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
    const up = new THREE.Vector3(0, 1, 0);
    const C = {
        carpet: '#898782', stage: '#18191a', seat: '#55585b', metal: '#87898b',
        wall: '#918d7b', seam: '#9b9685', white: '#f3f2ec', counter: '#e5e5e0',
        blue: '#367dab', navy: '#224a68', stripe: '#164b73', cyan: '#39d8e5',
        gold: '#ffa725', pink: '#a24d8a', yellow: '#c5ad00', coral: '#ff642e',
    };
    const loader = new THREE.TextureLoader();
    const textures = new Map(await Promise.all(
        ['ship', 'better-trade-logo-black', 'sky-poster', 'card', 'stock', 'gold', 'bitcoin'].map(async name => {
            try {
                const texture = await loader.loadAsync(new URL(`../images/${name}.webp`, import.meta.url).href);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = 4;
                return [name, texture];
            } catch {
                return [name, null]; // Decorative asset failure must not disable the plan.
            }
        }),
    ));

    function material(color) {
        if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.87 }));
        return materials.get(color);
    }
    function instance(geometry, surface, xyz, size, quaternion = new THREE.Quaternion()) {
        const key = `${geometry.uuid}:${surface.uuid}`;
        if (!batches.has(key)) batches.set(key, { geometry, surface, transforms: [] });
        batches.get(key).transforms.push(new THREE.Matrix4().compose(
            new THREE.Vector3(...xyz), quaternion, new THREE.Vector3(...size),
        ));
    }
    // Transform a complete assembly, including instanced furniture and artwork.
    function beginAssembly() {
        const starts = new Map([...batches].map(([key, value]) => [key, value.transforms.length]));
        const childStart = model.children.length;
        return matrix => {
            batches.forEach((batch, key) => {
                for (let i = starts.get(key) || 0; i < batch.transforms.length; i++) batch.transforms[i].premultiply(matrix);
            });
            model.children.slice(childStart).forEach(child => child.applyMatrix4(matrix));
        };
    }
    function box(x, y, z, w, h, d, color, angle = 0) {
        instance(cube, color?.isMaterial ? color : material(color), [x, y, z], [w, h, d],
            new THREE.Quaternion().setFromAxisAngle(up, angle));
    }
    function tube(from, to, radius, color) {
        const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
        const direction = b.clone().sub(a);
        instance(tubeGeometry, material(color), a.add(b).multiplyScalar(0.5).toArray(),
            [radius, direction.length(), radius], new THREE.Quaternion().setFromUnitVectors(up, direction.normalize()));
    }
    function cylinder(x, y, z, radius, height, color, top = radius, segments = 20) {
        const key = `cylinder:${top / radius}:${segments}`;
        if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(top / radius, 1, 1, segments));
        instance(geometries.get(key), material(color), [x, y, z], [radius, height, radius]);
    }
    function mesh(geometry, surface, x, y, z, angle = 0) {
        const object = new THREE.Mesh(geometry, surface);
        object.position.set(x, y, z);
        object.rotation.y = angle;
        object.castShadow = object.receiveShadow = true;
        model.add(object);
        return object;
    }
    function canvasTexture(canvas) {
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        return texture;
    }
    function panel(map, x, y, z, width, height, { floor = false, angle = 0, transparent = false } = {}) {
        const surface = new THREE.MeshBasicMaterial({ map, transparent, side: THREE.DoubleSide, toneMapped: false });
        const plane = mesh(new THREE.PlaneGeometry(width, height), surface, x, y, z, angle);
        plane.castShadow = false;
        if (floor) plane.rotation.x = -Math.PI / 2;
        return plane;
    }
    function tracedPanel(map, corners, height = 0.018) {
        const geometry = new THREE.BufferGeometry();
        // Lift the floor decal without moving its traced X/Z coordinates.
        const vertices = corners.flatMap(([px, py]) => {
            const p = fromReference(px, py);
            p[1] = height;
            return p;
        });
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
        geometry.setIndex([0, 2, 1, 0, 3, 2]);
        geometry.computeVertexNormals();
        const object = mesh(geometry, new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false }), 0, 0, 0);
        object.castShadow = false;
        return object;
    }
    function textPanel(lines, x, y, z, width, height, { color = '#151515', background = null, serif = false, angle = 0 } = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = Math.max(128, Math.round(1024 * height / width));
        const ctx = canvas.getContext('2d');
        if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.fillStyle = color;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const step = canvas.height / (lines.length + 1);
        lines.forEach((line, i) => {
            const size = Math.min(step * 0.88, 960 / (line.length * 0.59));
            ctx.font = `${serif ? '400' : '600'} ${size}px ${serif ? 'Georgia' : 'Arial'}, sans-serif`;
            ctx.fillText(line, 512, step * (i + 1));
        });
        return panel(canvasTexture(canvas), x, y, z, width, height, { angle, transparent: !background });
    }
    function assembly(x, z, angle = 0) {
        const c = Math.cos(angle), s = Math.sin(angle);
        const point = (dx, y, dz) => [x + c * dx + s * dz, y, z - s * dx + c * dz];
        return {
            point,
            box: (dx, y, dz, w, h, d, color) => box(...point(dx, y, dz), w, h, d, color, angle),
            tube: (a, b, r, color) => tube(point(...a), point(...b), r, color),
        };
    }
    function chair(x, z, angle = 0, { white = false, lift = 0, scale = 1 } = {}) {
        const a = assembly(x, z, angle), fabric = white ? C.white : C.seat;
        a.box(0, lift + 0.47 * scale, 0, 0.48 * scale, 0.11 * scale, 0.48 * scale, fabric);
        a.box(0, lift + 0.8 * scale, 0.22 * scale, 0.46 * scale, 0.55 * scale, 0.075 * scale, fabric);
        [-0.19, 0.19].forEach(dx => {
            a.tube([dx * scale, lift + 0.05, -0.21 * scale], [dx * scale, lift + 0.48 * scale, -0.18 * scale], 0.018 * scale, C.metal);
            a.tube([dx * scale, lift + 0.05, 0.25 * scale], [dx * scale, lift + 1.04 * scale, 0.24 * scale], 0.018 * scale, C.metal);
            a.tube([dx * scale, lift + 0.45 * scale, -0.18 * scale], [dx * scale, lift + 0.45 * scale, 0.24 * scale], 0.018 * scale, C.metal);
        });
    }
    function truss(x, y, z, length, angle = 0, color = '#333539', height = 0.65) {
        const a = assembly(x, z, angle), n = Math.max(2, Math.ceil(length / 1.25));
        [-0.19, 0.19].forEach(depth => {
            [y, y + height].forEach(level => a.tube([-length / 2, level, depth], [length / 2, level, depth], 0.026, color));
            for (let i = 0; i <= n; i++) {
                const px = -length / 2 + i * length / n;
                a.tube([px, y, depth], [px, y + height, depth], 0.018, color);
                if (i < n) a.tube([px, y, depth], [px + length / n, y + height, depth], 0.018, color);
            }
        });
    }
    function eventScreen(x, y, z, width, height, angle = 0) {
        const a = assembly(x, z, angle);
        a.box(0, y, 0, width + 0.16, height + 0.16, 0.18, C.stage);
        a.box(0, y, 0.11, width, height, 0.025, C.white);
        textPanel(['NEW WORLD', 'NEW PLAYBOOK', 'BETTER TRADE 2026'], ...a.point(-width * 0.19, y, 0.135), width * 0.55, height * 0.8, { serif: true, angle });
        if (textures.get('ship')) panel(textures.get('ship'), ...a.point(width * 0.29, y - height * 0.04, 0.15), height * 0.7, height * 0.95, { angle, transparent: true });
        if (textures.get('better-trade-logo-black')) panel(textures.get('better-trade-logo-black'), ...a.point(-width * 0.32, y + height * 0.37, 0.15), width * 0.13, height * 0.09, { angle, transparent: true });
        ['bitcoin', 'gold'].forEach((name, i) => {
            if (textures.get(name)) panel(textures.get(name), ...a.point(width * (0.2 + i * 0.15), y + height * 0.3, 0.17), height * 0.2, height * 0.2, { angle, transparent: true });
        });
    }

    // Deterministic fine-grain carpet texture; not a glossy raised plinth.
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = grainCanvas.height = 128;
    const grainContext = grainCanvas.getContext('2d');
    const pixels = grainContext.createImageData(128, 128);
    let seed = 2026;
    for (let i = 0; i < pixels.data.length; i += 4) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        const value = 170 + (seed % 74);
        pixels.data.set([value, value, value, 255], i);
    }
    grainContext.putImageData(pixels, 0, 0);
    const grain = canvasTexture(grainCanvas);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(2, 2);
    const carpet = new THREE.MeshStandardMaterial({ color: C.carpet, map: grain, roughness: 1 });
    const floorShape = new THREE.Shape(reference.perimeter.map(([px, py]) => {
        const [x, , z] = fromReference(px, py);
        return new THREE.Vector2(x, -z);
    }));
    const floorGeometry = new THREE.ExtrudeGeometry(floorShape, { depth: 0.15, bevelEnabled: false });
    floorGeometry.rotateX(-Math.PI / 2);
    mesh(floorGeometry, carpet, 0, -0.15, 0);

    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = lineCanvas.height = 2;
    const lineContext = lineCanvas.getContext('2d');
    lineContext.fillStyle = '#f3f3ef'; lineContext.fillRect(0, 0, 2, 2);
    const lineTexture = canvasTexture(lineCanvas);
    [[[355, 420], [519, 517], [509, 526], [344, 428]],
     [[646, 588], [907, 739], [896, 748], [635, 598]],
     [[1040, 823], [1195, 912], [1184, 920], [1029, 831]]]
        .forEach(corners => tracedPanel(lineTexture, corners));

    // Conference partition, vertical panel joints and the low rear wall.
    box(0, 4.25, -10.6, 0.24, 8.5, 21.2, C.wall);
    for (let z = -20.4; z <= 0; z += 1.4) box(0.126, 4.25, z, 0.008, 8.5, 0.018, C.seam);
    box(-3.3, 1.65, 5.4, 6.2, 3.3, 0.25, '#686968');

    const placeStage = beginAssembly();
    // Wide low stage, screen artwork, exposed truss, speakers and footlights.
    box(-11.5, 0.55, -23.3, 21.3, 1.1, 4.8, C.stage);
    box(-11.5, 0.13, -20.55, 21.5, 0.26, 0.7, '#292a29');
    eventScreen(-10.3, 3.7, -25.35, 17.7, 5.1);
    truss(-10.3, 6.35, -25.7, 18, 0, '#393a3b', 1.1);
    [-19.1, -1.5].forEach(x => {
        tube([x, 0, -25.7], [x, 7.45, -25.7], 0.045, '#393a3b');
        box(x, 1.58, -23.7, 0.95, 1, 0.8, '#141616');
    });
    for (let i = 0; i < 12; i++) box(-18.6 + i * 1.48, 6.36, -25.1, 0.22, 0.28, 0.38, '#101112');
    for (let i = 0; i < 48; i++) box(-20.5 + i * 0.4, 1.13, -24.94, 0.07, 0.055, 0.07, C.white);
    box(-22, 3.15, -23.8, 2, 4.8, 0.16, '#a1a5a6');
    textPanel(['BETTERTRADE', 'CONFERENCE', 'NEW WORLD', 'NEW PLAYBOOK', '31 OCT — 1 NOV', '2026'], -22, 3.15, -23.7, 1.83, 4.56, { background: '#f2f1ec', color: '#777b7b' });

    const stageAnchor = fromReference(1022, 203);
    placeStage(new THREE.Matrix4().makeTranslation(stageAnchor[0], 0, stageAnchor[2])
        .multiply(new THREE.Matrix4().makeScale(0.80, 0.82, 0.8))
        .multiply(new THREE.Matrix4().makeTranslation(11.5, 0, 23.3)));

    // Three longitudinal seat banks, separated by two continuous aisles.
    for (let bank = 0; bank < 3; bank++) for (let row = 0; row < 26; row++) for (let col = 0; col < 10; col++) {
        chair(-19.3 + bank * 6.35 + col * 0.55, -14.1 + row * 0.70, 0, { scale: 0.85 });
    }
    const placeDesks = beginAssembly();
    // Two parallel white technical desks on stepped black platforms.
    box(-17.3, 0.18, 6.9, 10.5, 0.36, 3.5, C.stage);
    [5.85, 7.25].forEach((z, tier) => {
        box(-17.3, 0.41 + tier * 0.12, z + 0.4, 10.2, 0.28, 1.25, '#202120');
        box(-17.3, 1.12 + tier * 0.12, z, 9.8, 0.12, 0.65, C.white);
        [-21.4, -17.4, -13.4].forEach(x => box(x, 0.8, z, 0.07, 0.58, 0.5, '#1c1e1e'));
        for (let i = 0; i < 11; i++) chair(-21.7 + i * 0.84, z + 0.65, 0, { lift: 0.38 + tier * 0.12, scale: 0.78 });
    });
    placeDesks(new THREE.Matrix4().makeTranslation(2.2, 0, 0));
    box(-10.2, 2.1, 7.5, 0.48, 4.2, 3, '#151616');
    box(-4.7, 2.1, 7.5, 0.48, 4.2, 3, '#151616');
    box(-7.45, 4.13, 7.5, 5.98, 0.64, 3, '#151616');
    if (textures.get('sky-poster')) panel(textures.get('sky-poster'), -9.948, 2.45, 7.45, 2.7, 2.55, { angle: Math.PI / 2 });

    function counterRow(x, z, count, angle = 0, spacing = 0.91) {
        const a = assembly(x, z, angle);
        for (let i = 0; i < count; i++) {
            const dx = (i - (count - 1) / 2) * spacing;
            a.box(dx, 0.52, 0, 0.86, 1.02, 0.56, C.counter);
            a.box(dx, 1.08, 0, 0.91, 0.08, 0.65, C.white);
            const p = a.point(dx, 0, -0.69);
            chair(p[0], p[2], angle + Math.PI, { white: true, scale: 0.82 });
        }
    }
    function frameBay(x, z, width, depth, height, angle = 0) {
        const a = assembly(x, z, angle);
        [-1, 1].forEach(side => {
            [-1, 1].forEach(end => {
                a.box(side * width / 2, height / 2, end * depth / 2, 0.1, height, 0.1, C.blue);
                a.box(side * width / 2, 0.06, end * depth / 2, 0.4, 0.12, 0.4, C.blue);
            });
            [height, height - 0.34].forEach(level => {
                a.tube([side * width / 2, level, -depth / 2], [side * width / 2, level, depth / 2], 0.025, C.blue);
                a.tube([-width / 2, level, side * depth / 2], [width / 2, level, side * depth / 2], 0.025, C.blue);
            });
            for (let i = 0; i < 4; i++) {
                const dx = -width / 2 + i * width / 4;
                a.tube([dx, height - 0.34, side * depth / 2], [dx + width / 4, height, side * depth / 2], 0.018, C.blue);
            }
        });
    }
    function stripedKiosk(x, z, angle = 0, width = 2.6) {
        const a = assembly(x, z, angle);
        [-1, 1].forEach(side => a.box(side * width / 2, 1.55, 0, 0.12, 3.1, 0.12, C.blue));
        a.box(0, 2.9, 0, width, 0.14, 1.2, C.white);
        for (let i = 0; i < 7; i++) a.box(-width / 2 + (i + 0.5) * width / 7, 2.98, 0, width / 14, 0.025, 1.2, C.stripe);
        a.box(0, 1.24, 0, width - 0.23, 2.35, 0.13, C.white);
        a.box(0, 0.52, 0.65, width - 0.2, 1, 0.55, C.counter);
    }

    function shellChair(x, z) {
        if (!geometries.has('shell-chair')) {
            const profile = new THREE.Shape();
            profile.moveTo(-0.30, 0.06);
            profile.bezierCurveTo(0.35, 0.03, 0.39, 0.12, 0.11, 0.39);
            profile.bezierCurveTo(-0.10, 0.58, -0.38, 0.37, -0.31, 0.68);
            profile.lineTo(-0.19, 1.17); profile.lineTo(-0.10, 1.17);
            profile.bezierCurveTo(-0.12, 0.75, -0.07, 0.59, 0.05, 0.52);
            profile.bezierCurveTo(0.66, 0.16, 0.48, -0.02, -0.30, -0.02);
            profile.closePath();
            const geometry = new THREE.ExtrudeGeometry(profile, { depth: 0.48, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2, curveSegments: 16 });
            geometry.rotateY(Math.PI / 2); geometry.translate(-0.24, 0, 0);
            geometries.set('shell-chair', geometry);
        }
        instance(geometries.get('shell-chair'), material(C.white), [x, 1.25, z], [1, 1, 1]);
    }

    // Left pavilion: open blue cage and the raised rows of white display seats.
    frameBay(-18, 15.45, 9.8, 7.5, 4.15);
    frameBay(-18, 15.45, 4.1, 7.5, 2.2);
    box(-18, 1.12, 15.45, 3.75, 0.2, 7.15, C.navy);
    for (let row = 0; row < 7; row++) [-0.95, 0, 0.95].forEach(dx => shellChair(-18 + dx, 12.55 + row * 0.91));
    counterRow(-22.15, 15.45, 8, Math.PI / 2);
    counterRow(-13.7, 15.45, 8, -Math.PI / 2);
    counterRow(-18, 10.85, 9, Math.PI);
    counterRow(-18, 20.15, 9);
    stripedKiosk(-22.1, 10.9, Math.PI);
    stripedKiosk(-18.1, 21.05, 0, 3);

    function archGeometry(width, height, opening) {
        const r = opening / 2, stem = height - r - 0.2;
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, 0); shape.lineTo(-width / 2, height);
        shape.lineTo(width / 2, height); shape.lineTo(width / 2, 0);
        shape.lineTo(r, 0); shape.lineTo(r, stem);
        shape.absarc(0, stem, r, 0, Math.PI, false);
        shape.lineTo(-r, 0); shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false, curveSegments: 20 });
    }
    // Right pavilion: three open arches on a diagonal central gallery.
    const archAngle = Math.PI / 4, gallery = assembly(-3.45, 16.4, archAngle);
    const arch = archGeometry(3.2, 3.85, 2.6), archTrim = archGeometry(3.3, 3.94, 2.58);
    [-3.5, 0, 3.5].forEach(dz => {
        mesh(archTrim, material(C.white), ...gallery.point(0, 0, dz - 0.02), archAngle);
        mesh(arch, material(C.blue), ...gallery.point(0, 0, dz + 0.03), archAngle);
    });
    [-1.6, 1.6].forEach(dx => {
        gallery.box(dx, 0.1, 0, 0.12, 0.2, 7.4, C.blue);
        gallery.box(dx, 3.84, 0, 0.09, 0.1, 7.3, C.white);
    });
    for (let i = 0; i < 9; i++) [-0.9, 0.9].forEach(dx => {
        const p = gallery.point(dx, 0, -3.2 + i * 0.8);
        chair(p[0], p[2], archAngle + (dx > 0 ? Math.PI / 2 : -Math.PI / 2), { white: true });
    });
    function displayWall(x, z, angle) {
        const a = assembly(x, z, angle);
        frameBay(x, z, 3.6, 0.55, 3.2, angle);
        for (let i = 0; i < 3; i++) {
            const dx = -1.15 + i * 1.15;
            a.box(dx, 2, 0, 1.04, 1.85, 0.12, C.white);
            const texture = textures.get(['card', 'stock', 'gold'][i]);
            if (texture) panel(texture, ...a.point(dx, 2.05, 0.075), 0.96, 1.35, { angle, transparent: true });
        }
        const p = a.point(0, 0, 0.9);
        counterRow(p[0], p[2], 4, angle);
    }
    displayWall(-7.2, 18.3, Math.PI / 4);
    displayWall(0.8, 14.2, -Math.PI / 4);
    counterRow(-3.2, 22, 8);
    counterRow(2, 18.8, 6, -Math.PI / 2);
    stripedKiosk(-3.5, 22.35, 0, 1.55);
    stripedKiosk(2.4, 18.6, -Math.PI / 2, 1.55);

    // Blue striped lighthouse with a circular base and multicolour floor tiles.
    const tileColors = ['#5195c6', '#be79d5', '#e79bcf', '#ffc94d'];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
        box(-10.5 + col * 0.76, 0.02, 13.2 + row * 0.76, 0.74, 0.035, 0.74, tileColors[(row + col) % 4]);
    }
    cylinder(-9.35, 0.19, 14.3, 1.27, 0.3, '#829bb1');
    cylinder(-9.35, 0.48, 14.3, 0.99, 0.3, C.white);
    cylinder(-9.35, 0.74, 14.3, 0.75, 0.26, C.blue);
    for (let level = 0; level < 7; level++) {
        const bottom = 0.42 - level * 0.034;
        cylinder(-9.35, 1.02 + level * 0.3, 14.3, bottom, 0.3, level % 2 ? C.navy : C.blue, bottom - 0.034);
    }
    cylinder(-9.35, 3.02, 14.3, 0.25, 0.38, C.navy, 0, 8);

    // Boat display with a tapered hull, cabin, mast and railings.
    const boat = assembly(-11.65, 18.2, -0.22);
    boat.box(0, 0.08, 0, 1.35, 0.16, 3.3, C.navy);
    const hull = new THREE.Shape();
    hull.moveTo(0, -1.6); hull.lineTo(0.62, -0.8); hull.lineTo(0.52, 1.4);
    hull.lineTo(-0.52, 1.4); hull.lineTo(-0.62, -0.8); hull.closePath();
    const hullGeometry = new THREE.ExtrudeGeometry(hull, { depth: 0.36, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.06, bevelSegments: 1 });
    hullGeometry.rotateX(-Math.PI / 2);
    mesh(hullGeometry, material('#a2a7aa'), ...boat.point(0, 0.25, 0), -0.22);
    boat.box(0, 0.8, 0, 0.72, 0.55, 1.4, C.white);
    boat.box(0, 1.05, 0, 0.86, 0.07, 1.5, '#cbd1d1');
    boat.box(0, 0.98, -0.35, 0.74, 0.3, 0.08, '#536977');
    boat.tube([0, 0.9, -0.5], [0, 1.8, -0.5], 0.025, C.white);
    [-0.5, 0.5].forEach(dx => {
        boat.tube([dx, 0.72, -1.05], [dx, 0.72, 1.2], 0.022, C.white);
        [-0.9, 0, 0.9].forEach(dz => boat.tube([dx, 0.5, dz], [dx, 0.74, dz], 0.018, C.white));
    });
    [[-23.4, 21.1], [0.4, 22.6]].forEach(([x, z]) => {
        box(x, 1.8, z, 0.28, 3.6, 0.28, C.blue);
        box(x, 0.08, z, 0.85, 0.16, 0.85, C.blue);
        for (let i = 0; i < 3; i++) box(x, 3.9 + i * 0.25, z, 0.4, 0.16, 0.12, C.navy);
    });
    mesh(archGeometry(1.7, 2.2, 1.1), material('#5da0c7'), -14, 0, 22.7);

    // Experience stage with three stools, a side table and clustered white poufs.
    box(4.8, 0.4, -19.1, 6.7, 0.8, 3.2, C.stage);
    box(4.8, 0.14, -17.25, 6.9, 0.28, 0.55, '#41413e');
    eventScreen(4.8, 2.75, -20.5, 6.4, 3.9);
    [3.1, 4.8, 6.5].forEach(x => {
        cylinder(x, 1.7, -19.2, 0.24, 0.1, '#c0a36c');
        [-1, 1].forEach(side => {
            tube([x + side * 0.18, 0.82, -19.36], [x + side * 0.13, 1.67, -19.32], 0.021, '#b99a61');
            tube([x + side * 0.18, 0.82, -19.04], [x + side * 0.13, 1.67, -19.08], 0.021, '#b99a61');
        });
    });
    [1.75, 7.8].forEach(x => {
        cylinder(x, 0.87, -17.9, 0.18, 0.06, '#171819');
        tube([x, 0.9, -17.9], [x, 2.15, -17.9], 0.018, '#171819');
    });
    box(1.25, 1.12, -19.2, 0.8, 0.12, 5.2, '#aaa9a1');
    box(1.25, 0.55, -19.2, 0.45, 1.1, 5, C.stage);
    for (let i = 0; i < 5; i++) chair(0.65, -21 + i * 0.9, -Math.PI / 2, { white: true });
    [[3, -15.8], [5.2, -15.8], [7.4, -15.8], [4.1, -14.1], [6.3, -14.1]].forEach(([x, z]) => {
        cylinder(x, 0.55, z, 0.45, 0.08, C.white);
        cylinder(x, 0.29, z, 0.055, 0.5, '#989c9d');
        [-1, 1].forEach(side => box(x + side * 0.67, 0.28, z, 0.52, 0.55, 0.54, C.white));
    });

    // Flat decals preserve the reference colours, bay divisions and arrows.
    function zone(x, z, width, depth, color, label, { bays = 1, arrow = '↓', arrowAtTop = false, corners } = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = 1536; canvas.height = Math.round(1536 * depth / width);
        const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
        ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#6c4c12'; ctx.lineWidth = 2;
        for (let i = 1; i < bays; i++) {
            const px = i * w / bays;
            ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
        }
        const size = Math.min(h * 0.25, w / (label.length * 0.61 + 1.5));
        ctx.font = `700 ${size}px Arial, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (bays > 1) ctx.fillRect(w / 2 - ctx.measureText(label).width / 2 - 12, h * 0.26, ctx.measureText(label).width + 24, h * 0.43);
        ctx.fillStyle = '#101010'; ctx.fillText(label, w / 2, h * 0.39);
        ctx.font = `400 ${size * 0.73}px Arial, sans-serif`; ctx.fillText('ZONE', w / 2, h * 0.63);
        ctx.font = `400 ${h * 0.23}px Arial, sans-serif`;
        for (let i = 0; i < bays; i++) ctx.fillText(arrow, (i + 0.5) * w / bays, h * (arrowAtTop ? 0.13 : 0.88));
        if (corners) tracedPanel(canvasTexture(canvas), corners);
        else panel(canvasTexture(canvas), x, 0.014, z, width, depth, { floor: true });
    }
    zone(4.6, -11.15, 8.4, 4.65, C.pink, 'Commodity+Property', { arrow: '', corners: reference.zones.commodity });
    zone(4.6, -5.85, 8.4, 4.5, C.yellow, 'Cryptocurrency', { arrow: '', corners: reference.zones.crypto });
    zone(14.75, -19.2, 14.8, 4.75, C.gold, 'Alternative Investment', { bays: 3, corners: reference.zones.alternative });
    zone(12.45, -12, 4.8, 4.4, C.coral, 'Health', { corners: reference.zones.health1 });
    zone(18.45, -12, 4.8, 4.4, C.coral, 'Health', { corners: reference.zones.health2 });
    zone(18.45, -5.8, 4.8, 4.3, C.gold, 'Capital', { arrow: '←', corners: reference.zones.capitalSmall });
    zone(12.3, 2, 18.6, 4.65, C.gold, 'Capital', { bays: 4, arrow: '↑', arrowAtTop: true, corners: reference.zones.capital });

    // Central freestanding sign: lower screen, white header and open black rig.
    const tower = assembly(12.1, -4.5);
    tower.box(0, 1.7, 0, 3.7, 3.4, 0.38, '#181a1b');
    eventScreen(12.1, 1.75, -4.27, 3.5, 3.15);
    [-1.5, 1.5].forEach(dx => {
        tower.tube([dx, 0, -0.25], [dx, 7.6, -0.25], 0.055, '#181a1b');
        tower.tube([dx, 0, -0.68], [dx, 7.6, -0.68], 0.04, '#181a1b');
        for (let i = 0; i < 8; i++) tower.tube([dx, i * 0.9, -0.25], [dx, (i + 1) * 0.9, -0.68], 0.027, '#181a1b');
    });
    truss(12.1, 6.9, -4.94, 3.1, 0, '#181a1b', 0.68);
    tower.box(0, 7.55, -0.2, 3.85, 0.64, 0.16, '#151718');
    textPanel(['NEW WORLD · NEW PLAYBOOK'], 12.1, 5.15, -3.8, 4.7, 1, { background: '#efeee7', serif: true });

    // Cyan markings are flat rectangles in the source, not raised counters.
    reference.cyan.forEach(({ corners, count, acrossDepth }) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#40dce9'; ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#c7faff'; ctx.lineWidth = 2;
        for (let i = 1; i < count; i++) {
            const p = 512 * i / count;
            ctx.beginPath();
            ctx.moveTo(acrossDepth ? 0 : p, acrossDepth ? p : 0);
            ctx.lineTo(acrossDepth ? 512 : p, acrossDepth ? p : 512);
            ctx.stroke();
        }
        tracedPanel(canvasTexture(canvas), corners);
    });

    batches.forEach(({ geometry, surface, transforms }) => {
        const object = new THREE.InstancedMesh(geometry, surface, transforms.length);
        transforms.forEach((matrix, i) => object.setMatrixAt(i, matrix));
        object.instanceMatrix.needsUpdate = true;
        object.castShadow = object.receiveShadow = true;
        model.add(object);
    });
    return model;
}

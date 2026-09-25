/* Progressive enhancement: the original image remains usable until WebGL
   has rendered successfully. Load Three.js only near the floor-plan section. */
import { reference, fromReference } from './floor-plan-reference.js?v=1';
const section = document.querySelector('.floor-plan');

if (section) {
    const visual = section.querySelector('.floor-plan__visual');
    const host = section.querySelector('.floor-plan__scene');
    const canvas = section.querySelector('.floor-plan__canvas');
    const toolbar = section.querySelector('.floor-plan__toolbar');
    const caption = section.querySelector('.floor-plan__caption');
    const status = section.querySelector('.floor-plan__status');
    const viewButtons = [...section.querySelectorAll('[data-floor-view]')];
    const actions = [...section.querySelectorAll('[data-floor-action]')];
    let viewer;
    let loading;
    let selectedView = '3d';

    function showView(mode) {
        const use3D = mode === '3d' && Boolean(viewer);
        visual.classList.toggle('is-3d', use3D);
        host.hidden = !use3D;
        caption.hidden = !use3D;
        viewButtons.forEach(button => button.setAttribute('aria-pressed',
            String(button.dataset.floorView === (use3D ? '3d' : 'image'))));
        if (use3D) viewer.resize();
    }

    async function loadViewer() {
        if (loading) return loading;
        toolbar.hidden = false;
        loading = (async () => {
            try {
                const [THREE, { createFloorPlanModel }] = await Promise.all([
                    import('../vendor/three/three.module.min.js'),
                    import('./floor-plan-model.js?v=4'),
                ]);
                viewer = await makeViewer(THREE, createFloorPlanModel);
                showView(selectedView);
                status.textContent = 'CONFERENCE · PAVILIONS · EXPERIENCE';
            } catch (error) {
                console.warn('Floor plan 3D is unavailable; using the original image.', error);
                viewer?.dispose();
                viewer = null;
                selectedView = 'image';
                showView('image');
                viewButtons.find(button => button.dataset.floorView === '3d').disabled = true;
                status.textContent = 'ไม่สามารถแสดง 3D ได้ในขณะนี้ แสดงภาพต้นฉบับแทน';
            }
        })();
        return loading;
    }

    viewButtons.forEach(button => button.addEventListener('click', () => {
        selectedView = button.dataset.floorView;
        showView(selectedView);
    }));

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer.disconnect();
            loadViewer();
        }, { rootMargin: '400px' });
        observer.observe(section);
    } else {
        loadViewer();
    }

    async function makeViewer(THREE, createModel) {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-50, 50, 40, -40, 0.1, 250);
        const target = new THREE.Vector3(...fromReference(reference.width / 2, reference.height / 2));
        const initial = { theta: reference.theta, phi: reference.phi, zoom: 1 };
        const state = { ...initial };
        const minZoom = 0.7;
        const maxZoom = 2.8;
        let disposed = false;
        let frame = 0;
        let pointer;
        let viewportAspect = 1;
        const events = new AbortController();
        const listen = (element, type, listener, options = {}) => {
            element.addEventListener(type, listener, { ...options, signal: events.signal });
        };
        const resizeObserver = new ResizeObserver(resize);

        function releaseScene() {
            const geometries = new Set();
            const materials = new Set();
            scene.traverse(object => {
                if (object.geometry) geometries.add(object.geometry);
                if (object.material) {
                    (Array.isArray(object.material) ? object.material : [object.material])
                        .forEach(material => materials.add(material));
                }
            });
            geometries.forEach(geometry => geometry.dispose());
            materials.forEach(material => {
                material.map?.dispose();
                material.dispose();
            });
        }

        function dispose() {
            disposed = true;
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            events.abort();
            releaseScene();
            renderer.dispose();
        }

        try {
            scene.add(new THREE.HemisphereLight(0xffffff, 0xaaa69e, 1.8));
            const light = new THREE.DirectionalLight(0xfffaf2, 2.1);
            light.position.set(-30, 65, -12);
            light.castShadow = true;
            light.shadow.mapSize.set(2048, 2048);
            Object.assign(light.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 150 });
            light.shadow.bias = -0.0003;
            light.shadow.normalBias = 0.05;
            scene.add(light);
            scene.add(await createModel());
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220),
                new THREE.ShadowMaterial({ opacity: 0.13 }));
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -0.17;
            ground.receiveShadow = true;
            scene.add(ground);
            // Validate WebGL before replacing the fallback image.
            renderer.setSize(1, 1, false);
            positionCamera();
            renderer.render(scene, camera);
        } catch (error) {
            dispose();
            throw error;
        }

        function positionCamera() {
            const radius = 110;
            camera.position.set(
                target.x + radius * Math.sin(state.phi) * Math.sin(state.theta),
                target.y + radius * Math.cos(state.phi),
                target.z + radius * Math.sin(state.phi) * Math.cos(state.theta),
            );
            camera.lookAt(target);
            // The plan has a longer extent from above than in its source view.
            const fit = state.phi === 0.01 ? 1.5 : 1.06;
            const halfHeight = Math.max(reference.height, reference.width / viewportAspect) / (2 * reference.pixelsPerUnit) * fit;
            camera.left = -halfHeight * viewportAspect;
            camera.right = halfHeight * viewportAspect;
            camera.top = halfHeight;
            camera.bottom = -halfHeight;
            camera.zoom = state.zoom;
            camera.updateProjectionMatrix();
            actions.forEach(button => {
                if (button.dataset.floorAction === 'in') button.disabled = state.zoom >= maxZoom;
                if (button.dataset.floorAction === 'out') button.disabled = state.zoom <= minZoom;
                if (button.dataset.floorAction === 'top') button.setAttribute('aria-pressed', String(state.phi === 0.01));
            });
        }

        // Render on changes only: no perpetual animation or idle GPU work.
        function render() {
            frame = 0;
            if (disposed || host.hidden || document.hidden) return;
            positionCamera();
            renderer.render(scene, camera);
        }

        function requestRender() {
            if (!frame && !disposed) frame = requestAnimationFrame(render);
        }

        function resize() {
            if (disposed || host.hidden) return;
            const { width, height } = host.getBoundingClientRect();
            if (!width || !height) return;
            viewportAspect = width / height;
            renderer.setSize(width, height, false);
            requestRender();
        }

        function zoom(factor) {
            state.zoom = Math.min(maxZoom, Math.max(minZoom, state.zoom * factor));
            requestRender();
        }

        function action(name) {
            if (name === 'reset') Object.assign(state, initial);
            if (name === 'top') {
                if (state.phi === 0.01) Object.assign(state, initial);
                else Object.assign(state, { theta: 0, phi: 0.01 });
            }
            if (name === 'in') zoom(1.2);
            if (name === 'out') zoom(1 / 1.2);
            requestRender();
        }

        actions.forEach(button => listen(button, 'click', () => action(button.dataset.floorAction)));
        listen(canvas, 'pointerdown', event => {
            if (event.button !== 0 || pointer) return;
            pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
            canvas.setPointerCapture(event.pointerId);
            canvas.focus({ preventScroll: true });
        });
        listen(canvas, 'pointermove', event => {
            if (pointer?.id !== event.pointerId) return;
            state.theta -= (event.clientX - pointer.x) * 0.008;
            // Horizontal touch gestures rotate; vertical swipes scroll the page.
            if (event.pointerType !== 'touch') {
                state.phi = Math.max(0.12, Math.min(1.3, state.phi + (event.clientY - pointer.y) * 0.006));
            }
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            requestRender();
        });
        const endPointer = event => {
            if (pointer?.id === event.pointerId) pointer = null;
        };
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => listen(canvas, type, endPointer));
        listen(canvas, 'keydown', event => {
            const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            if (event.key === 'ArrowLeft') state.theta += 0.12;
            if (event.key === 'ArrowRight') state.theta -= 0.12;
            if (event.key === 'ArrowUp') state.phi = Math.max(0.12, state.phi - 0.08);
            if (event.key === 'ArrowDown') state.phi = Math.min(1.3, state.phi + 0.08);
            if (event.key === '+' || event.key === '=') zoom(1.2);
            if (event.key === '-') zoom(1 / 1.2);
            if (event.key === 'Home') action('reset');
            requestRender();
        });
        listen(canvas, 'webglcontextlost', event => {
            event.preventDefault();
            dispose();
            viewer = null;
            selectedView = 'image';
            showView('image');
            viewButtons.find(button => button.dataset.floorView === '3d').disabled = true;
            status.textContent = 'การแสดงผล 3D หยุดทำงาน แสดงภาพต้นฉบับแทน';
        });
        listen(document, 'visibilitychange', requestRender);
        listen(window, 'pagehide', event => { if (!event.persisted) dispose(); });
        resizeObserver.observe(host);
        return { resize, dispose };
    }
}

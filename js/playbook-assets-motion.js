(() => {
    const section = document.querySelector('.playbook');
    const assetLayer = section?.querySelector('.playbook__assets');
    const assets = assetLayer ? Array.from(assetLayer.querySelectorAll('[data-playbook-asset]')) : [];

    if (!section || !assetLayer || assets.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const gsapApi = window.gsap;

    if (!gsapApi || reducedMotion.matches) return;

    const CLUSTER_Y_RATIO = 0.52;
    const SCATTER_DURATION = 1.2;
    const SCATTER_STAGGER = 0.07;
    const CLUSTER_SCALE = 0.58;
    const RESIZE_TOLERANCE = 2;
    const RESIZE_DEBOUNCE = 180;
    const FLOAT_MIN_Y = 8;
    const FLOAT_MAX_Y = 16;
    const FLOAT_MIN_ROTATION = 2;
    const FLOAT_MAX_ROTATION = 6;
    const FLOAT_MIN_DURATION = 3;
    const FLOAT_MAX_DURATION = 5;
    const SCATTER_TRIGGER_VIEWPORT_RATIO = 0.2;
    const INITIAL_ROTATIONS = [-18, 14, -12, 16, -22, 10];

    const motionLayers = assets.map(asset => asset.querySelector('.playbook__asset-motion'));
    const floatLayers = assets.map(asset => asset.querySelector('.playbook__asset-float'));

    let scatterTimeline = null;
    let floatTweens = [];
    let resizeTimer = 0;
    let scrollFrame = 0;
    let lastViewportWidth = window.innerWidth;
    let hasScattered = false;
    let sectionIsVisible = false;

    const setFloatPaused = () => {
        const shouldPause = !sectionIsVisible || document.hidden;
        floatTweens.forEach(tween => tween.paused(shouldPause));
    };

    const stopFloat = () => {
        floatTweens.forEach(tween => tween.kill());
        floatTweens = [];
        gsapApi.set(floatLayers, { clearProps: 'transform' });
    };

    const startFloat = () => {
        if (floatTweens.length > 0 || !hasScattered) return;

        floatTweens = floatLayers.map(floatLayer => {
            const rotationDirection = Math.random() > 0.5 ? 1 : -1;

            return gsapApi.to(floatLayer, {
                y: `+=${gsapApi.utils.random(FLOAT_MIN_Y, FLOAT_MAX_Y)}`,
                rotate: `+=${gsapApi.utils.random(FLOAT_MIN_ROTATION, FLOAT_MAX_ROTATION) * rotationDirection}`,
                duration: gsapApi.utils.random(FLOAT_MIN_DURATION, FLOAT_MAX_DURATION),
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                paused: !sectionIsVisible || document.hidden,
            });
        });
    };

    const setCluster = () => {
        const layerBox = assetLayer.getBoundingClientRect();
        const sceneBox = section.querySelector('.playbook__scene')?.getBoundingClientRect() || layerBox;
        const clusterX = sceneBox.left + sceneBox.width / 2;
        const clusterY = sceneBox.top + sceneBox.height * CLUSTER_Y_RATIO;

        assets.forEach((asset, index) => {
            const assetBox = asset.getBoundingClientRect();
            const assetCenterX = assetBox.left + assetBox.width / 2;
            const assetCenterY = assetBox.top + assetBox.height / 2;

            gsapApi.set(motionLayers[index], {
                x: clusterX - assetCenterX,
                y: clusterY - assetCenterY,
                scale: CLUSTER_SCALE,
                rotate: INITIAL_ROTATIONS[index] || 0,
                opacity: 1,
                force3D: true,
                transformOrigin: '50% 50%',
            });
        });
    };

    const playScatter = () => {
        hasScattered = true;
        scatterTimeline?.play();
    };

    const playRegroup = () => {
        hasScattered = false;
        stopFloat();
        scatterTimeline?.reverse();
    };

    const getScatterTriggerY = () => (
        window.innerHeight * SCATTER_TRIGGER_VIEWPORT_RATIO
    );

    const syncScatterState = () => {
        scrollFrame = 0;

        if (section.getBoundingClientRect().top <= getScatterTriggerY()) {
            if (!hasScattered) playScatter();
            return;
        }

        if (hasScattered) playRegroup();
    };

    const requestScatterSync = () => {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(syncScatterState);
    };

    const buildMotion = () => {
        const shouldRemainScattered = hasScattered
            || section.getBoundingClientRect().top <= getScatterTriggerY();

        scatterTimeline?.kill();
        stopFloat();
        gsapApi.set(motionLayers, { clearProps: 'all' });
        setCluster();

        scatterTimeline = gsapApi.timeline({
            paused: true,
            defaults: {
                duration: SCATTER_DURATION,
                ease: 'power3.out',
                force3D: true,
            },
            onStart: stopFloat,
            onComplete: startFloat,
            onReverseComplete: stopFloat,
        });

        motionLayers.forEach((motionLayer, index) => {
            scatterTimeline.to(motionLayer, {
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                opacity: 1,
            }, index * SCATTER_STAGGER);
        });

        if (shouldRemainScattered) {
            hasScattered = true;
            scatterTimeline.progress(1);
            startFloat();
        } else {
            hasScattered = false;
            scatterTimeline.pause(0);
        }
    };

    const sectionObserver = new IntersectionObserver(([entry]) => {
        sectionIsVisible = entry.isIntersecting;
        setFloatPaused();
    }, { threshold: 0.04 });

    const handleVisibilityChange = () => {
        setFloatPaused();
    };

    const handleResize = () => {
        const viewportWidth = window.innerWidth;
        if (Math.abs(viewportWidth - lastViewportWidth) <= RESIZE_TOLERANCE) return;

        lastViewportWidth = viewportWidth;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            buildMotion();
            requestScatterSync();
        }, RESIZE_DEBOUNCE);
    };

    const cleanup = () => {
        window.clearTimeout(resizeTimer);
        window.cancelAnimationFrame(scrollFrame);
        scatterTimeline?.kill();
        stopFloat();
        sectionObserver.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('scroll', requestScatterSync);
        window.removeEventListener('resize', handleResize);
    };

    sectionObserver.observe(section);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', requestScatterSync, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('pagehide', cleanup, { once: true });

    buildMotion();
    requestScatterSync();
})();

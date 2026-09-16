(() => {
    const layer = document.querySelector('.cta__assets');
    const floatLayers = layer
        ? Array.from(layer.querySelectorAll('[data-cta-asset] .cta__asset-float'))
        : [];

    if (!layer || floatLayers.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const gsapApi = window.gsap;

    if (!gsapApi || reducedMotion.matches) return;

    /* ค่าชุดเดียวกับ js/playbook-assets-motion.js เพื่อให้ลอยขยับจังหวะเดียวกับของใน section Playbook
       (ที่นั่นมีจังหวะกระจายตัวตอนเลื่อนถึงด้วย แต่แผง CTA ไม่มีฉากให้กระจายจาก จึงเอาแค่การลอย) */
    const FLOAT_MIN_Y = 8;
    const FLOAT_MAX_Y = 16;
    const FLOAT_MIN_ROTATION = 2;
    const FLOAT_MAX_ROTATION = 6;
    const FLOAT_MIN_DURATION = 3;
    const FLOAT_MAX_DURATION = 5;

    let sectionIsVisible = false;

    const tweens = floatLayers.map((floatLayer) => {
        const rotationDirection = Math.random() > 0.5 ? 1 : -1;

        return gsapApi.to(floatLayer, {
            y: `+=${gsapApi.utils.random(FLOAT_MIN_Y, FLOAT_MAX_Y)}`,
            rotate: `+=${gsapApi.utils.random(FLOAT_MIN_ROTATION, FLOAT_MAX_ROTATION) * rotationDirection}`,
            duration: gsapApi.utils.random(FLOAT_MIN_DURATION, FLOAT_MAX_DURATION),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            paused: true,
        });
    });

    const syncPaused = () => {
        const shouldPause = !sectionIsVisible || document.hidden;
        tweens.forEach((tween) => tween.paused(shouldPause));
    };

    const sectionObserver = new IntersectionObserver(([entry]) => {
        sectionIsVisible = entry.isIntersecting;
        syncPaused();
    }, { threshold: 0.04 });

    sectionObserver.observe(layer.closest('.cta') || layer);
    document.addEventListener('visibilitychange', syncPaused);

    window.addEventListener('pagehide', () => {
        tweens.forEach((tween) => tween.kill());
        sectionObserver.disconnect();
        document.removeEventListener('visibilitychange', syncPaused);
    }, { once: true });
})();

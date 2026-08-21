(() => {
    const section = document.querySelector('.topics-showcase');
    const assetStage = section?.querySelector('.topics-showcase__assets');
    const topics = section?.querySelector('.concept__topics');
    const assetFrames = [...(assetStage?.querySelectorAll('[data-topic-asset]') || [])];
    const assets = assetFrames.map(frame => frame.querySelector('.topics-showcase__asset-motion'));
    const floats = assetFrames.map(frame => frame.querySelector('.topics-showcase__asset-float'));

    if (!section || !assetStage || !topics || !assets.length || assets.some(asset => !asset)) return;

    const clamp = value => Math.min(1, Math.max(0, value));

    const init = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const idleTweens = window.gsap ? floats.map((float, index) => {
            const driftY = gsap.utils.random(8, 14);
            const driftRotation = gsap.utils.random(2, 5) * (index % 2 ? -1 : 1);

            return gsap.fromTo(float, {
                y: -driftY / 2,
                rotation: -driftRotation / 2,
            }, {
                y: driftY / 2,
                rotation: driftRotation / 2,
                duration: gsap.utils.random(3.2, 4.8),
                delay: index * 0.08,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                paused: true,
            });
        }) : [];

        let sectionIsVisible = false;
        const syncIdleMotion = () => {
            const shouldPlay = sectionIsVisible && !document.hidden;
            idleTweens.forEach(tween => shouldPlay ? tween.play() : tween.pause());
        };

        const sectionObserver = new IntersectionObserver(([entry]) => {
            sectionIsVisible = entry.isIntersecting;
            syncIdleMotion();
        }, { threshold: 0.04 });

        sectionObserver.observe(section);
        document.addEventListener('visibilitychange', syncIdleMotion);

        const getEntryProgress = (isMobile, viewportHeight) => {
            const triggerBox = (isMobile ? assetStage : topics).getBoundingClientRect();
            const startLine = viewportHeight * (isMobile ? 0.94 : 0.9);
            const endTop = isMobile
                ? viewportHeight * 0.38 - triggerBox.height
                : viewportHeight * 0.5 - triggerBox.height * 0.5;

            return clamp((startLine - triggerBox.top) / Math.max(1, startLine - endTop));
        };

        const getExitProgress = (isMobile, viewportHeight) => {
            const sectionBottom = section.getBoundingClientRect().bottom;
            const endLine = isMobile ? viewportHeight * -0.65 : 0;

            return clamp((viewportHeight - sectionBottom) / Math.max(1, viewportHeight - endLine));
        };

        const getEntryOffset = (frame, sectionBox, isMobile) => {
            if (isMobile) return -(frame.offsetTop + frame.offsetHeight + 16);

            const frameBox = frame.getBoundingClientRect();
            return -(frameBox.top - sectionBox.top + frameBox.height + 24);
        };

        const getFallDistance = (frame, isMobile, viewportHeight) => {
            const sectionPaddingBottom = parseFloat(getComputedStyle(section).paddingBottom) || 0;
            const viewportFall = viewportHeight * (isMobile ? 0.75 : 1.35);
            return assetStage.offsetHeight - frame.offsetTop + sectionPaddingBottom + viewportFall;
        };

        const update = () => {
            const viewportHeight = window.innerHeight;
            const isMobile = window.innerWidth < 768;
            const sectionBox = section.getBoundingClientRect();
            const entryProgress = getEntryProgress(isMobile, viewportHeight);
            const exitProgress = getExitProgress(isMobile, viewportHeight);

            assets.forEach((asset, index) => {
                if (exitProgress > 0) {
                    const itemProgress = clamp((exitProgress - 0.08 - index * 0.045) / 0.64);
                    const y = getFallDistance(assetFrames[index], isMobile, viewportHeight) * itemProgress;
                    const x = (index % 2 ? 10 : -10) * itemProgress;
                    const rotation = (index % 2 ? 8 : -8) * itemProgress;

                    asset.style.opacity = '1';
                    asset.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
                    return;
                }

                const itemProgress = clamp((entryProgress - index * 0.055) / 0.7);
                const entryScale = isMobile ? 0.88 : 0.86;
                const entryOffset = getEntryOffset(assetFrames[index], sectionBox, isMobile);
                const y = entryOffset * (1 - itemProgress);
                const scale = entryScale + (1 - entryScale) * itemProgress;

                asset.style.opacity = String(itemProgress);
                asset.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
            });
        };

        let frameRequested = false;
        const requestUpdate = () => {
            if (frameRequested) return;

            frameRequested = true;
            requestAnimationFrame(() => {
                frameRequested = false;
                update();
            });
        };

        update();
        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);
        window.addEventListener('load', requestUpdate, { once: true });
    };

    const waitForHeroIntro = () => {
        if (document.body.classList.contains('is-loading') || document.getElementById('loader')) {
            window.setTimeout(waitForHeroIntro, 120);
            return;
        }

        init();
    };

    waitForHeroIntro();
})();

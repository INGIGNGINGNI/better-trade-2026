(() => {
    const section = document.querySelector('.topics-showcase');
    const assetStage = section?.querySelector('.topics-showcase__assets');
    const topics = section?.querySelector('.concept__topics');
    const assetFrames = [...(assetStage?.querySelectorAll('[data-topic-asset]') || [])];
    const assets = assetFrames.map(frame => frame.querySelector('.topics-showcase__asset-motion'));
    const floats = assetFrames.map(frame => frame.querySelector('.topics-showcase__asset-float'));

    if (!section || !assetStage || !topics || !assets.length || assets.some(asset => !asset)
        || !window.gsap || !window.ScrollTrigger) return;

    const clamp = value => Math.min(1, Math.max(0, value));

    const init = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        gsap.registerPlugin(ScrollTrigger);

        const idleTweens = floats.map((float, index) => {
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
        });

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

        const getFallDistance = (frame, isMobile) => {
            const sectionPaddingBottom = parseFloat(getComputedStyle(section).paddingBottom) || 0;
            const viewportFall = window.innerHeight * (isMobile ? 0.75 : 1.35);
            return assetStage.offsetHeight - frame.offsetTop + sectionPaddingBottom + viewportFall;
        };

        const media = gsap.matchMedia();

        media.add('(max-width: 767px)', () => {
            const entryTimeline = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: assetStage,
                    start: 'top 94%',
                    end: 'bottom 38%',
                    scrub: 0.75,
                    invalidateOnRefresh: true,
                },
            });

            assets.forEach((asset, index) => {
                entryTimeline.fromTo(asset, {
                    y: () => -(assetFrames[index].offsetTop + assetFrames[index].offsetHeight + 16),
                    opacity: 0,
                    scale: 0.88,
                }, {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.42,
                }, index * 0.07);
            });

            const exitTimeline = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: assetStage,
                    start: 'bottom 38%',
                    end: 'bottom -65%',
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });

            assets.forEach((asset, index) => {
                exitTimeline.fromTo(asset, {
                    y: 0,
                    x: 0,
                    rotation: 0,
                }, {
                    y: () => getFallDistance(assetFrames[index], true),
                    x: index % 2 ? 10 : -10,
                    rotation: index % 2 ? 8 : -8,
                    duration: 2,
                    ease: 'none',
                    immediateRender: false,
                }, 0.36 + index * 0.16);
            });

            return () => {
                entryTimeline.scrollTrigger?.kill();
                entryTimeline.kill();
                exitTimeline.scrollTrigger?.kill();
                exitTimeline.kill();
            };
        });

        media.add('(min-width: 768px)', () => {
            const getEntryProgress = viewportHeight => {
                const triggerBox = topics.getBoundingClientRect();
                const startLine = viewportHeight * 0.9;
                const endTop = viewportHeight * 0.5 - triggerBox.height * 0.5;

                return clamp((startLine - triggerBox.top) / Math.max(1, startLine - endTop));
            };

            const getExitProgress = viewportHeight => {
                const sectionBottom = section.getBoundingClientRect().bottom;
                return clamp((viewportHeight - sectionBottom) / Math.max(1, viewportHeight));
            };

            const update = () => {
                const viewportHeight = window.innerHeight;
                const sectionBox = section.getBoundingClientRect();
                const entryProgress = getEntryProgress(viewportHeight);
                const exitProgress = getExitProgress(viewportHeight);

                assets.forEach((asset, index) => {
                    const itemEntryProgress = clamp((entryProgress - index * 0.055) / 0.7);
                    const itemExitProgress = clamp((exitProgress - 0.08 - index * 0.045) / 0.64);
                    const frameBox = assetFrames[index].getBoundingClientRect();
                    const entryOffset = -(frameBox.top - sectionBox.top + frameBox.height + 24);
                    const entryY = entryOffset * (1 - itemEntryProgress);
                    const exitY = getFallDistance(assetFrames[index], false) * itemExitProgress;
                    const y = entryY + exitY;
                    const x = (index % 2 ? 10 : -10) * itemExitProgress;
                    const rotation = (index % 2 ? 8 : -8) * itemExitProgress;
                    const scale = 0.86 + 0.14 * itemEntryProgress;

                    asset.style.opacity = String(Math.max(itemEntryProgress, itemExitProgress));
                    asset.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
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

            return () => {
                window.removeEventListener('scroll', requestUpdate);
                window.removeEventListener('resize', requestUpdate);
            };
        });

        requestAnimationFrame(() => ScrollTrigger.refresh());
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

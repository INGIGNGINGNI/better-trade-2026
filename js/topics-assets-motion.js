(() => {
    const section = document.querySelector('.topics-showcase');
    const assetStage = section?.querySelector('.topics-showcase__assets');
    const topics = section?.querySelector('.concept__topics');
    const assetFrames = [...(assetStage?.querySelectorAll('[data-topic-asset]') || [])];
    const assets = assetFrames.map(frame => frame.querySelector('.topics-showcase__asset-motion'));
    const floats = assetFrames.map(frame => frame.querySelector('.topics-showcase__asset-float'));

    if (!section || !assetStage || !topics || !assets.length || !window.gsap || !window.ScrollTrigger) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const media = gsap.matchMedia();
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

    const getFallDistance = frame => {
        const sectionPaddingBottom = parseFloat(getComputedStyle(section).paddingBottom) || 0;
        const viewportFall = window.innerHeight * (window.innerWidth < 768 ? 0.75 : 1.35);
        return assetStage.offsetHeight - frame.offsetTop + sectionPaddingBottom + viewportFall;
    };

    const addFallTweens = timeline => {
        const holdBeforeFall = 0.36;

        assets.forEach((asset, index) => {
            timeline.fromTo(asset, {
                y: 0,
                x: 0,
                rotation: 0,
            }, {
                y: () => getFallDistance(assetFrames[index]),
                x: index % 2 ? 10 : -10,
                rotation: index % 2 ? 8 : -8,
                duration: 2,
                ease: 'none',
                immediateRender: false,
            }, holdBeforeFall + index * 0.16);
        });
    };

    media.add('(min-width: 768px)', () => {
        const entryTimeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: topics,
                start: 'top 90%',
                end: 'center center',
                scrub: true,
                invalidateOnRefresh: true,
            },
        });

        assets.forEach((asset, index) => {
            entryTimeline.fromTo(asset, {
                y: () => {
                    const sectionBox = section.getBoundingClientRect();
                    const frameBox = assetFrames[index].getBoundingClientRect();
                    return -(frameBox.top - sectionBox.top + frameBox.height + 24);
                },
                opacity: 0,
                scale: 0.86,
            }, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.42,
            }, index * 0.075);
        });

        const exitTimeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: topics,
                start: 'center center',
                endTrigger: section,
                end: 'bottom -30%',
                scrub: true,
                invalidateOnRefresh: true,
            },
        });

        addFallTweens(exitTimeline);

        return () => {
            entryTimeline.scrollTrigger?.kill();
            entryTimeline.kill();
            exitTimeline.scrollTrigger?.kill();
            exitTimeline.kill();
        };
    });

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

        addFallTweens(exitTimeline);

        return () => {
            entryTimeline.scrollTrigger?.kill();
            entryTimeline.kill();
            exitTimeline.scrollTrigger?.kill();
            exitTimeline.kill();
        };
    });

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
})();

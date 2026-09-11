(() => {
    const topicsSection = document.querySelector('.topics-showcase');
    const speakerOverview = document.querySelector('.speaker-overview');

    if (!topicsSection || !speakerOverview || !window.gsap || !window.ScrollTrigger) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const init = () => {
        if (reducedMotion.matches) return;

        gsap.registerPlugin(ScrollTrigger);

        let transition = null;
        let resizeTimer = 0;
        let resizeFrame = 0;
        let resizeProgress = null;
        let viewportWidth = document.documentElement.clientWidth;
        let viewportHeight = document.documentElement.clientHeight;

        const publishProgress = progress => {
            topicsSection.style.setProperty('--topic-speaker-transition-progress', String(progress));
            document.dispatchEvent(new CustomEvent('topic-speaker-transition:update'));
        };

        const buildTransition = () => {
            transition = ScrollTrigger.create({
                id: 'topic-speaker-transition',
                trigger: topicsSection,
                start: 'bottom bottom',
                end: () => `+=${document.documentElement.clientHeight}`,
                pin: topicsSection,
                pinSpacing: false,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onRefresh: self => publishProgress(self.progress),
                onUpdate: self => publishProgress(self.progress),
                onLeave: () => publishProgress(1),
                onLeaveBack: () => publishProgress(0),
            });
        };

        const rebuildForViewport = () => {
            resizeFrame = 0;

            /* A pinned element carries inline geometry from the viewport in which the
               pin was created. Kill it first so responsive CSS can lay out both
               sections using the new viewport before ScrollTrigger measures again. */
            transition?.kill();
            transition = null;
            buildTransition();
            ScrollTrigger.refresh();

            if (resizeProgress !== null) {
                const restoredScroll = transition.start
                    + (transition.end - transition.start) * resizeProgress;
                window.scrollTo(0, restoredScroll);
                ScrollTrigger.update();
            }

            publishProgress(transition.progress);
            resizeProgress = null;
        };

        const handleResize = () => {
            const nextWidth = document.documentElement.clientWidth;
            const nextHeight = document.documentElement.clientHeight;

            if (nextWidth === viewportWidth && nextHeight === viewportHeight) return;

            if (resizeProgress === null && transition) {
                const currentScroll = window.scrollY;
                const isInsideTransition = currentScroll >= transition.start - 1
                    && currentScroll <= transition.end + 1;
                resizeProgress = isInsideTransition ? transition.progress : null;
            }

            viewportWidth = nextWidth;
            viewportHeight = nextHeight;
            window.clearTimeout(resizeTimer);
            window.cancelAnimationFrame(resizeFrame);
            resizeTimer = window.setTimeout(() => {
                resizeFrame = window.requestAnimationFrame(rebuildForViewport);
            }, 160);
        };

        buildTransition();

        requestAnimationFrame(() => ScrollTrigger.refresh());

        window.addEventListener('resize', handleResize, { passive: true });
        window.visualViewport?.addEventListener('resize', handleResize, { passive: true });

        return () => {
            window.clearTimeout(resizeTimer);
            window.cancelAnimationFrame(resizeFrame);
            window.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('resize', handleResize);
            transition?.kill();
            topicsSection.style.removeProperty('--topic-speaker-transition-progress');
        };
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

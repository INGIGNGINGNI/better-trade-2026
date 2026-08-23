(() => {
    const cue = document.querySelector('[data-hero-scroll-cue]');
    if (!cue) return;

    const progressEvent = 'bettertrade:hero-run-progress';
    const cueEvent = 'bettertrade:hero-scroll-cue';
    const concept = document.getElementById('concept');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let heroRunMode = 'hidden';
    let heroRunProgress = 0;
    let heroCueReady = Boolean(window.__betterTradeHeroScrollCueVisible);

    function shouldHideCue() {
        const loading = document.body.classList.contains('is-loading');
        const conceptThreshold = concept
            ? concept.offsetTop - document.documentElement.clientHeight * 0.35
            : Number.POSITIVE_INFINITY;

        return loading
            || !heroCueReady
            || heroRunMode === 'ready'
            || heroRunProgress >= 0.985
            || window.scrollY >= conceptThreshold;
    }

    function render() {
        raf = 0;
        const hidden = shouldHideCue();
        cue.classList.toggle('is-hidden', hidden);
        cue.setAttribute('aria-hidden', hidden ? 'true' : 'false');
        cue.tabIndex = hidden ? -1 : 0;
    }

    function requestRender() {
        if (raf) return;
        raf = requestAnimationFrame(render);
    }

    window.addEventListener(progressEvent, event => {
        heroRunMode = event.detail?.mode || 'hidden';
        heroRunProgress = Number(event.detail?.progress) || 0;
        requestRender();
    });

    window.addEventListener(cueEvent, event => {
        heroCueReady = Boolean(event.detail?.visible);
        requestRender();
    });

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender);
    window.addEventListener('load', requestRender);

    const bodyObserver = new MutationObserver(requestRender);
    bodyObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });

    cue.addEventListener('click', () => {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
        const nextY = Math.min(maxScroll, window.scrollY + document.documentElement.clientHeight * 0.72);
        window.scrollTo({
            top: nextY,
            behavior: reducedMotion.matches ? 'auto' : 'smooth',
        });
    });

    requestRender();
})();

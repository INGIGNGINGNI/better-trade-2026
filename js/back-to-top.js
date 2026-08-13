(function () {
    const backToTop = document.querySelector('.back-to-top');
    if (!backToTop) return;

    const revealOffset = 520;
    const progressEvent = 'bettertrade:hero-run-progress';
    let rafId = null;
    let heroControlsButton = false;
    let currentState = { mode: 'hidden', progress: 0 };

    function render() {
        rafId = null;
        const isSuppressed = document.body.classList.contains('is-loading')
            || document.body.classList.contains('menu-open')
            || document.body.classList.contains('menu-closing');
        const isVisible = currentState.mode !== 'hidden' && !isSuppressed;
        const isProgress = currentState.mode === 'progress';
        const isReady = currentState.mode === 'ready';

        backToTop.classList.toggle('is-visible', isVisible);
        backToTop.classList.toggle('is-progress', isProgress);
        backToTop.classList.toggle('is-ready', isReady);
        backToTop.disabled = !isReady;
        backToTop.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
        backToTop.setAttribute(
            'aria-label',
            isProgress ? 'ความคืบหน้าช่วงเปิดเรื่อง' : 'กลับไปด้านบน'
        );
        backToTop.style.setProperty(
            '--back-to-top-progress',
            `${Math.round(currentState.progress * 360)}deg`
        );
    }

    function requestRender() {
        if (rafId) return;
        rafId = window.requestAnimationFrame(render);
    }

    function useFallbackState() {
        if (heroControlsButton) return;
        currentState = {
            mode: window.scrollY > revealOffset ? 'ready' : 'hidden',
            progress: window.scrollY > revealOffset ? 1 : 0,
        };
        requestRender();
    }

    backToTop.addEventListener('click', () => {
        if (currentState.mode !== 'ready') return;
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    window.addEventListener(progressEvent, event => {
        heroControlsButton = true;
        currentState = {
            mode: event.detail?.mode || 'hidden',
            progress: Number.isFinite(event.detail?.progress) ? event.detail.progress : 0,
        };
        requestRender();
    });

    const bodyClassObserver = new MutationObserver(requestRender);
    bodyClassObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });

    window.addEventListener('scroll', () => {
        if (heroControlsButton) {
            requestRender();
            return;
        }
        useFallbackState();
    }, { passive: true });
    window.addEventListener('resize', requestRender);
    window.addEventListener('load', useFallbackState);

    useFallbackState();
})();

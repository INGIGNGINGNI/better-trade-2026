(() => {
    const HERO_SKIP_NAVIGATION_EVENT = 'bettertrade:hero-skip-navigation';
    const SECTION_NAVIGATION_EVENT = 'bettertrade:section-navigation';

    /* Smooth scrolling is cancelled whenever something writes the scroll position
       while it is in flight. ScrollTrigger.refresh() does exactly that (it scrolls to 0
       to measure, then restores), and refreshes still happen after the first click:
       the window load event, sections initialising once the loader is gone, and the
       Hero rebuilding itself when the runner video is skipped. The scroll then stops
       wherever it was — usually right at the top of #concept — so the visitor had to
       click the menu a second time. After each navigation, wait for the scroll to
       settle and continue to the target if it did not arrive. */
    const LANDING_TOLERANCE = 2;
    const SETTLE_FRAMES = 8;
    const MAX_CORRECTIONS = 3;
    const MAX_WATCH_MS = 6000;
    const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

    let cancelLandingWatch = null;

    const scrollTargetIntoView = (target, behavior) => {
        try {
            target.scrollIntoView({ block: 'start', behavior });
        } catch {
            target.scrollIntoView(true);
        }
    };

    const hasLanded = (target) => {
        const scrollMarginTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const offset = target.getBoundingClientRect().top - scrollMarginTop;
        if (Math.abs(offset) <= LANDING_TOLERANCE) return true;

        /* A target near the end of the page cannot reach the top of the viewport. */
        const scrollingElement = document.scrollingElement || document.documentElement;
        const maxScrollY = scrollingElement.scrollHeight - scrollingElement.clientHeight;
        return offset > 0 && window.scrollY >= maxScrollY - LANDING_TOLERANCE;
    };

    const watchLanding = (target) => {
        cancelLandingWatch?.();

        const startedAt = performance.now();
        let corrections = 0;
        let stillFrames = 0;
        let lastScrollY = window.scrollY;
        let frame = 0;

        const stop = () => {
            window.cancelAnimationFrame(frame);
            USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stop, true));
            if (cancelLandingWatch === stop) cancelLandingWatch = null;
        };

        const tick = () => {
            if (performance.now() - startedAt > MAX_WATCH_MS) {
                stop();
                return;
            }

            const scrollY = window.scrollY;
            stillFrames = Math.abs(scrollY - lastScrollY) < 0.5 ? stillFrames + 1 : 0;
            lastScrollY = scrollY;

            if (stillFrames >= SETTLE_FRAMES) {
                if (hasLanded(target) || corrections >= MAX_CORRECTIONS) {
                    stop();
                    return;
                }

                /* Retry smoothly first; if that is interrupted as well, jump so the
                   visitor is never left short of the section they picked. */
                corrections += 1;
                stillFrames = 0;
                scrollTargetIntoView(target, corrections === MAX_CORRECTIONS ? 'instant' : 'smooth');
            }

            frame = window.requestAnimationFrame(tick);
        };

        /* Any input from the visitor means they have taken over the scroll. */
        USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stop, { capture: true, passive: true }));
        cancelLandingWatch = stop;
        frame = window.requestAnimationFrame(tick);
    };

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');

        /* Component-owned tabs/day switchers calculate their own sticky offsets.
           Let their local handlers scroll them so this generic anchor navigation
           does not immediately override the intended landing position. */
        if (!link || link.matches('[role="tab"], .agenda__day-switch, .speaker__day-switch')) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;

        const target = document.getElementById(hash.slice(1));
        if (!target) return;

        event.preventDefault();

        const navigate = () => {
            target.scrollIntoView({ block: 'start' });
            watchLanding(target);
            history.replaceState(null, '', window.location.pathname + window.location.search);
            window.dispatchEvent(new CustomEvent(SECTION_NAVIGATION_EVENT, {
                detail: { targetId: target.id },
            }));
        };

        /* Any in-page jump taken while the Hero is still pinned has to collapse the
           Hero timeline first, otherwise its pin distance keeps moving the destination
           while the scroll is in flight and the landing position ends up short. The
           Hero owns that decision and reports back through detail.handled. */
        const detail = { target, navigate, handled: false };
        window.dispatchEvent(new CustomEvent(HERO_SKIP_NAVIGATION_EVENT, { detail }));
        if (detail.handled) return;

        navigate();
    });
})();

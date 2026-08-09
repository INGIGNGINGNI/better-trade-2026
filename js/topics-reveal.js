(() => {
    const section = document.querySelector('.topics-showcase');
    if (!section) return;

    const header = section.querySelector('.topics-showcase__header');
    const topics = section.querySelector('.concept__topics');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
        return;
    }

    section.classList.add('is-reveal-ready');

    const headerObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        section.classList.add('is-header-visible');
        headerObserver.disconnect();
    }, {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px',
    });

    const topicsObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        section.classList.add('are-topics-visible');
        topicsObserver.disconnect();
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px',
    });

    headerObserver.observe(header);
    topicsObserver.observe(topics);
})();

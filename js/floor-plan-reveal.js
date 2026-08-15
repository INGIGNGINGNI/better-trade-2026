(() => {
    const section = document.querySelector('.floor-plan');
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = section.querySelectorAll('.floor-plan__callout-line');

    lines.forEach(line => {
        line.style.setProperty('--floor-plan-line-length', `${line.getTotalLength()}px`);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    section.classList.add('is-reveal-ready');

    const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;

        section.classList.add('is-visible');
        observer.disconnect();
    }, {
        threshold: 0.24,
        rootMargin: '0px 0px -8% 0px',
    });

    observer.observe(section.querySelector('.floor-plan__visual') || section);
})();

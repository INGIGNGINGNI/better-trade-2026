(() => {
    const revealSelector = [
        '.bt-section-title',
        '.bt-section-subtext',
        '.concept__description',
        '.topics-showcase__header p',
        '[data-reveal]',
    ].join(', ');
    const targets = Array.from(document.querySelectorAll(revealSelector));
    if (!targets.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
        targets.forEach(target => target.classList.add('is-revealed'));
        return;
    }

    document.body.classList.add('reveal-on-scroll-ready');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
    });

    targets.forEach((target) => {
        if (!target.hasAttribute('data-reveal')) {
            target.setAttribute('data-reveal', 'fade-up');
        }

        const delay = target.getAttribute('data-reveal-delay');
        if (delay) {
            target.style.setProperty('--reveal-delay', /^\d+$/.test(delay) ? `${delay}ms` : delay);
        } else if (target.classList.contains('bt-section-subtext')) {
            target.style.setProperty('--reveal-delay', '120ms');
        } else if (target.classList.contains('concept__description') || target.matches('.topics-showcase__header p')) {
            target.style.setProperty('--reveal-delay', '160ms');
        }

        observer.observe(target);
    });
})();

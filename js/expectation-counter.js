(() => {
    const stats = Array.from(document.querySelectorAll('.expectation__stat strong'));
    if (!stats.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counterPattern = /^([\d,]+)(.*)$/;
    const duration = 1400;

    const counters = stats
        .map(element => {
            const original = element.textContent.trim();
            const match = original.match(counterPattern);

            if (!match) return null;

            const value = Number(match[1].replace(/,/g, ''));
            const suffix = match[2] || '';

            element.dataset.counterValue = String(value);
            element.dataset.counterSuffix = suffix;
            element.dataset.counterOriginal = original;

            if (!reduceMotion) element.textContent = `0${suffix}`;

            return { element, value, suffix };
        })
        .filter(Boolean);

    if (!counters.length || reduceMotion) return;

    const formatNumber = value => Math.round(value).toLocaleString('en-US');
    const easeOutCubic = progress => 1 - Math.pow(1 - progress, 3);

    const runCounter = ({ element, value, suffix }, index) => {
        const startTime = performance.now();
        const delay = index * 90;

        const tick = now => {
            const elapsed = Math.max(0, now - startTime - delay);
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            element.textContent = `${formatNumber(value * eased)}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(tick);
            } else {
                element.textContent = `${formatNumber(value)}${suffix}`;
            }
        };

        window.requestAnimationFrame(tick);
    };

    const runAllCounters = () => {
        counters.forEach(runCounter);
    };

    if (!('IntersectionObserver' in window)) {
        runAllCounters();
        return;
    }

    const section = document.querySelector('.expectation');
    const observer = new IntersectionObserver(entries => {
        const isVisible = entries.some(entry => entry.isIntersecting);
        if (!isVisible) return;

        observer.disconnect();
        runAllCounters();
    }, {
        threshold: 0.35,
    });

    observer.observe(section || counters[0].element);
})();

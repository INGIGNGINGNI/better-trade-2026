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

            // นับเฉพาะ text node ของตัวเลข ส่วนต่อท้าย (เช่น +) อยู่ใน span แยกเพื่อให้ CSS แต่งสีได้
            const numberNode = document.createTextNode(reduceMotion ? match[1] : '0');
            const suffixElement = document.createElement('span');
            suffixElement.className = 'expectation__stat-suffix';
            suffixElement.textContent = suffix;
            element.replaceChildren(numberNode, ...(suffix ? [suffixElement] : []));

            return { element, value, numberNode };
        })
        .filter(Boolean);

    if (!counters.length || reduceMotion) return;

    const formatNumber = value => Math.round(value).toLocaleString('en-US');
    const easeOutCubic = progress => 1 - Math.pow(1 - progress, 3);

    const runCounter = ({ value, numberNode }, index) => {
        const startTime = performance.now();
        const delay = index * 90;

        const tick = now => {
            const elapsed = Math.max(0, now - startTime - delay);
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            numberNode.nodeValue = formatNumber(value * eased);

            if (progress < 1) {
                window.requestAnimationFrame(tick);
            } else {
                numberNode.nodeValue = formatNumber(value);
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

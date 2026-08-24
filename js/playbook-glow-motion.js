(() => {
    const section = document.querySelector('.playbook');

    if (!section) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reducedMotion.matches) return;

    const observer = new IntersectionObserver(([entry]) => {
        section.classList.toggle('playbook--glow-running', entry.isIntersecting && !document.hidden);
    }, { threshold: 0.04 });

    const handleVisibilityChange = () => {
        if (document.hidden) {
            section.classList.remove('playbook--glow-running');
            return;
        }

        const sectionBox = section.getBoundingClientRect();
        const isVisible = sectionBox.bottom > 0 && sectionBox.top < window.innerHeight;
        section.classList.toggle('playbook--glow-running', isVisible);
    };

    observer.observe(section);
    document.addEventListener('visibilitychange', handleVisibilityChange);
})();

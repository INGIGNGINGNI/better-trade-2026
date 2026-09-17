(() => {
    const panel = document.querySelector('[data-early-bird-float]');
    const toggle = panel?.querySelector('[data-early-bird-toggle]');
    const content = panel?.querySelector('[data-early-bird-content]');
    if (!panel || !toggle || !content) return;

    const root = document.documentElement;

    const syncHeight = () => {
        root.style.setProperty('--early-bird-float-height', `${Math.ceil(panel.getBoundingClientRect().height)}px`);
    };

    const setCollapsed = collapsed => {
        panel.classList.toggle('is-collapsed', collapsed);
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'ขยายรายละเอียด Early Bird' : 'ย่อรายละเอียด Early Bird');
        content.setAttribute('aria-hidden', String(collapsed));
        content.inert = collapsed;
        window.requestAnimationFrame(syncHeight);
    };

    toggle.addEventListener('click', () => {
        setCollapsed(!panel.classList.contains('is-collapsed'));
    });

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(syncHeight);
        resizeObserver.observe(panel);
    }

    window.addEventListener('resize', syncHeight);
    window.addEventListener('load', syncHeight);
    setCollapsed(false);
})();

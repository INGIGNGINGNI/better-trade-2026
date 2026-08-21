/* Parallax เบา ๆ ให้ภาพพื้นหลังของ section ticket เลื่อนช้ากว่าการ scroll ปกติ */
(() => {
    const clip = document.querySelector('.ticket__backdrop-clip');
    const backdrop = clip?.querySelector('.ticket__backdrop');
    if (!clip || !backdrop) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const getBleed = () => {
        const clipHeight = clip.getBoundingClientRect().height;
        const backdropHeight = backdrop.getBoundingClientRect().height;
        return Math.max(0, (backdropHeight - clipHeight) / 2);
    };

    let ticking = false;

    const update = () => {
        ticking = false;
        const rect = clip.getBoundingClientRect();
        const range = window.innerHeight + rect.height;
        const progress = range > 0
            ? Math.min(1, Math.max(0, (window.innerHeight - rect.top) / range))
            : 0;
        const bleed = getBleed();
        const y = -bleed + (bleed * 2 * progress);

        backdrop.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('load', update, { once: true });
})();

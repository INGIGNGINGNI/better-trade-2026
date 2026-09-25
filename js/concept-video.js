(() => {
    const media = document.querySelector('[data-concept-video]');
    const poster = media?.querySelector('.concept__video-poster');
    const iframe = media?.querySelector('iframe[data-src]');

    if (!media || !poster || !iframe) return;

    poster.addEventListener('click', () => {
        if (!iframe.src) {
            iframe.src = iframe.dataset.src || '';
        }

        media.classList.add('is-video-playing');
    });
})();

/* กรอบวิดีโอเอียงแล้วค่อยตั้งตรงตาม scroll (ย้ายมาจาก hero-v2-scroll-motion.js เดิม)
   progress 0 เมื่อขอบบนกรอบอยู่ที่ 92% ของจอ ถึง 1 ที่ 48% */
(() => {
    const scrollBox = document.querySelector('.concept__video-scroll');
    const frame = document.querySelector('.concept__video-frame');
    if (!scrollBox || !frame) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frameRequested = false;

    const update = () => {
        frameRequested = false;

        const vh = document.documentElement.clientHeight;
        const startLine = vh * 0.92;
        const endLine = vh * 0.48;
        const top = scrollBox.getBoundingClientRect().top;
        const progress = Math.min(1, Math.max(0, (startLine - top) / Math.max(1, startLine - endLine)));
        const isMobile = document.documentElement.clientWidth <= 768;
        const fromRotateX = isMobile ? 12 : 20;
        const fromScale = isMobile ? 0.94 : 0.90;
        const fromY = isMobile ? 56 : 96;

        frame.style.transform = `translate3d(0, ${fromY * (1 - progress)}px, 0)`
            + ` rotateX(${fromRotateX * (1 - progress)}deg)`
            + ` scale(${fromScale + (1 - fromScale) * progress})`;
    };

    const requestUpdate = () => {
        if (frameRequested) return;
        frameRequested = true;
        requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
})();

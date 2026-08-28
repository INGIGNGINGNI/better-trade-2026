/* แถบปุ่มลอยชิดขอบล่างสำหรับจอ <=575px เท่านั้น (ดู .mobile-cta-bar ใน style.css)
   เตรียมสถานะแสดงไว้ตั้งแต่ Hero และให้ CSS เปิดแถบจริงทันทีที่ loading screen ปิด
   ส่วนจอที่กว้างกว่า 575px ยังคงซ่อนเหมือนเดิม */
(() => {
    const bar = document.getElementById('mobile-cta-bar');
    if (!bar) return;

    const mobileQuery = window.matchMedia('(max-width: 575px)');
    let frameId = null;

    function render() {
        frameId = null;
        bar.classList.toggle('is-visible', mobileQuery.matches);
    }

    function requestRender() {
        if (frameId !== null) return;
        frameId = window.requestAnimationFrame(render);
    }

    window.addEventListener('resize', requestRender);
    window.addEventListener('load', requestRender);
    document.fonts?.ready.then(requestRender);
    mobileQuery.addEventListener('change', requestRender);

    const bodyClassObserver = new MutationObserver(requestRender);
    bodyClassObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });

    requestRender();
})();

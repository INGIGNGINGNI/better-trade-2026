/* แถบปุ่มลอยชิดขอบล่างสำหรับจอ <=575px เท่านั้น (ดู .mobile-cta-bar ใน style.css)
   โชว์เมื่อ hero เลื่อนออกไปจนหมดแล้ว (ขอบบนของ concept ถึงขอบบนของจอ) แล้วโชว์ต่อไป
   จนสุดหน้า ไม่ใช่แค่ตอนที่ concept อยู่ในจอ — เป็นสถานะ toggle ทางเดียว

   วัด concept.getBoundingClientRect().top สด ๆ ทุกครั้งที่ render ไม่ cache ตำแหน่งไว้
   ล่วงหน้าแบบ journey-indicator.js เพราะ hero โหมด mobile-static ปรับความสูงจริงหลัง
   วิดีโอ/รูปโหลดเสร็จ (อาจช้ากว่า load/fonts.ready) ถ้า cache ไว้ก่อนแล้วพลาดจังหวะที่
   ความสูงเปลี่ยน ตำแหน่งที่จำไว้จะเพี้ยนไปจากของจริงถาวร วัดสดทุกครั้งจึงชัวร์กว่า */
(() => {
    const bar = document.getElementById('mobile-cta-bar');
    const concept = document.getElementById('concept');
    if (!bar || !concept) return;

    const mobileQuery = window.matchMedia('(max-width: 575px)');
    let frameId = null;

    function render() {
        frameId = null;
        const shouldShow = mobileQuery.matches && concept.getBoundingClientRect().top <= 0;

        bar.classList.toggle('is-visible', shouldShow);
    }

    function requestRender() {
        if (frameId !== null) return;
        frameId = window.requestAnimationFrame(render);
    }

    window.addEventListener('scroll', requestRender, { passive: true });
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

(() => {
    const sliders = document.querySelectorAll('[data-past-event-swiper]');

    if (!sliders.length || typeof Swiper === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ภาพในแถบเลื่อนอัตโนมัติ: loading="lazy" ของเบราว์เซอร์โหลดทีละภาพตอนเลื่อนเข้าใกล้จอ
       เน็ตช้าจะเห็นกรอบว่างวิ่งเข้ามา จึงสั่งโหลดทุกภาพพร้อมกันตั้งแต่ section ยังอยู่ห่างจอ ~1 หน้าจอ
       (ยังไม่แย่งเน็ตตอนเปิดหน้า เพราะ section อยู่ลึกลงไป) */
    const loadAllImages = (slider) => {
        slider.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    };
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                loadAllImages(entry.target);
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '100% 0px' });
        sliders.forEach((slider) => observer.observe(slider));
    } else {
        sliders.forEach(loadAllImages);
    }

    sliders.forEach((slider) => {
        new Swiper(slider, {
            slidesPerView: 'auto',
            slidesPerGroup: 1,
            spaceBetween: 24,
            loop: true,
            speed: reducedMotion.matches ? 300 : 6000,
            allowTouchMove: true,
            grabCursor: true,
            autoplay: reducedMotion.matches
                ? false
                : {
                    delay: 0,
                    disableOnInteraction: false,
                },
            breakpoints: {
                0: {
                    spaceBetween: 12,
                },
                576: {
                    spaceBetween: 16,
                },
                768: {
                    spaceBetween: 24,
                },
            },
        });
    });
})();

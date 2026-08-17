(() => {
    const sliders = document.querySelectorAll('[data-past-event-swiper]');

    if (!sliders.length || typeof Swiper === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

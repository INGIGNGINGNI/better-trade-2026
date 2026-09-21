/* Header ของหน้าย่อยที่ไม่มี hero แบบ scroll-pin (เช่น personalized-playbook.html)
   แยกจาก hero-v2-header.js เพราะไฟล์นั้นอ่านระยะ scroll จาก #scroller ของ hero หน้าแรก
   ถ้าหน้าไหนไม่มี element นั้นจะ error ตั้งแต่บรรทัดแรกที่เรียกใช้ */
(() => {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.site-header__toggle');
    const backdrop = document.querySelector('.site-header__backdrop');
    const mobileMenu = document.getElementById('site-mobile-menu');

    if (!header || !toggle || !backdrop || !mobileMenu) return;

    const mobileLinks = document.querySelectorAll('.site-header__mobile a');
    const STICKY_AT = 8;
    const MENU_CLOSE_DURATION = 840;
    let menuCloseTimer = null;

    const updateSticky = () => {
        header.classList.toggle('is-sticky', window.scrollY > STICKY_AT);
    };

    const finishMenuClose = () => {
        if (document.body.classList.contains('menu-open')) return;
        document.body.classList.remove('menu-closing');
        clearTimeout(menuCloseTimer);
        menuCloseTimer = null;
    };

    const setMenu = open => {
        clearTimeout(menuCloseTimer);

        if (open) {
            document.body.classList.remove('menu-closing');
            document.body.classList.add('menu-open');
        } else {
            const wasOpen = document.body.classList.contains('menu-open');
            document.body.classList.remove('menu-open');

            if (wasOpen && document.documentElement.clientWidth <= 991) {
                document.body.classList.add('menu-closing');
                menuCloseTimer = setTimeout(finishMenuClose, MENU_CLOSE_DURATION);
            } else {
                finishMenuClose();
            }
        }

        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
        mobileMenu.setAttribute('aria-hidden', String(!open));
    };

    /* โลโก้และเมนูเป็นเวอร์ชันพื้นมืดเฉพาะตอนที่ section ที่ติด data-header-theme="dark"
       อยู่ใต้แถบ header พอดี วัดด้วยเส้นบาง ๆ ที่ขอบล่างของ header ผ่าน rootMargin */
    const setupThemeObserver = () => {
        const darkSections = document.querySelectorAll('[data-header-theme="dark"]');
        if (!darkSections.length) return () => {};

        const activeDark = new Set();
        const headerHeight = header.offsetHeight || 80;
        const bandBottom = Math.max(0, document.documentElement.clientHeight - headerHeight - 1);
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) activeDark.add(entry.target);
                else activeDark.delete(entry.target);
            });
            header.classList.toggle('site-header--on-dark', activeDark.size > 0);
        }, { rootMargin: `-${headerHeight}px 0px -${bandBottom}px 0px` });

        darkSections.forEach(section => observer.observe(section));
        return () => observer.disconnect();
    };

    let disconnectThemeObserver = setupThemeObserver();

    updateSticky();

    toggle.addEventListener('click', () => {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    backdrop.addEventListener('click', () => setMenu(false));
    mobileLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
    backdrop.addEventListener('transitionend', event => {
        if (event.target === backdrop && event.propertyName === 'clip-path') {
            finishMenuClose();
        }
    });

    document.addEventListener('keydown', event => {
        const menuOpen = toggle.getAttribute('aria-expanded') === 'true';
        if (!menuOpen) return;

        if (event.key === 'Escape') {
            setMenu(false);
            toggle.focus();
            return;
        }

        if (event.key === 'Tab') {
            const focusable = [
                ...header.querySelectorAll('a[href], button:not([disabled])'),
                ...mobileMenu.querySelectorAll('a[href], button:not([disabled])'),
            ].filter(element => element.offsetParent !== null);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', () => {
        if (document.documentElement.clientWidth > 991) setMenu(false);
        updateSticky();
        disconnectThemeObserver();
        disconnectThemeObserver = setupThemeObserver();
    });
})();

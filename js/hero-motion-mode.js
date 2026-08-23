(() => {
    const MODE_PARAM = 'hero';
    const RESET_SCROLL_KEY = 'bettertrade:hero-mode-reset-scroll';
    const params = new URLSearchParams(window.location.search);
    const mode = params.get(MODE_PARAM) === 'basic' ? 'basic' : 'full';
    const picker = document.querySelector('[data-hero-motion-picker]');

    window.__betterTradeHeroMotionMode = mode;
    document.documentElement.dataset.heroMotion = mode;

    if (sessionStorage.getItem(RESET_SCROLL_KEY) === '1') {
        sessionStorage.removeItem(RESET_SCROLL_KEY);
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
        window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });
    }

    if (!picker) return;

    const trigger = picker.querySelector('[data-hero-motion-trigger]');
    const panel = picker.querySelector('[data-hero-motion-panel]');
    const options = [...picker.querySelectorAll('[data-hero-motion-option]')];

    function setOpen(open) {
        picker.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));
        options.forEach(option => {
            option.tabIndex = open ? 0 : -1;
        });
        if (open) {
            options.find(option => option.dataset.heroMotionOption === mode)?.focus();
        }
    }

    options.forEach(option => {
        const optionMode = option.dataset.heroMotionOption;
        const selected = optionMode === mode;
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-pressed', String(selected));

        option.addEventListener('click', () => {
            if (selected) {
                setOpen(false);
                trigger.focus();
                return;
            }

            const url = new URL(window.location.href);
            url.searchParams.set(MODE_PARAM, optionMode);
            url.hash = '';
            sessionStorage.setItem(RESET_SCROLL_KEY, '1');
            window.location.assign(url.toString());
        });
    });

    trigger.setAttribute(
        'aria-label',
        `เลือก Hero motion ขณะนี้เป็น ${mode === 'full' ? 'Full Motion' : 'Basic Motion'}`
    );
    setOpen(false);
    trigger.addEventListener('click', () => {
        setOpen(!picker.classList.contains('is-open'));
    });

    document.addEventListener('pointerdown', event => {
        if (!picker.classList.contains('is-open') || picker.contains(event.target)) return;
        setOpen(false);
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !picker.classList.contains('is-open')) return;
        setOpen(false);
        trigger.focus();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1199) setOpen(false);
    });
})();

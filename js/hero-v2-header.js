        const siteHeaderToggle = document.querySelector('.site-header__toggle');
        const siteHeader = document.querySelector('.site-header');
        const siteHeaderBackdrop = document.querySelector('.site-header__backdrop');
        const siteHeaderMobileLinks = document.querySelectorAll('.site-header__mobile a');
        const siteHeaderNavLinks = [...document.querySelectorAll('.site-header__nav a')];
        const siteHeaderContrastLabels = document.getElementById('site-header-contrast-labels');
        const supportsDynamicContrast = CSS.supports('mix-blend-mode', 'luminosity')
            && CSS.supports('filter', 'invert(1) grayscale(1) brightness(1.3) contrast(9000)');
        const contrastLabels = supportsDynamicContrast
            ? siteHeaderNavLinks.map(link => {
                const label = document.createElement('span');
                label.className = 'site-header__contrast-label';
                label.textContent = link.textContent.trim();
                siteHeaderContrastLabels.appendChild(label);
                return label;
            })
            : [];

        function syncHeaderContrastLabels() {
            const enabled = supportsDynamicContrast && window.innerWidth > 991;
            document.body.classList.toggle('has-dynamic-nav-contrast', enabled);
            if (!enabled) return;

            siteHeaderNavLinks.forEach((link, index) => {
                const rect = link.getBoundingClientRect();
                const label = contrastLabels[index];
                label.style.left = `${rect.left}px`;
                label.style.top = `${rect.top}px`;
                label.style.width = `${rect.width}px`;
                label.style.height = `${rect.height}px`;
            });
        }

        // Kept for buildScroll()'s wallCloseAt (the ship-channel seal timing) in the hero
        // script further down — unrelated to the header, just reusing the same formula.
        function getHeroStickyThreshold(heroScrollDistance, viewportHeight) {
            return Math.max(620, viewportHeight * 0.75, heroScrollDistance * 0.46);
        }

        function getHeroScrollDistance() {
            const scroller = document.getElementById('scroller');
            return Math.max(1, scroller.offsetHeight - window.innerHeight);
        }

        // Three phases over the hero's scroll-pin, by scroll position:
        //  1. visible   — from the top until the CTA/date/venue block has faded out
        //  2. hidden    — through the rest of the ship/wall/runner sequence
        //  3. sticky    — visible again only once the pin has fully released into #concept
        const HEADER_HIDE_AT_RATIO = 0.12;
        const HEADER_STICKY_BUFFER = 4;

        function updateSiteHeader() {
            const heroScrollDistance = getHeroScrollDistance();
            const hideAt = heroScrollDistance * HEADER_HIDE_AT_RATIO;
            const stickyAt = Math.max(0, heroScrollDistance - HEADER_STICKY_BUFFER);
            const y = window.scrollY;

            const hidden = y >= hideAt && y < stickyAt;
            siteHeader.classList.toggle('is-hidden', hidden);
            siteHeaderContrastLabels.classList.toggle('is-hidden', hidden);
        }

        function setSiteMenu(open) {
            document.body.classList.toggle('menu-open', open);
            siteHeaderToggle.setAttribute('aria-expanded', String(open));
            siteHeaderToggle.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
        }

        /* Logo/nav default dark; flip to .site-header--on-dark only while a section
           tagged data-header-theme="dark" sits behind the header. A thin sensor line at
           the header's own bottom edge (via rootMargin) tells us which section that is,
           instead of guessing from backdrop color. */
        function setupHeaderThemeObserver() {
            const darkSections = document.querySelectorAll('[data-header-theme="dark"]');
            if (!darkSections.length) return () => {};

            const activeDark = new Set();
            const applyTheme = () => {
                const onDark = activeDark.size > 0;
                siteHeader.classList.toggle('site-header--on-dark', onDark);
                siteHeaderContrastLabels.style.setProperty('--bg-color', onDark ? '#0d0f14' : '#9ccbf6');
            };

            const headerHeight = siteHeader.offsetHeight || 80;
            const bandBottom = Math.max(0, window.innerHeight - headerHeight - 1);
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) activeDark.add(entry.target);
                    else activeDark.delete(entry.target);
                });
                applyTheme();
            }, { rootMargin: `-${headerHeight}px 0px -${bandBottom}px 0px` });

            darkSections.forEach(section => observer.observe(section));
            return () => observer.disconnect();
        }

        let disconnectHeaderThemeObserver = setupHeaderThemeObserver();

        siteHeaderToggle.addEventListener('click', () => {
            setSiteMenu(siteHeaderToggle.getAttribute('aria-expanded') !== 'true');
        });
        siteHeaderBackdrop.addEventListener('click', () => setSiteMenu(false));
        siteHeaderMobileLinks.forEach(link => link.addEventListener('click', () => setSiteMenu(false)));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setSiteMenu(false);
        });
        window.addEventListener('scroll', updateSiteHeader, { passive: true });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 991) setSiteMenu(false);
            updateSiteHeader();
            syncHeaderContrastLabels();
            disconnectHeaderThemeObserver();
            disconnectHeaderThemeObserver = setupHeaderThemeObserver();
        });
        if (document.fonts) document.fonts.ready.then(syncHeaderContrastLabels);
        syncHeaderContrastLabels();
        updateSiteHeader();
    

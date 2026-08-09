        const siteHeaderToggle = document.querySelector('.site-header__toggle');
        const siteHeader = document.querySelector('.site-header');
        const siteHeaderBackdrop = document.querySelector('.site-header__backdrop');
        const siteHeaderMobile = document.getElementById('site-mobile-menu');
        const siteHeaderMobileLinks = document.querySelectorAll('.site-header__mobile a');
        const siteHeaderDesktopLinks = [...document.querySelectorAll('.site-header__nav a[href^="#"]')];
        let menuCloseTimer = null;

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
            if (document.body.classList.contains('menu-open') || document.body.classList.contains('menu-closing')) {
                siteHeader.classList.remove('is-hidden');
                return;
            }

            const heroScrollDistance = getHeroScrollDistance();
            const hideAt = heroScrollDistance * HEADER_HIDE_AT_RATIO;
            const stickyAt = Math.max(0, heroScrollDistance - HEADER_STICKY_BUFFER);
            const y = window.scrollY;

            const hidden = y >= hideAt && y < stickyAt;
            siteHeader.classList.toggle('is-hidden', hidden);
        }

        function finishSiteMenuClose() {
            if (document.body.classList.contains('menu-open')) return;
            document.body.classList.remove('menu-closing');
            clearTimeout(menuCloseTimer);
            menuCloseTimer = null;
            updateSiteHeader();
        }

        function setSiteMenu(open) {
            clearTimeout(menuCloseTimer);

            if (open) {
                document.body.classList.remove('menu-closing');
                siteHeader.classList.remove('is-hidden');
                document.body.classList.add('menu-open');
            } else {
                const wasOpen = document.body.classList.contains('menu-open');
                document.body.classList.remove('menu-open');

                if (wasOpen && window.innerWidth <= 991) {
                    document.body.classList.add('menu-closing');
                    menuCloseTimer = setTimeout(finishSiteMenuClose, 840);
                } else {
                    finishSiteMenuClose();
                }
            }

            siteHeaderToggle.setAttribute('aria-expanded', String(open));
            siteHeaderToggle.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
            siteHeaderMobile.setAttribute('aria-hidden', String(!open));
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

        function setupDesktopNavActiveState() {
            const entries = siteHeaderDesktopLinks
                .map(link => {
                    const id = link.getAttribute('href')?.slice(1);
                    const section = id ? document.getElementById(id) : null;
                    return section ? { link, section } : null;
                })
                .filter(Boolean);

            if (!entries.length) return () => {};

            let activeLink = null;
            let ticking = false;

            const setActiveLink = nextLink => {
                if (activeLink === nextLink) return;
                siteHeaderDesktopLinks.forEach(link => {
                    if (link === nextLink) {
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
                activeLink = nextLink;
            };

            const updateActiveLink = () => {
                ticking = false;

                const probeY = window.scrollY + (siteHeader.offsetHeight || 80) + 8;
                let nextEntry = entries[0];

                entries.forEach(entry => {
                    const sectionTop = entry.section.getBoundingClientRect().top + window.scrollY;
                    if (sectionTop <= probeY) {
                        nextEntry = entry;
                    }
                });

                setActiveLink(nextEntry.link);
            };

            const requestUpdate = () => {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(updateActiveLink);
            };

            updateActiveLink();
            window.addEventListener('scroll', requestUpdate, { passive: true });
            window.addEventListener('resize', requestUpdate);

            return () => {
                window.removeEventListener('scroll', requestUpdate);
                window.removeEventListener('resize', requestUpdate);
            };
        }

        let disconnectHeaderThemeObserver = setupHeaderThemeObserver();
        const disconnectDesktopNavActiveState = setupDesktopNavActiveState();

        siteHeaderToggle.addEventListener('click', () => {
            setSiteMenu(siteHeaderToggle.getAttribute('aria-expanded') !== 'true');
        });
        siteHeaderBackdrop.addEventListener('click', () => setSiteMenu(false));
        siteHeaderMobileLinks.forEach(link => link.addEventListener('click', () => setSiteMenu(false)));
        siteHeaderBackdrop.addEventListener('transitionend', event => {
            if (event.target === siteHeaderBackdrop && event.propertyName === 'clip-path') {
                finishSiteMenuClose();
            }
        });
        document.addEventListener('keydown', event => {
            const menuOpen = siteHeaderToggle.getAttribute('aria-expanded') === 'true';

            if (event.key === 'Escape' && menuOpen) {
                setSiteMenu(false);
                siteHeaderToggle.focus();
                return;
            }

            if (event.key === 'Tab' && menuOpen) {
                const focusable = [
                    ...siteHeader.querySelectorAll('a[href], button:not([disabled])'),
                    ...siteHeaderMobile.querySelectorAll('a[href], button:not([disabled])')
                ]
                    .filter(element => element.offsetParent !== null);
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
        window.addEventListener('scroll', updateSiteHeader, { passive: true });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 991) setSiteMenu(false);
            updateSiteHeader();
            disconnectHeaderThemeObserver();
            disconnectHeaderThemeObserver = setupHeaderThemeObserver();
        });
        window.addEventListener('beforeunload', disconnectDesktopNavActiveState, { once: true });
        updateSiteHeader();
    

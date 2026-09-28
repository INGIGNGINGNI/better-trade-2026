        const siteHeaderToggle = document.querySelector('.site-header__toggle');
        const siteHeader = document.querySelector('.site-header');
        const siteHeaderBackdrop = document.querySelector('.site-header__backdrop');
        const siteHeaderMobile = document.getElementById('site-mobile-menu');
        const siteHeaderMobileLinks = document.querySelectorAll('.site-header__mobile a');
        const siteHeaderDesktopLinks = [...document.querySelectorAll('.site-header__nav a[href^="#"]')];
        let menuCloseTimer = null;

        // Hero ใหม่เป็น section ธรรมดา (ไม่มี scroll-pin แล้ว) header จึงเหลือสองสถานะ
        // ตามระยะ scroll เหมือน page-header.js: บนสุดโปร่งทับท้องฟ้า เลื่อนลงแล้วเป็น sticky
        const HEADER_STICKY_AT = 8;

        function setHeaderSticky(sticky) {
            siteHeader.classList.toggle('is-sticky', sticky);
        }

        function updateSiteHeader() {
            const sticky = window.scrollY > HEADER_STICKY_AT;
            setHeaderSticky(sticky);
            // ท้องฟ้าชุดสว่างอยู่หลัง header เฉพาะตอนยังไม่ sticky (เมนูตัวดำไม่มีเงา ดู .site-header--hero-sky)
            siteHeader.classList.toggle('site-header--hero-sky', !sticky);
            siteHeader.classList.remove('is-hidden');
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

                if (wasOpen && document.documentElement.clientWidth <= 991) {
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
            const bandBottom = Math.max(0, document.documentElement.clientHeight - headerHeight - 1);
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
            const SECTION_NAVIGATION_EVENT = 'bettertrade:section-navigation';
            const FAQ_TAB_CHANGE_EVENT = 'bettertrade:faq-tab-change';
            const entries = siteHeaderDesktopLinks
                .map(link => {
                    const id = link.getAttribute('href')?.slice(1);
                    /* #home is a zero-height anchor immediately before the hero. Use
                       the hero section itself as Home's observable section instead. */
                    const section = id === 'home'
                        ? document.getElementById('hero')
                        : (id ? document.getElementById(id) : null);
                    return section ? { id, link, section } : null;
                })
                .filter(Boolean);

            if (!entries.length) return () => {};

            let activeLink = null;
            let ticking = false;
            let suppressContactUntilUserScroll = false;

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

                const headerProbeOffset = (siteHeader.offsetHeight || 80) + 8;
                const visibleEntry = entries.find(entry => {
                    const rect = entry.section.getBoundingClientRect();
                    return rect.top <= headerProbeOffset && rect.bottom > headerProbeOffset;
                });

                if (visibleEntry) {
                    setActiveLink(visibleEntry.link);
                    return;
                }

                /* Contact uses a later activation point because the footer can be
                   visible beneath a short FAQ panel while the user is still reading
                   the FAQ. Activate it only once the footer reaches mid-viewport. */
                const contactEntry = entries.find(entry => entry.id === 'contact');
                const contactRect = contactEntry?.section.getBoundingClientRect();
                const contactActivationY = document.documentElement.clientHeight * 0.5;
                const maxScrollY = Math.max(
                    0,
                    document.documentElement.scrollHeight - document.documentElement.clientHeight
                );
                const isAtPageEnd = window.scrollY >= maxScrollY - 2;

                if (
                    !suppressContactUntilUserScroll
                    && contactEntry
                    && (
                        (
                            contactRect.top <= contactActivationY
                            && contactRect.bottom > contactActivationY
                        )
                        || isAtPageEnd
                    )
                ) {
                    setActiveLink(contactEntry.link);
                    return;
                }

                /* The current section has no matching header item. */
                setActiveLink(null);
            };

            const requestUpdate = () => {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(updateActiveLink);
            };

            updateActiveLink();
            window.addEventListener('scroll', requestUpdate, { passive: true });
            window.addEventListener('resize', requestUpdate);

            const allowContactActivation = () => {
                if (!suppressContactUntilUserScroll) return;
                suppressContactUntilUserScroll = false;
                requestUpdate();
            };
            const allowContactActivationFromKeyboard = event => {
                if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return;
                allowContactActivation();
            };
            const suppressContactAfterFaqTabChange = () => {
                suppressContactUntilUserScroll = true;
                requestUpdate();
            };

            window.addEventListener('wheel', allowContactActivation, { passive: true });
            window.addEventListener('touchstart', allowContactActivation, { passive: true });
            window.addEventListener('keydown', allowContactActivationFromKeyboard);
            window.addEventListener(FAQ_TAB_CHANGE_EVENT, suppressContactAfterFaqTabChange);
            const syncToNavigationTarget = event => {
                const nextEntry = entries.find(entry => entry.section.id === event.detail?.targetId);
                if (!nextEntry) return;
                setActiveLink(nextEntry.link);
                requestUpdate();
            };
            window.addEventListener(SECTION_NAVIGATION_EVENT, syncToNavigationTarget);

            return () => {
                window.removeEventListener('scroll', requestUpdate);
                window.removeEventListener('resize', requestUpdate);
                window.removeEventListener('wheel', allowContactActivation);
                window.removeEventListener('touchstart', allowContactActivation);
                window.removeEventListener('keydown', allowContactActivationFromKeyboard);
                window.removeEventListener(FAQ_TAB_CHANGE_EVENT, suppressContactAfterFaqTabChange);
                window.removeEventListener(SECTION_NAVIGATION_EVENT, syncToNavigationTarget);
            };
        }

        updateSiteHeader();

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
            if (document.documentElement.clientWidth > 991) setSiteMenu(false);
            updateSiteHeader();
            disconnectHeaderThemeObserver();
            disconnectHeaderThemeObserver = setupHeaderThemeObserver();
        });
        window.addEventListener('beforeunload', disconnectDesktopNavActiveState, { once: true });
    

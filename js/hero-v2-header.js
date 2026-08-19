        const siteHeaderToggle = document.querySelector('.site-header__toggle');
        const siteHeader = document.querySelector('.site-header');
        const siteHeaderInner = siteHeader?.querySelector('.site-header__inner');
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
            // document.documentElement.clientHeight ไม่ใช่ window.innerHeight เพราะหลัง
            // resize จอ (เช่นลาก DevTools responsive mode พร้อมเปลี่ยน DPR) window.innerHeight
            // เคยเจอค่าติดค้างจากขนาดก่อนหน้าโดยไม่อัปเดตตาม แต่ clientHeight ยังอ่านตรงกับ
            // เลย์เอาต์จริงเสมอ ค่าติดค้างทำให้ heroScrollDistance ใกล้ 0 จนขอบ sticky กลาย
            // เป็น 0 ไปด้วย (header เลยเป็นสีขาวค้างตั้งแต่ scroll ยังไม่เริ่ม)
            return Math.max(1, scroller.offsetHeight - document.documentElement.clientHeight);
        }

        // Three phases over the hero's scroll-pin, by scroll position:
        //  1. visible   — from the top until the CTA/date/venue block has faded out
        //  2. hidden    — through the rest of the ship/wall/runner sequence
        //  3. sticky    — visible again only once the pin has fully released into #concept
        const HEADER_HIDE_AT_RATIO = 0.12;
        const HEADER_STICKY_BUFFER = 4;

        function setHeaderSticky(sticky) {
            siteHeader.classList.toggle('is-sticky', sticky);
            siteHeaderInner?.classList.toggle('container', sticky);
        }

        function updateSiteHeader() {
            const heroScrollDistance = getHeroScrollDistance();
            const hideAt = heroScrollDistance * HEADER_HIDE_AT_RATIO;
            const stickyAt = Math.max(0, heroScrollDistance - HEADER_STICKY_BUFFER);
            const y = window.scrollY;

            const sticky = y >= stickyAt;
            const hidden = y >= hideAt && y < stickyAt;
            setHeaderSticky(sticky);

            if (document.body.classList.contains('menu-open') || document.body.classList.contains('menu-closing')) {
                siteHeader.classList.remove('is-hidden');
                return;
            }

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

        function setupHeaderTextClipping() {
            const darkSections = [...document.querySelectorAll('[data-header-theme="dark"]')];
            const navLabels = [...siteHeader.querySelectorAll('.site-header__nav-label')];
            const logo = siteHeader.querySelector('.site-header__logo');
            if (!darkSections.length || (!navLabels.length && !logo)) return () => {};

            // ต้องเลิกนับ section ว่ามืดด้วยเกณฑ์เดียวกับ setupHeaderThemeObserver (เส้น sensor
            // ที่ขอบล่าง header) ไม่ใช่ขอบเขตของ label เอง ไม่งั้นตอน section มืดเลื่อนผ่านพ้น
            // header ไปแล้ว (bg สลับเป็นขาวแล้ว) แต่ rect.bottom ยังมากกว่า labelRect ที่เล็ก
            // และอยู่ค่อนไปตรงกลาง header ตัวหนังสือ/โลโก้เลยยังโดนตัดสินว่าอยู่บนพื้นมืดอยู่
            // ทำให้ใช้สีอ่านไม่ออกบนพื้นขาวไปอีกพักหนึ่งกว่าจะ scroll ผ่านจุดนั้นเพิ่ม
            const headerHeight = siteHeader.offsetHeight || 80;

            let frameId = null;

            const updateTextGradients = () => {
                frameId = null;
                const darkRects = darkSections
                    .map(section => section.getBoundingClientRect())
                    .filter(rect => rect.bottom >= headerHeight && rect.top < document.documentElement.clientHeight);

                navLabels.forEach(label => {
                    const labelRect = label.getBoundingClientRect();
                    if (labelRect.height <= 0) return;

                    const lightColor = 'var(--bt-header-nav-text-light)';
                    const darkColor = 'var(--bt-header-nav-text-dark)';
                    const stops = [{ position: 0, color: lightColor }];

                    darkRects
                        .filter(rect => rect.right > labelRect.left && rect.left < labelRect.right)
                        .map(rect => ({
                            start: Math.max(0, Math.min(1, (rect.top - labelRect.top) / labelRect.height)),
                            end: Math.max(0, Math.min(1, (rect.bottom - labelRect.top) / labelRect.height)),
                        }))
                        .filter(range => range.end > range.start)
                        .sort((a, b) => a.start - b.start)
                        .forEach(range => {
                            stops.push(
                                { position: range.start, color: lightColor },
                                { position: range.start, color: darkColor },
                                { position: range.end, color: darkColor },
                                { position: range.end, color: lightColor },
                            );
                        });

                    stops.push({ position: 1, color: lightColor });
                    const gradientStops = stops
                        .map(stop => `${stop.color} ${(stop.position * 100).toFixed(3)}%`)
                        .join(', ');
                    label.style.setProperty(
                        '--bt-header-nav-text-background',
                        `linear-gradient(to bottom, ${gradientStops})`,
                    );
                });

                if (logo) {
                    const logoRect = logo.getBoundingClientRect();
                    if (logoRect.height > 0) {
                        const ranges = darkRects
                            .filter(rect => rect.right > logoRect.left && rect.left < logoRect.right)
                            .map(rect => ({
                                start: Math.max(0, Math.min(1, (rect.top - logoRect.top) / logoRect.height)),
                                end: Math.max(0, Math.min(1, (rect.bottom - logoRect.top) / logoRect.height)),
                            }))
                            .filter(range => range.end > range.start);

                        const darkStart = ranges.length
                            ? Math.min(...ranges.map(range => range.start))
                            : 0;
                        const darkEnd = ranges.length
                            ? Math.max(...ranges.map(range => range.end))
                            : 0;

                        logo.style.setProperty(
                            '--bt-header-logo-dark-start',
                            `${(darkStart * 100).toFixed(3)}%`,
                        );
                        logo.style.setProperty(
                            '--bt-header-logo-dark-end',
                            `${(darkEnd * 100).toFixed(3)}%`,
                        );
                    }
                }
            };

            const requestUpdate = () => {
                if (frameId !== null) return;
                frameId = window.requestAnimationFrame(updateTextGradients);
            };

            updateTextGradients();
            window.addEventListener('scroll', requestUpdate, { passive: true });
            window.addEventListener('resize', requestUpdate);

            return () => {
                if (frameId !== null) window.cancelAnimationFrame(frameId);
                window.removeEventListener('scroll', requestUpdate);
                window.removeEventListener('resize', requestUpdate);
            };
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
        const disconnectHeaderTextClipping = setupHeaderTextClipping();
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
        window.addEventListener('beforeunload', disconnectHeaderTextClipping, { once: true });
        updateSiteHeader();
    

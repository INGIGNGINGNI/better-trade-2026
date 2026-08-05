        const siteHeaderToggle = document.querySelector('.site-header__toggle');
        const siteHeader = document.querySelector('.site-header');
        const siteHeaderBackdrop = document.querySelector('.site-header__backdrop');
        const siteHeaderMobileLinks = document.querySelectorAll('.site-header__mobile a');
        let siteHeaderLeaveTimer = null;

        function getHeroStickyThreshold(heroScrollDistance, viewportHeight) {
            return Math.max(620, viewportHeight * 0.75, heroScrollDistance * 0.46);
        }

        function getSiteHeaderStickyAt() {
            const scroller = document.getElementById('scroller');
            const heroScrollDistance = Math.max(1, scroller.offsetHeight - window.innerHeight);
            return getHeroStickyThreshold(heroScrollDistance, window.innerHeight);
        }

        function updateSiteHeader() {
            const stickyAt = getSiteHeaderStickyAt();
            const shouldStick = window.scrollY >= stickyAt;

            if (shouldStick) {
                if (siteHeaderLeaveTimer) clearTimeout(siteHeaderLeaveTimer);
                siteHeaderLeaveTimer = null;
                siteHeader.classList.remove('is-leaving');
                siteHeader.classList.add('is-sticky');
                return;
            }

            if (siteHeader.classList.contains('is-sticky')) {
                siteHeader.classList.remove('is-sticky');
                siteHeader.classList.add('is-leaving');
                if (siteHeaderLeaveTimer) clearTimeout(siteHeaderLeaveTimer);
                siteHeaderLeaveTimer = setTimeout(() => {
                    const currentStickyAt = getSiteHeaderStickyAt();
                    if (window.scrollY < currentStickyAt) siteHeader.classList.remove('is-leaving');
                    siteHeaderLeaveTimer = null;
                }, 340);
            }
        }

        function setSiteMenu(open) {
            document.body.classList.toggle('menu-open', open);
            siteHeaderToggle.setAttribute('aria-expanded', String(open));
            siteHeaderToggle.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
        }

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
        });
        updateSiteHeader();
    

(() => {
    const tabLists = document.querySelectorAll('.agenda__tabs[role="tablist"]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    tabLists.forEach((tabList) => {
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        const indicator = tabList.querySelector('.agenda__tab-indicator');

        /* คืน true เมื่อวัดตำแหน่งได้จริง แผงที่ยังซ่อนอยู่วัดไม่ได้ (offsetLeft/Width = 0) */
        const updateIndicator = (activeTab) => {
            if (!activeTab || tabList.closest('[hidden]')) return false;

            const indicatorHeight = indicator ? indicator.offsetHeight : 0;
            const indicatorY = activeTab.offsetTop + activeTab.offsetHeight - indicatorHeight;

            tabList.style.setProperty('--agenda-tab-indicator-x', `${activeTab.offsetLeft}px`);
            tabList.style.setProperty('--agenda-tab-indicator-y', `${indicatorY}px`);
            tabList.style.setProperty('--agenda-tab-indicator-width', `${activeTab.offsetWidth}px`);

            return true;
        };

        /* เปิด transition หลังจากวางตำแหน่งแรกไปแล้วหนึ่งเฟรม ไม่งั้นการวางครั้งแรก
           จะถูก animate จากมุมซ้ายบน — เห็นชัดตอนกดเข้า Day 2 ครั้งแรก */
        const markIndicatorReady = () => {
            if (tabList.dataset.indicatorReady === 'true') return;

            requestAnimationFrame(() => {
                tabList.dataset.indicatorReady = 'true';
            });
        };

        const activateTab = (activeTab, shouldFocus = true) => {
            let activePanel = null;

            tabs.forEach((tab) => {
                const isActive = tab === activeTab;
                const panelId = tab.getAttribute('aria-controls');
                const panel = panelId ? document.getElementById(panelId) : null;

                tab.setAttribute('aria-selected', String(isActive));
                tab.tabIndex = isActive ? 0 : -1;

                if (panel) {
                    panel.hidden = !isActive;
                    if (isActive) activePanel = panel;
                }
            });

            if (updateIndicator(activeTab)) {
                markIndicatorReady();
            }

            /* สลับแท็บ Stage แล้วเลื่อนขึ้นไปหัวแท็บนั้นเสมอ ไม่งั้นถ้ากำลังเลื่อนดู
               ตารางอยู่ลึก ๆ พอสลับแท็บจะไปโผล่กลางเนื้อหาของแท็บใหม่ทันที
               (activateTab ถูกเรียกจากคลิก/คีย์บอร์ดเท่านั้น ไม่มี call จากโค้ด setup
               เริ่มต้น จึงเลื่อนได้ทุกครั้งโดยไม่ไปแย่งตำแหน่งตอนโหลดหน้า) */
            if (activePanel) {
                activePanel.scrollIntoView({
                    block: 'start',
                    behavior: reducedMotion.matches ? 'auto' : 'smooth',
                });
            }

            if (shouldFocus) {
                activeTab.focus();
            }
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activateTab(tab, false));

            tab.addEventListener('keydown', (event) => {
                let nextIndex = index;

                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    nextIndex = (index + 1) % tabs.length;
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    nextIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = tabs.length - 1;
                } else {
                    return;
                }

                event.preventDefault();
                activateTab(tabs[nextIndex]);
            });
        });

        const initialTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
        const syncActiveIndicator = () => {
            const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');

            if (activeTab && updateIndicator(activeTab)) {
                markIndicatorReady();
            }
        };

        if (initialTab) {
            /* แถบของวันที่ยังซ่อนอยู่จะยังไม่ ready จนกว่าจะถูกแสดงจริง
               ทำให้การวางตำแหน่งครั้งแรกของ Day 2 ไม่มี transition ค้างมาจาก 0,0 */
            syncActiveIndicator();

            window.addEventListener('resize', syncActiveIndicator);
            document.addEventListener('agenda:daychange', () => {
                requestAnimationFrame(syncActiveIndicator);
            });

            if (document.fonts) {
                document.fonts.ready.then(syncActiveIndicator);
            }
        }
    });

    const daySwitcher = document.querySelector('.agenda__day-switcher-inner');
    const dayLinks = daySwitcher
        ? Array.from(daySwitcher.querySelectorAll('.agenda__day-switch[role="tab"]'))
        : [];
    const dayPanels = Array.from(document.querySelectorAll('[data-agenda-day-panel]'));
    const mobileDaySwitcher = window.matchMedia('(max-width: 767px)');

    if (daySwitcher) {
        const syncDaySwitcherOrientation = () => {
            daySwitcher.setAttribute('aria-orientation', mobileDaySwitcher.matches ? 'horizontal' : 'vertical');
        };

        syncDaySwitcherOrientation();
        mobileDaySwitcher.addEventListener('change', syncDaySwitcherOrientation);
    }

    const updateDaySwitch = (activeLink) => {
        if (!activeLink) return;

        dayLinks.forEach((link) => {
            const isActive = link === activeLink;

            link.setAttribute('aria-selected', String(isActive));
            link.tabIndex = isActive ? 0 : -1;

            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    const activateDay = (activeLink, { updateHistory = true, revealTop = true } = {}) => {
        const panelId = activeLink.getAttribute('aria-controls');
        const activePanel = panelId ? document.getElementById(panelId) : null;

        if (!activePanel) return;

        dayPanels.forEach((panel) => {
            panel.hidden = panel !== activePanel;
            panel.classList.remove('is-entering');
        });

        updateDaySwitch(activeLink);

        /* บอก CSS ว่าตอนนี้วันไหน active เพื่อให้ช่วงสเปกตรัมบนเส้นนำสายตา
           เลื่อนไปเกาะฝั่งของวันนั้น (ดู .agenda__day-switch-rail::after) */
        if (daySwitcher) {
            daySwitcher.dataset.activeDay = activePanel.dataset.agendaDayPanel || '';
        }

        /* สลับวันแล้วพากลับไปหัวตารางเสมอ ไม่งั้นถ้ากำลังดูอยู่กลาง ๆ ของวันหนึ่ง
           พอสลับจะไปโผล่กลางตารางของอีกวันทันที scroll-margin-top ของแผงทำให้
           หยุดใต้ header พอดี (ตั้งไว้แล้วใน .agenda__day-panel) */
        if (revealTop) {
            const revealTarget = mobileDaySwitcher.matches
                ? daySwitcher.closest('.agenda__day-switcher')
                : activePanel;

            revealTarget.scrollIntoView({
                block: 'start',
                behavior: reducedMotion.matches ? 'auto' : 'smooth',
            });
        }

        requestAnimationFrame(() => {
            activePanel.classList.add('is-entering');
            document.dispatchEvent(new CustomEvent('agenda:daychange', {
                detail: { panel: activePanel }
            }));
        });

        if (updateHistory) {
            history.replaceState(null, '', activeLink.getAttribute('href'));
        }
    };

    dayLinks.forEach((link, index) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            activateDay(link);
        });

        link.addEventListener('keydown', (event) => {
            let nextIndex = index;

            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                nextIndex = (index + 1) % dayLinks.length;
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                nextIndex = (index - 1 + dayLinks.length) % dayLinks.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = dayLinks.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            dayLinks[nextIndex].focus();
            activateDay(dayLinks[nextIndex]);
        });
    });

    if (dayLinks.length) {
        const hashLink = dayLinks.find((link) => link.getAttribute('href') === window.location.hash);
        const initialLink = hashLink
            || dayLinks.find((link) => link.getAttribute('aria-current') === 'true')
            || dayLinks[0];

        /* ตอนโหลดหน้าห้ามเลื่อนเอง จะไปแย่งตำแหน่งที่ผู้ใช้เปิดมา
           (เคส deep-link ด้วย hash มีตัวจัดการแยกอยู่ด้านล่าง) */
        activateDay(initialLink, { updateHistory: false, revealTop: false });

        /* เปิดหน้าด้วยลิงก์ #agenda-day-two ตรง ๆ: ตอน browser เลื่อนไปหา target
           แผงนั้นยัง hidden อยู่ (ไม่มีขนาด) เลยไม่ได้เลื่อนจริง ต้องสั่งซ้ำหลังแสดงแล้ว
           สั่งซ้ำตอน load ด้วย เพราะระหว่าง preloader หน้ายังถูกล็อกสกอลล์อยู่ */
        if (hashLink) {
            const panelId = hashLink.getAttribute('aria-controls');
            const panel = panelId ? document.getElementById(panelId) : null;

            if (panel) {
                const scrollToPanel = () => panel.scrollIntoView();

                scrollToPanel();
                window.addEventListener('load', scrollToPanel, { once: true });
            }
        }
    }
})();

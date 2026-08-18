(() => {
    const tabLists = document.querySelectorAll('.agenda__tabs[role="tablist"]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* Day 1/Day 2 อยู่ซ้อนอยู่ใน #agenda-main-stage เท่านั้น (ดูบล็อกตัวสลับวัน
       ท้ายไฟล์) สลับไปแท็บ Stage อื่นแล้วทั้งคู่จะถูกซ่อนไปด้วย ต้องวัดตำแหน่งใหม่
       ทุกครั้งที่สลับแท็บ Stage ไม่งั้น scrollspy จะยังอิงตำแหน่งเก่าที่ผิดไปแล้ว
       ประกาศเป็น mutable reference ไว้ก่อน เพราะบล็อกตัวสลับวันมาทีหลังในไฟล์นี้ */
    let refreshDaySwitcher = () => {};

    tabLists.forEach((tabList) => {
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        const indicator = tabList.querySelector('.agenda__tab-indicator');

        /* คืน true เมื่อวัดตำแหน่งได้จริง แผงที่ยังซ่อนอยู่วัดไม่ได้ (offsetLeft/Width = 0) */
        const updateIndicator = (activeTab) => {
            if (!activeTab || tabList.closest('[hidden]')) return false;

            tabList.style.setProperty('--agenda-tab-indicator-x', `${activeTab.offsetLeft}px`);
            tabList.style.setProperty('--agenda-tab-indicator-y', '0px');
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

            refreshDaySwitcher();
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
            syncActiveIndicator();
            window.addEventListener('resize', syncActiveIndicator);

            if (document.fonts) {
                document.fonts.ready.then(syncActiveIndicator);
            }
        }
    });

    /* ---- ตัวสลับวัน ----
       จอ >767px: Day 1 กับ Day 2 อยู่ในพื้นที่เลื่อนเดียวกันตลอด ตัวสลับวันเป็นแค่
       ลิงก์เลื่อนไปหาหัวข้อ + ตัวบอกตำแหน่งปัจจุบัน (scrollspy) แบบเดียวกับ
       journey-indicator.js

       จอ ≤767px: กลับไปพฤติกรรมแท็บแบบเดิม — โชว์ทีละวัน คลิกแล้วซ่อนอีกวันไปเลย
       ไม่ scrollspy ตาม (applyDayVisibility ด้านล่างคุมส่วนนี้) */
    const daySwitcher = document.querySelector('.agenda__day-switcher-inner');
    const dayLinks = daySwitcher
        ? Array.from(daySwitcher.querySelectorAll('.agenda__day-switch'))
        : [];

    if (!daySwitcher || !dayLinks.length) return;

    const mobileDaySwitcher = window.matchMedia('(max-width: 767px)');

    const panelForLink = (link) => {
        const hash = link.getAttribute('href') || '';
        return hash.startsWith('#') ? document.getElementById(hash.slice(1)) : null;
    };

    const applyDayVisibility = (activeLink) => {
        dayLinks.forEach((link) => {
            const panel = panelForLink(link);
            if (!panel) return;

            const shouldHide = mobileDaySwitcher.matches && link !== activeLink;
            if (panel.hidden !== shouldHide) panel.hidden = shouldHide;
        });
    };

    const updateDaySwitch = (activeLink) => {
        if (!activeLink) return;

        dayLinks.forEach((link) => {
            if (link === activeLink) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        /* บอก CSS ว่าตอนนี้วันไหน active เพื่อให้ช่วงสเปกตรัมบนเส้นนำสายตา
           เลื่อนไปเกาะฝั่งของวันนั้น (ดู .agenda__day-switch-rail::after) */
        const activePanel = panelForLink(activeLink);
        daySwitcher.dataset.activeDay = activePanel?.dataset.agendaDayPanel || '';

        applyDayVisibility(activeLink);
    };

    dayLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const panel = panelForLink(link);
            if (!panel) return;

            event.preventDefault();
            updateDaySwitch(link);
            panel.scrollIntoView({
                block: 'start',
                behavior: reducedMotion.matches ? 'auto' : 'smooth',
            });
            history.replaceState(null, '', window.location.pathname + window.location.search);
        });
    });

    /* หาว่าแผงไหนควร active โดยวัดตำแหน่งสด ๆ ทุกครั้งที่เรียก (ไม่แคชค่า) —
       ก่อนหน้านี้แคช panelAnchors ไว้แล้วมีบั๊ก: หน้านี้มี hero ที่คำนวณความสูง
       ของตัวเองแบบ async (สโครลเลอร์/ภาพ/ฟอนต์) ทำให้ตำแหน่งจริงของ Day 2 ขยับ
       หลังจากวัดครั้งแรกไปแล้ว ค่าที่แคชไว้จึงเพี้ยนเล็กน้อยจนสลับ active ก่อนเวลา
       ทั้ง ๆ ที่ยังเลื่อนอยู่ในเนื้อหา Day 1 — วัดสดตรงนี้ตัดปัญหานั้นไปเลย
       ล้อแพตเทิร์นเดียวกับ journey-indicator.js แต่ไม่แคชตำแหน่ง
       แผงที่ถูกซ่อน (สลับไปแท็บ Stage อื่น หรือจอ ≤767px ที่โชว์ทีละวัน) จะมี
       offsetParent เป็น null ตัดออกจากการวัดไปเลยแทนที่จะเทียบตำแหน่ง 0
       ที่ไม่มีความหมาย — ไม่มีแผงให้วัดเลยก็แค่ไม่ทำอะไร (คงค่าล่าสุดไว้) */
    let scrollSpyRAF = null;

    const updateScrollSpy = () => {
        scrollSpyRAF = null;

        const anchors = dayLinks
            .map((link) => {
                const panel = panelForLink(link);
                if (!panel || panel.offsetParent === null) return null;

                return { link, top: panel.getBoundingClientRect().top + window.scrollY };
            })
            .filter(Boolean);

        if (!anchors.length) return;

        /* เส้นอ้างอิงอยู่ค่อนไปทางบนของวิวพอร์ต ใกล้เคียงตำแหน่งที่ header
           ลอยทับอยู่ ทำให้สลับวันพอดีตอนหัวข้อของวันถัดไปเลื่อนขึ้นมาถึงจุดนั้น */
        const marker = window.scrollY + (window.innerHeight * 0.35);
        let current = anchors[0];

        anchors.forEach((anchor) => {
            if (marker >= anchor.top) current = anchor;
        });

        updateDaySwitch(current.link);
    };

    const requestScrollSpyUpdate = () => {
        if (scrollSpyRAF !== null) return;
        scrollSpyRAF = window.requestAnimationFrame(updateScrollSpy);
    };
    refreshDaySwitcher = updateScrollSpy;

    window.addEventListener('scroll', requestScrollSpyUpdate, { passive: true });
    window.addEventListener('resize', updateScrollSpy);
    window.addEventListener('load', updateScrollSpy);
    document.fonts?.ready.then(updateScrollSpy);

    /* ข้ามเกณฑ์ 767px แล้ว (เช่นหมุนจอ/ปรับขนาดหน้าต่าง) ต้องจัดการ visibility
       ของวันให้ตรงกับโหมดใหม่ก่อน แล้วค่อยเช็ค scrollspy ไม่งั้นแผงที่ยังซ่อนอยู่
       จากโหมดเดิมจะไม่ถูกนับ (offsetParent เป็น null อยู่) */
    mobileDaySwitcher.addEventListener('change', () => {
        const activeLink = dayLinks.find((link) => link.getAttribute('aria-current') === 'true') || dayLinks[0];

        applyDayVisibility(activeLink);
        updateScrollSpy();
    });

    updateScrollSpy();

    /* เปิดหน้าด้วยลิงก์ #agenda-day-two ตรง ๆ: ตั้ง active ให้ตรงกับ hash ทันที
       ไม่ต้องรอ scrollspy ตามทัน แล้วเลื่อนไปหาแผงนั้นซ้ำหลัง load เผื่อระหว่าง
       preloader หน้ายังถูกล็อกสกอลล์อยู่ตอน browser พยายามเลื่อนตาม hash ครั้งแรก */
    const hashLink = dayLinks.find((link) => link.getAttribute('href') === window.location.hash);

    if (hashLink) {
        const panel = panelForLink(hashLink);

        updateDaySwitch(hashLink);

        if (panel) {
            const scrollToPanel = () => panel.scrollIntoView();

            scrollToPanel();
            window.addEventListener('load', scrollToPanel, { once: true });
        }
    }
})();

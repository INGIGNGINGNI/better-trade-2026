(() => {
    /* แถบรายวันเท่านั้น แถบ Stage รวมในหัว section ใช้คลาสเดียวกันแต่มีตัวคุมของตัวเองด้านล่าง */
    const tabLists = document.querySelectorAll('.agenda__day-panel .agenda__tabs[role="tablist"]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* สลับแท็บ Stage รายวันแล้วความสูงแผงเปลี่ยน ต้องให้ scrollspy (จอ ≤991px) วัดตำแหน่งใหม่
       ประกาศเป็น mutable reference ไว้ก่อน เพราะบล็อกตัวสลับวันมาทีหลังในไฟล์นี้ */
    let refreshDaySwitcher = () => {};

    /* ตัวคุมแถบ Stage รายวันทีละชุด ให้แถบ Stage รวม (จอ ≥992px) สั่งทั้งสองวันพร้อมกันได้ */
    const dayTabControls = [];

    /* เส้นสีรุ้งใต้แท็บที่เลือก ใช้ร่วมกันทั้งแถบรายวันและแถบ Stage รวม */
    const createTabIndicator = (tabList) => {
        /* คืน true เมื่อวัดตำแหน่งได้จริง แผงที่ยังซ่อนอยู่วัดไม่ได้ (offsetLeft/Width = 0) */
        const updateIndicator = (activeTab) => {
            if (!activeTab || tabList.closest('[hidden]')) return false;

            /* ไม่มี client rect = CSS ซ่อนแถบนี้อยู่ (แถบรายวันบนจอ ≥992px / แถบรวมบนมือถือ) วัดได้ 0 จึงข้าม และปลด ready ด้วย
               เพราะอีกแถบอาจเปลี่ยนแท็บระหว่างซ่อน ข้ามเกณฑ์จอกลับมาแล้วตัวชี้ต้องวางที่ใหม่เลย ไม่ไหลมาจากแท็บเดิม */
            if (!tabList.getClientRects().length) {
                delete tabList.dataset.indicatorReady;
                return false;
            }

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

        return (activeTab) => {
            if (updateIndicator(activeTab)) {
                markIndicatorReady();
            }
        };
    };

    tabLists.forEach((tabList) => {
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        const placeIndicator = createTabIndicator(tabList);

        const activateTab = (activeTab, shouldFocus = true, silent = false) => {
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

            placeIndicator(activeTab);

            /* silent =แถบ Stage รวมสั่งมา: ตั้งสถานะแท็บ/แผงอย่างเดียว ไม่เลื่อนจอ ไม่ย้าย focus ไม่ต้อง refresh scrollspy */
            if (silent) return;

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

            if (activeTab) placeIndicator(activeTab);
        };

        if (initialTab) {
            syncActiveIndicator();
            window.addEventListener('resize', syncActiveIndicator);

            if (document.fonts) {
                document.fonts.ready.then(syncActiveIndicator);
            }
        }

        dayTabControls.push({
            day: tabList.closest('[data-agenda-day-panel]')?.dataset.agendaDayPanel || '',
            selectedIndex: () => tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
            select: (index) => {
                if (tabs[index]) activateTab(tabs[index], false, true);
            },
            syncIndicator: syncActiveIndicator,
        });
    });

    /* ---- แถบ Stage รวม (จอ ≥992px) ----
       Day 1 กับ Day 2 วางคู่กัน แถบเดียวคุมทั้งสองคอลัมน์ โดยสั่งแถบรายวัน (CSS ซ่อนไว้บนจอนี้) แบบ silent
       แผงจึงเปิด/ปิดผ่านกลไกเดิม และย่อจอลงมือถือแล้วแต่ละวันยังอยู่ Stage เดียวกับที่เห็นล่าสุด
       ซิงก์ตามลำดับปุ่ม ทุกแถบต้องเรียง Conference, Experience, Workshop, Master Class เหมือนกัน */
    const stageTabList = document.querySelector('.agenda__stage-tabs [role="tablist"]');
    const stageTabsWrap = stageTabList?.parentElement;
    const agendaSection = stageTabsWrap?.closest('.agenda');
    const agendaLayout = agendaSection?.querySelector('.agenda__layout');
    const dayPanelHeaders = agendaSection
        ? Array.from(agendaSection.querySelectorAll('.agenda__day-panel-header'))
        : [];
    const stageTabs = stageTabList ? Array.from(stageTabList.querySelectorAll('[role="tab"]')) : [];
    const placeStageIndicator = stageTabList ? createTabIndicator(stageTabList) : () => {};

    /* หัว Day / วันที่ / เวลา sticky ต่อใต้แถบ Stage โดยช่วง 768–991px แถบ Stage
       สูงกว่าจอ desktop เพราะป้ายมีสองบรรทัด วัดจากขนาดจริงเพื่อไม่ให้สองชั้นทับกัน
       เมื่อฟอนต์โหลดหรือ viewport เปลี่ยน ResizeObserver จะอัปเดต offset ให้อัตโนมัติ */
    const syncAgendaStickyHeights = () => {
        if (!agendaSection || !stageTabsWrap) return;

        const stageTabsHeight = stageTabsWrap.getBoundingClientRect().height;
        const dayHeaderHeight = Math.max(
            0,
            ...dayPanelHeaders.map((header) => header.getBoundingClientRect().height),
        );

        agendaSection.style.setProperty('--agenda-stage-tabs-height', `${stageTabsHeight}px`);
        agendaSection.style.setProperty('--agenda-day-sticky-header-height', `${dayHeaderHeight}px`);
    };

    if (stageTabsWrap) {
        syncAgendaStickyHeights();
        window.addEventListener('resize', syncAgendaStickyHeights);
        document.fonts?.ready.then(syncAgendaStickyHeights);

        if ('ResizeObserver' in window) {
            const agendaStickyResizeObserver = new ResizeObserver(syncAgendaStickyHeights);
            agendaStickyResizeObserver.observe(stageTabsWrap);
            dayPanelHeaders.forEach((header) => agendaStickyResizeObserver.observe(header));
        }
    }

    const syncStageIndicator = () => {
        const activeTab = stageTabs.find((tab) => tab.getAttribute('aria-selected') === 'true');

        if (activeTab) placeStageIndicator(activeTab);
    };

    const selectStage = (index, shouldFocus = false) => {
        if (index < 0) return;

        stageTabs.forEach((tab, tabIndex) => {
            const isActive = tabIndex === index;

            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
        });

        placeStageIndicator(stageTabs[index]);
        dayTabControls.forEach((control) => control.select(index));

        if (shouldFocus && stageTabs[index]) {
            stageTabs[index].focus();
        }
    };

    /* ห้าม scrollIntoView ตัวแถบ Stage โดยตรง เพราะตอนที่แถบกำลัง sticky browser
       จะมองว่ามันอยู่ใน viewport แล้วและไม่เลื่อน ใช้ layout ที่ไม่ sticky เป็น anchor
       และคำนวณพิกัดตรงเพื่อให้เลื่อนทันที ส่วน requestAnimationFrame รอบถัดไปยืนยัน
       ตำแหน่งอีกครั้งหลัง browser จัด layout ใหม่จากการซ่อน/แสดง panel */
    const scrollStageContentToTop = () => {
        if (!stageTabsWrap || !agendaLayout) return;

        const styles = getComputedStyle(stageTabsWrap);
        if (styles.position !== 'sticky') return;

        const placeContentAtTop = () => {
            const scrollMarginTop = parseFloat(getComputedStyle(agendaLayout).scrollMarginTop) || 0;
            const targetTop = window.scrollY + agendaLayout.getBoundingClientRect().top - scrollMarginTop;
            const scrollingElement = document.scrollingElement || document.documentElement;

            const nextScrollTop = Math.max(0, targetTop);

            try {
                scrollingElement.scrollTo({
                    top: nextScrollTop,
                    behavior: 'instant',
                });
            } catch {
                scrollingElement.scrollTop = nextScrollTop;
            }
        };

        placeContentAtTop();
        requestAnimationFrame(placeContentAtTop);
    };

    stageTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            selectStage(index);
            scrollStageContentToTop();
        });

        tab.addEventListener('keydown', (event) => {
            let nextIndex = index;

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                nextIndex = (index + 1) % stageTabs.length;
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                nextIndex = (index - 1 + stageTabs.length) % stageTabs.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = stageTabs.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            selectStage(nextIndex, true);
            scrollStageContentToTop();
        });
    });

    if (stageTabs.length) {
        syncStageIndicator();
        window.addEventListener('resize', syncStageIndicator);
        document.fonts?.ready.then(syncStageIndicator);
    }

    /* ---- ตัวสลับวัน ----
       จอ ≤991px: โชว์ทีละวัน คลิกแล้วซ่อนอีกวันไปเลย (applyDayVisibility ด้านล่าง)
       จอ ≥992px: สองวันวางคู่กันเป็นสองคอลัมน์ CSS ซ่อนตัวสลับวัน scrollspy จึงปิด (ดู updateScrollSpy)
       ส่วนนี้แค่เก็บวันล่าสุดไว้ใช้ตอนย่อจอกลับเป็นมือถือ */
    const daySwitcher = document.querySelector('.agenda__day-switcher-inner');
    const dayLinks = daySwitcher
        ? Array.from(daySwitcher.querySelectorAll('.agenda__day-switch'))
        : [];

    if (!daySwitcher || !dayLinks.length) return;

    const mobileDaySwitcher = window.matchMedia('(max-width: 991px)');

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
       แผงที่ถูกซ่อน (สลับไปแท็บ Stage อื่น หรือจอ ≤991px ที่โชว์ทีละวัน) จะมี
       offsetParent เป็น null ตัดออกจากการวัดไปเลยแทนที่จะเทียบตำแหน่ง 0
       ที่ไม่มีความหมาย — ไม่มีแผงให้วัดเลยก็แค่ไม่ทำอะไร (คงค่าล่าสุดไว้) */
    let scrollSpyRAF = null;

    const updateScrollSpy = () => {
        scrollSpyRAF = null;

        /* จอ ≥992px สองวันวางคู่กันขอบบนเท่ากัน ถ้าปล่อยวัด aria-current จะไหลไป Day 2 ทุกครั้งที่เลื่อนผ่าน
           แล้วย่อจอลงมือถือจะเปิดผิดวัน ตัวสลับวันก็ถูกซ่อนอยู่ จึงข้ามไปเลย */
        if (!mobileDaySwitcher.matches) return;

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

    /* ข้ามเกณฑ์ 991px แล้ว (เช่นหมุนจอ/ปรับขนาดหน้าต่าง) ต้องจัดการ visibility
       ของวันให้ตรงกับโหมดใหม่ก่อน แล้วค่อยเช็ค scrollspy ไม่งั้นแผงที่ยังซ่อนอยู่
       จากโหมดเดิมจะไม่ถูกนับ (offsetParent เป็น null อยู่) */
    mobileDaySwitcher.addEventListener('change', () => {
        const activeLink = dayLinks.find((link) => link.getAttribute('aria-current') === 'true') || dayLinks[0];

        /* ย่อลงมือถือ: วัดตัวชี้ของแถบรายวันตอนที่สองวันยังโชว์อยู่ ก่อน applyDayVisibility ซ่อนวันหนึ่งไป
           บนจอ ≥992px แถบรายวันถูกซ่อนจึงไม่เคยถูกวัด ถ้าเบราว์เซอร์ยิง change ก่อน resize
           วันที่ถูกซ่อนจะค้างตัวชี้กว้าง 0 ตอนสลับไปดู */
        if (mobileDaySwitcher.matches) {
            dayTabControls.forEach((control) => control.syncIndicator());
        }

        applyDayVisibility(activeLink);

        /* ขยายขึ้น ≥992px: โหมดวันเดียวเลือก Stage แยกวันได้ แต่สองคอลัมน์ต้องโชว์ Stage เดียวกัน ยึดวันที่ดูอยู่ล่าสุด */
        if (!mobileDaySwitcher.matches) {
            const activeDay = panelForLink(activeLink)?.dataset.agendaDayPanel;
            const source = dayTabControls.find((control) => control.day === activeDay) || dayTabControls[0];

            if (source) selectStage(source.selectedIndex());
        }

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

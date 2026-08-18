(() => {
    const speakerDays = {
        dayOne: [
            ['กิตติพงศ์ วัฒนชัย', 'Chief Investment Strategist, Horizon Capital', 'man'],
            ['พิมพ์ชนก รัตนกุล', 'Founder & CEO, Future Wealth Lab', 'woman'],
            ['ธนกร ศรีวัฒน์', 'Managing Director, Atlas Securities', 'man'],
            ['อรทัย ตั้งพิพัฒน์', 'Head of Digital Assets, NovaX', 'woman'],
            ['ชยพล เกียรติไพบูลย์', 'Partner, Momentum Ventures', 'man'],
            ['ณัฐชา วงศ์ประเสริฐ', 'Economist & Market Commentator', 'woman'],
            ['วรเมธ ลิ้มวัฒนะ', 'Chief Technology Officer, Finverse', 'man'],
            ['ศิริพร บุญยืน', 'Director of Sustainable Investment', 'woman'],
            ['ภาคิน อัครเดช', 'Founder, New Economy Research', 'man'],
            ['ลลิตา จารุวัฒน์', 'Private Wealth Advisor', 'woman'],
            ['ปกรณ์ สุวรรณกิจ', 'Global Macro Fund Manager', 'man'],
            ['รมิดา พัฒนโชติ', 'Co-founder, Wealth for Everyone', 'woman'],
            ['ธีรภัทร ชาญวิทย์', 'Digital Asset Research Lead', 'man'],
            ['นภัสสร วัฒนศิริ', 'CEO, Capital Design Studio', 'woman'],
            ['อธิป ตั้งธนกิจ', 'Commodity Investment Specialist', 'man'],
            ['ชุติมา รุ่งเรืองผล', 'Managing Partner, Bright Future Fund', 'woman'],
            ['กฤตภาส เมธากุล', 'AI & Quantitative Strategy Lead', 'man'],
            ['พิชญา พงศ์พาณิชย์', 'Financial Educator & Author', 'woman'],
            ['วสุธร อินทรรักษ์', 'Chief Economist, Meridian Group', 'man'],
            ['รวิสรา ธรรมคุณ', 'Founder, Purposeful Portfolio', 'woman'],
        ],
        dayTwo: [
            ['ภานุวัฒน์ วีระกุล', 'Chief Executive Officer, Quantum Wealth', 'man'],
            ['กัญญารัตน์ อุดมทรัพย์', 'Managing Partner, Northstar Ventures', 'woman'],
            ['สรวิศ ชาญธนกิจ', 'Global Equity Portfolio Manager', 'man'],
            ['วริศรา เทพหัสดิน', 'Head of Alternative Investments', 'woman'],
            ['ณรงค์ฤทธิ์ วัฒนาพงศ์', 'Founder, Digital Economy Forum', 'man'],
            ['ปิยะนุช สุขเกษม', 'Sustainable Finance Director', 'woman'],
            ['ธนวัฒน์ ชัยประสิทธิ์', 'AI Investment Researcher', 'man'],
            ['มนัสวี รุ่งกิจ', 'Private Market Strategist', 'woman'],
            ['ชลธิชา สกุลทอง', 'Financial Technology Entrepreneur', 'woman'],
            ['อัครเดช พัฒนวงศ์', 'Chief Investment Officer, Vertex Fund', 'man'],
            ['ศุภณัฐ รัตนวิชัย', 'Digital Asset Portfolio Manager', 'man'],
            ['ณิชาภา ตั้งวาณิชย์', 'Founder, Future Money Studio', 'woman'],
            ['กรณ์ภพ นิลวัฒน์', 'Real Asset Investment Director', 'man'],
            ['ศศิธร วัฒนวงศ์', 'Family Office Advisor', 'woman'],
            ['นราวิชญ์ อัครวัฒน์', 'Fintech Entrepreneur & Investor', 'man'],
            ['อัญชลี รุ่งพิพัฒน์', 'Personal Finance Creator', 'woman'],
            ['ธนกฤต ศรีสวัสดิ์', 'Market Structure Specialist', 'man'],
            ['พิมพ์มาดา วงศ์วาน', 'Founder, The Growth Playbook', 'woman'],
            ['กวินท์ สุวรรณเมธา', 'Macroeconomic Research Director', 'man'],
            ['ชญานิศ วงศ์วัฒนา', 'Wealth Innovation Consultant', 'woman'],
        ],
    };

    const panels = Array.from(document.querySelectorAll('[data-speaker-day]'));

    const createSpeakerCard = ([name, role, gender], index) => {
        const card = document.createElement('article');

        card.className = 'speaker-card';
        card.style.setProperty('--speaker-order', String(index % 5));
        card.style.setProperty('--speaker-portrait-y', '0%');
        card.innerHTML = `
            <div class="speaker-card__portrait">
                <div class="speaker-card__frame">
                    <img src="images/speakers/profile-${gender}.webp" width="928" height="1152"
                        loading="lazy" decoding="async" alt="${name}">
                </div>
            </div>
            <div class="speaker-card__meta">
                <h3>${name}</h3>
                <p>${role}</p>
            </div>`;

        return card;
    };

    panels.forEach((panel) => {
        const speakers = speakerDays[panel.dataset.speakerDay] || [];
        const fragment = document.createDocumentFragment();

        speakers.forEach((speaker, index) => {
            fragment.appendChild(createSpeakerCard(speaker, index));
        });

        panel.appendChild(fragment);
    });

    /* ---- ตัวสลับวัน: พฤติกรรมเดียวกับ agenda-tabs.js ----
       แยกไฟล์กันเพราะคนละ block ของ BEM แต่ logic ตรงกันทุกขั้น

       จอ >767px: Day 1 กับ Day 2 อยู่ในพื้นที่เลื่อนเดียวกันตลอด ตัวสลับวันเป็นแค่
       ลิงก์เลื่อนไปหาหัวข้อ + ตัวบอกตำแหน่งปัจจุบัน (scrollspy)
       จอ ≤767px: กลับไปพฤติกรรมแท็บแบบเดิม โชว์ทีละวัน คลิกแล้วซ่อนอีกวันไปเลย */
    const daySwitcher = document.querySelector('.speaker__day-switcher-inner');
    const dayLinks = daySwitcher
        ? Array.from(daySwitcher.querySelectorAll('.speaker__day-switch'))
        : [];
    const dayPanels = Array.from(document.querySelectorAll('[data-speaker-day-panel]'));
    const mobileDaySwitcher = window.matchMedia('(max-width: 767px)');

    if (!dayLinks.length || !dayPanels.length) return;

    const panelForLink = (link) => {
        const hash = link.getAttribute('href') || '';
        return hash.startsWith('#') ? document.getElementById(hash.slice(1)) : null;
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionRefreshTimer = 0;
    let removeScrollEndListener = () => {};

    const refreshSpeakerMotion = (panel) => {
        document.dispatchEvent(new CustomEvent('speaker:daychange', {
            detail: { panel },
        }));
    };

    const revealPanelTop = (panel) => {
        window.clearTimeout(motionRefreshTimer);
        removeScrollEndListener();

        const scrollMargin = Number.parseFloat(getComputedStyle(panel).scrollMarginTop) || 0;
        const distance = Math.abs(panel.getBoundingClientRect().top - scrollMargin);
        let isComplete = false;

        const completeReveal = () => {
            if (isComplete) return;
            isComplete = true;
            window.clearTimeout(motionRefreshTimer);
            removeScrollEndListener();
            removeScrollEndListener = () => {};
            refreshSpeakerMotion(panel);
        };

        if (!reducedMotion.matches && distance > 2) {
            const onScrollEnd = () => completeReveal();
            window.addEventListener('scrollend', onScrollEnd, { once: true });
            removeScrollEndListener = () => window.removeEventListener('scrollend', onScrollEnd);
            motionRefreshTimer = window.setTimeout(completeReveal, 1000);
        }

        panel.scrollIntoView({
            block: 'start',
            behavior: reducedMotion.matches ? 'auto' : 'smooth',
        });

        if (reducedMotion.matches || distance <= 2) {
            requestAnimationFrame(completeReveal);
        }
    };

    /* ซ่อนวันที่ไม่ได้เลือกเฉพาะจอ ≤767px เท่านั้น จอใหญ่กว่านั้นโชว์ทั้งสองวันต่อกัน */
    const applyDayVisibility = (activeLink) => {
        dayPanels.forEach((panel) => {
            const shouldHide = mobileDaySwitcher.matches && panel !== panelForLink(activeLink);
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

        /* ให้ช่วงสเปกตรัมบนเส้นนำสายตาเลื่อนไปเกาะฝั่งของวันที่เลือก */
        const activePanel = panelForLink(activeLink);
        daySwitcher.dataset.activeDay = activePanel?.dataset.speakerDayPanel || '';

        applyDayVisibility(activeLink);
    };

    dayLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const panel = panelForLink(link);
            if (!panel) return;

            event.preventDefault();
            updateDaySwitch(link);

            /* ≤767px สลับวันแล้วเนื้อหาถูกสลับทั้งแผง พากลับไปหัวตัวสลับวันเหมือนเดิม
               จอใหญ่เลื่อนไปหาหัวข้อของวันนั้นในพื้นที่เลื่อนเดียวกัน */
            if (mobileDaySwitcher.matches) {
                daySwitcher.closest('.speaker__day-switcher').scrollIntoView({
                    block: 'start',
                    behavior: reducedMotion.matches ? 'auto' : 'smooth',
                });
                refreshSpeakerMotion(panel);
            } else {
                revealPanelTop(panel);
            }

            history.replaceState(null, '', window.location.pathname + window.location.search);
        });
    });

    /* หาว่าแผงไหนควร active โดยวัดตำแหน่งสด ๆ ทุกครั้ง (ไม่แคช) — หน้านี้มี hero ที่
       คำนวณความสูงตัวเองแบบ async และการ์ด speaker เป็นรูป lazy-load ตำแหน่งจริงของ
       Day 2 จึงขยับหลังวัดครั้งแรก ค่าที่แคชไว้จะเพี้ยนจนสลับ active ก่อนเวลา
       แผงที่ถูกซ่อน (จอ ≤767px ที่โชว์ทีละวัน) มี offsetParent เป็น null ตัดออกไปเลย
       ไม่มีแผงให้วัดก็แค่ไม่ทำอะไร คงค่าล่าสุดไว้ */
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

    window.addEventListener('scroll', requestScrollSpyUpdate, { passive: true });
    window.addEventListener('resize', updateScrollSpy);
    window.addEventListener('load', updateScrollSpy);
    document.fonts?.ready.then(updateScrollSpy);

    /* ข้ามเกณฑ์ 767px แล้วต้องจัดการ visibility ให้ตรงโหมดใหม่ก่อน แล้วค่อยวัด
       ไม่งั้นแผงที่ยังซ่อนจากโหมดเดิมจะไม่ถูกนับ (offsetParent เป็น null อยู่) */
    mobileDaySwitcher.addEventListener('change', () => {
        const activeLink = dayLinks.find((link) => link.getAttribute('aria-current') === 'true') || dayLinks[0];

        applyDayVisibility(activeLink);
        updateScrollSpy();
        refreshSpeakerMotion(panelForLink(activeLink));
    });

    const hashLink = dayLinks.find((link) => link.getAttribute('href') === window.location.hash);
    const initialLink = hashLink
        || dayLinks.find((link) => link.getAttribute('aria-current') === 'true')
        || dayLinks[0];

    updateDaySwitch(initialLink);
    updateScrollSpy();
    refreshSpeakerMotion(panelForLink(initialLink));

    /* เปิดหน้าด้วย #speaker-day-two ตรง ๆ: ตอน browser เลื่อนหา target แผงอาจยังซ่อน
       (จอ ≤767px) จึงไม่ได้เลื่อนจริง สั่งซ้ำตอน load เผื่อ preloader ล็อกสกอลล์อยู่ */
    if (hashLink) {
        const panel = panelForLink(hashLink);

        if (panel) {
            const scrollToPanel = () => panel.scrollIntoView();

            scrollToPanel();
            window.addEventListener('load', scrollToPanel, { once: true });
        }
    }
})();

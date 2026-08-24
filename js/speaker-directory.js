(() => {
    const speakerDays = {
        dayOne: [
            { name: 'ดร.นิเวศน์ เหมวชิรวรากร', role: 'Value Investor (VI) เบอร์หนึ่งของเมืองไทย', image: '17.20-18.20-ดร.นิเวศน์-เหมวชิรวรากร.webp', imageY: '0%', imageWidth: 928, imageHeight: 1204 },
            { name: 'พิมพ์ชนก รัตนกุล', role: 'Founder & CEO, Future Wealth Lab', image: 'speaker_3.webp', imageY: '0%' },
            { name: 'ธนกร ศรีวัฒน์', role: 'Managing Director, Atlas Securities', image: 'speaker_blue.webp', imageY: '0%' },
            { name: 'อรทัย ตั้งพิพัฒน์', role: 'Head of Digital Assets, NovaX', image: 'speaker_red.webp', imageY: '0%' },
            { name: 'ชยพล เกียรติไพบูลย์', role: 'Partner, Momentum Ventures', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ณัฐชา วงศ์ประเสริฐ', role: 'Economist & Market Commentator', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'วรเมธ ลิ้มวัฒนะ', role: 'Chief Technology Officer, Finverse', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ศิริพร บุญยืน', role: 'Director of Sustainable Investment', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'ภาคิน อัครเดช', role: 'Founder, New Economy Research', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ลลิตา จารุวัฒน์', role: 'Private Wealth Advisor', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'ปกรณ์ สุวรรณกิจ', role: 'Global Macro Fund Manager', image: 'profile-man.webp', imageY: '0%' },
            { name: 'รมิดา พัฒนโชติ', role: 'Co-founder, Wealth for Everyone', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'ธีรภัทร ชาญวิทย์', role: 'Digital Asset Research Lead', image: 'profile-man.webp', imageY: '0%' },
            { name: 'นภัสสร วัฒนศิริ', role: 'CEO, Capital Design Studio', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'อธิป ตั้งธนกิจ', role: 'Commodity Investment Specialist', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ชุติมา รุ่งเรืองผล', role: 'Managing Partner, Bright Future Fund', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'กฤตภาส เมธากุล', role: 'AI & Quantitative Strategy Lead', image: 'profile-man.webp', imageY: '0%' },
            { name: 'พิชญา พงศ์พาณิชย์', role: 'Financial Educator & Author', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'วสุธร อินทรรักษ์', role: 'Chief Economist, Meridian Group', image: 'profile-man.webp', imageY: '0%' },
            { name: 'รวิสรา ธรรมคุณ', role: 'Founder, Purposeful Portfolio', image: 'profile-woman.webp', imageY: '0%' },
        ],
        dayTwo: [
            { name: 'ภานุวัฒน์ วีระกุล', role: 'Chief Executive Officer, Quantum Wealth', image: 'profile-man.webp', imageY: '0%' },
            { name: 'กัญญารัตน์ อุดมทรัพย์', role: 'Managing Partner, Northstar Ventures', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'สรวิศ ชาญธนกิจ', role: 'Global Equity Portfolio Manager', image: 'profile-man.webp', imageY: '0%' },
            { name: 'วริศรา เทพหัสดิน', role: 'Head of Alternative Investments', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'ณรงค์ฤทธิ์ วัฒนาพงศ์', role: 'Founder, Digital Economy Forum', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ปิยะนุช สุขเกษม', role: 'Sustainable Finance Director', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'ธนวัฒน์ ชัยประสิทธิ์', role: 'AI Investment Researcher', image: 'profile-man.webp', imageY: '0%' },
            { name: 'มนัสวี รุ่งกิจ', role: 'Private Market Strategist', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'ชลธิชา สกุลทอง', role: 'Financial Technology Entrepreneur', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'อัครเดช พัฒนวงศ์', role: 'Chief Investment Officer, Vertex Fund', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ศุภณัฐ รัตนวิชัย', role: 'Digital Asset Portfolio Manager', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ณิชาภา ตั้งวาณิชย์', role: 'Founder, Future Money Studio', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'กรณ์ภพ นิลวัฒน์', role: 'Real Asset Investment Director', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ศศิธร วัฒนวงศ์', role: 'Family Office Advisor', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'นราวิชญ์ อัครวัฒน์', role: 'Fintech Entrepreneur & Investor', image: 'profile-man.webp', imageY: '0%' },
            { name: 'อัญชลี รุ่งพิพัฒน์', role: 'Personal Finance Creator', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'ธนกฤต ศรีสวัสดิ์', role: 'Market Structure Specialist', image: 'profile-man.webp', imageY: '0%' },
            { name: 'พิมพ์มาดา วงศ์วาน', role: 'Founder, The Growth Playbook', image: 'profile-woman.webp', imageY: '0%' },
            { name: 'กวินท์ สุวรรณเมธา', role: 'Macroeconomic Research Director', image: 'profile-man.webp', imageY: '0%' },
            { name: 'ชญานิศ วงศ์วัฒนา', role: 'Wealth Innovation Consultant', image: 'profile-woman.webp', imageY: '0%' },
        ],
    };

    const panels = Array.from(document.querySelectorAll('[data-speaker-day]'));

    const createSpeakerCard = ({
        name,
        role,
        image = 'profile-man.webp',
        imageY = '0%',
        imageWidth = 928,
        imageHeight = 1152,
    }, index) => {
        const card = document.createElement('article');

        card.className = 'speaker-card';
        card.style.setProperty('--speaker-order', String(index % 5));
        card.style.setProperty('--speaker-portrait-y', imageY);
        card.innerHTML = `
            <div class="speaker-card__portrait">
                <div class="speaker-card__frame">
                    <img src="images/speakers/${image}" width="${imageWidth}" height="${imageHeight}"
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
    let removeScrollEndListener = () => { };

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
            removeScrollEndListener = () => { };
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

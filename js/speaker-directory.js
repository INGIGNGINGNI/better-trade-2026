(() => {
    const speakerDays = {
        dayOne: [
            { name: 'ดร.ฐิติมา ชูเชิด', role: 'ผู้อำนวยการอาวุโส ผู้บริหารฝ่ายวิจัยเศรษฐกิจมหภาค, ศูนย์วิจัยเศรษฐกิจและธุรกิจ (SCB EIC)', image: 'day-1/D1-Dr.Thitima.webp', },
            { name: 'ดร.พิพัฒน์ เหลืองนฤมิตชัย', role: 'Lorem ipsum dolor sit amet.', image: 'day-1/D1-Pipat.webp', },
            { name: 'BILLKIN', role: 'Lorem ipsum dolor sit amet.', image: 'day-1/D1-Bilkin.webp', },
            { name: 'Winni', role: 'Lorem ipsum dolor sit amet.', image: 'day-1/D1-Winni.webp', },
            { name: 'คุณพสุธา ไดจิ อิเดะ', role: 'Head of business development , <br>efin group', image: 'day-1/D1-Phasutha.webp', },
            { name: 'คุณวิน พรหมแพทย์', role: 'ประธานกรรมการบริหาร <br>บลจ. กสิกรไทย จำกัด', image: 'day-1/D1-Win.webp', },
            { name: 'ดร.นิเวศน์ เหมวชิรวรากร', role: 'Lorem ipsum dolor sit amet.', image: 'day-1/D1-Dr.Nivet.webp', },
        ],
        dayTwo: [
            { name: 'คุณกวี ชูกิจเกษม', role: 'Chief Portfolio Advisory<br>ประธานเจ้าหน้าที่ สายการบริหารพอร์ตการลงทุน', image: 'day-2/D2-Kawee.webp' },
            { name: 'คุณณริดา มานะสมจิตร', role: 'Director, regional wealth solution: Icham pte Ltd<br>Director ฝ่าย Wealth Solutions ประจำภูมิภาค', image: 'day-2/D2-Narida.webp' },
            { name: 'คุณณฤทธิ์ โกสาลาทิพย์', role: 'กรรมการผู้จัดการ หัวหน้าสายงานที่ปรึกษาและบริหารการลงทุนลูกค้าบุคคล บริษัทหลักทรัพย์เกียรตินาคินภัทร จำกัด (มหาชน)', image: 'day-2/D2-Narit.webp' },
            { name: 'คุณวชิรเมษฐ์ ธเนศสถิตพงศ์', role: 'Lorem ipsum dolor sit amet.', image: 'day-2/D2-Wachiramet.webp' },
            { name: 'คุณพิริยะ สัมพันธารักษ์', role: 'Ceo and Co Founder Right Shift', image: 'day-2/D2-Piriya.webp' },
            { name: 'คุณสุธน สิงหสิทธางกูร', role: 'Co-Founder, ABCD fund', image: 'day-2/D2-Jakky.webp' },
            { name: 'คุณเบียร์ วนนท์', role: 'Lorem ipsum dolor sit amet.', image: 'day-2/D2-Beerwanon.webp' },
        ],
    };

    const panels = Array.from(document.querySelectorAll('[data-speaker-day]'));

    const createSpeakerCard = ({
        name,
        role = '',
        image,
        imageY = '0%',
        imageScale = 1,
        imageWidth,
        imageHeight,
    }, index) => {
        const card = document.createElement('article');
        const isDayOnePortrait = image.startsWith('day-1/');
        const isDayTwoPortrait = image.startsWith('day-2/');
        const intrinsicWidth = imageWidth || (isDayOnePortrait ? 960 : 928);
        const intrinsicHeight = imageHeight || (isDayOnePortrait ? 1200 : (isDayTwoPortrait ? 1204 : 1152));

        card.className = 'speaker-card';
        card.style.setProperty('--speaker-order', String(index % 5));
        card.style.setProperty('--speaker-portrait-y', imageY);
        card.style.setProperty('--speaker-portrait-scale', String(imageScale));
        card.innerHTML = `
            <div class="speaker-card__portrait">
                <div class="speaker-card__frame">
                    <img src="images/speakers/${image}" width="${intrinsicWidth}" height="${intrinsicHeight}"
                        loading="lazy" decoding="async" alt="${name}">
                </div>
            </div>
            <div class="speaker-card__meta">
                <h3>${name}</h3>
                ${role ? `<p>${role}</p>` : ''}
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

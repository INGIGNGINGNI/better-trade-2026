(() => {
    const speakerDays = {
        dayOne: [
            ['กิตติพงศ์ วัฒนชัย', 'Chief Investment Strategist, Horizon Capital'],
            ['พิมพ์ชนก รัตนกุล', 'Founder & CEO, Future Wealth Lab'],
            ['ธนกร ศรีวัฒน์', 'Managing Director, Atlas Securities'],
            ['อรทัย ตั้งพิพัฒน์', 'Head of Digital Assets, NovaX'],
            ['ชยพล เกียรติไพบูลย์', 'Partner, Momentum Ventures'],
            ['ณัฐชา วงศ์ประเสริฐ', 'Economist & Market Commentator'],
            ['วรเมธ ลิ้มวัฒนะ', 'Chief Technology Officer, Finverse'],
            ['ศิริพร บุญยืน', 'Director of Sustainable Investment'],
            ['ภาคิน อัครเดช', 'Founder, New Economy Research'],
            ['ลลิตา จารุวัฒน์', 'Private Wealth Advisor'],
            ['ปกรณ์ สุวรรณกิจ', 'Global Macro Fund Manager'],
            ['รมิดา พัฒนโชติ', 'Co-founder, Wealth for Everyone'],
            ['ธีรภัทร ชาญวิทย์', 'Digital Asset Research Lead'],
            ['นภัสสร วัฒนศิริ', 'CEO, Capital Design Studio'],
            ['อธิป ตั้งธนกิจ', 'Commodity Investment Specialist'],
            ['ชุติมา รุ่งเรืองผล', 'Managing Partner, Bright Future Fund'],
            ['กฤตภาส เมธากุล', 'AI & Quantitative Strategy Lead'],
            ['พิชญา พงศ์พาณิชย์', 'Financial Educator & Author'],
            ['วสุธร อินทรรักษ์', 'Chief Economist, Meridian Group'],
            ['รวิสรา ธรรมคุณ', 'Founder, Purposeful Portfolio'],
        ],
        dayTwo: [
            ['ภานุวัฒน์ วีระกุล', 'Chief Executive Officer, Quantum Wealth'],
            ['กัญญารัตน์ อุดมทรัพย์', 'Managing Partner, Northstar Ventures'],
            ['สรวิศ ชาญธนกิจ', 'Global Equity Portfolio Manager'],
            ['วริศรา เทพหัสดิน', 'Head of Alternative Investments'],
            ['ณรงค์ฤทธิ์ วัฒนาพงศ์', 'Founder, Digital Economy Forum'],
            ['ปิยะนุช สุขเกษม', 'Sustainable Finance Director'],
            ['ธนวัฒน์ ชัยประสิทธิ์', 'AI Investment Researcher'],
            ['มนัสวี รุ่งกิจ', 'Private Market Strategist'],
            ['ชลธิชา สกุลทอง', 'Financial Technology Entrepreneur'],
            ['อัครเดช พัฒนวงศ์', 'Chief Investment Officer, Vertex Fund'],
            ['ศุภณัฐ รัตนวิชัย', 'Digital Asset Portfolio Manager'],
            ['ณิชาภา ตั้งวาณิชย์', 'Founder, Future Money Studio'],
            ['กรณ์ภพ นิลวัฒน์', 'Real Asset Investment Director'],
            ['ศศิธร วัฒนวงศ์', 'Family Office Advisor'],
            ['นราวิชญ์ อัครวัฒน์', 'Fintech Entrepreneur & Investor'],
            ['อัญชลี รุ่งพิพัฒน์', 'Personal Finance Creator'],
            ['ธนกฤต ศรีสวัสดิ์', 'Market Structure Specialist'],
            ['พิมพ์มาดา วงศ์วาน', 'Founder, The Growth Playbook'],
            ['กวินท์ สุวรรณเมธา', 'Macroeconomic Research Director'],
            ['ชญานิศ วงศ์วัฒนา', 'Wealth Innovation Consultant'],
        ],
    };

    const panels = Array.from(document.querySelectorAll('[data-speaker-day]'));
    /* ผังเชิงบรรณาธิการของกริด 3 คอลัมน์: 20 ชื่อกระจายลง 8 แถว สลับแถวเต็ม
       กับแถวที่เว้นหนึ่งช่อง และย้ายตำแหน่งช่องว่างไปเรื่อย ๆ (กลาง–ซ้าย–ขวา–กลาง)
       แถว 5–6 เว้นคนละฝั่งติดกัน ช่องว่างจึงพาดเป็นแนวทแยงแทนที่จะเป็นรูโบ๋ช่องเดียว */
    const editorialLayout = [
        [1, 1], [2, 1], [3, 1],
        [1, 2], [3, 2],
        [1, 3], [2, 3], [3, 3],
        [1, 4], [2, 4], [3, 4],
        [2, 5], [3, 5],
        [1, 6], [2, 6],
        [1, 7], [2, 7], [3, 7],
        [1, 8], [3, 8],
    ];

    /* Each portrait is shot with a different amount of empty space above the head
       (74px–111px on a 793px canvas). Offsetting the 4:5 crop by these amounts lands
       every head the same short distance below the top edge of the card. */
    const portraitFocusY = ['10.2%', '20.9%', '8.1%', '20.5%', '13.4%'];

    const createSpeakerCard = ([name, role], index) => {
        const card = document.createElement('article');
        const imageIndex = index % 5 + 1;
        const [column, row] = editorialLayout[index];

        card.className = 'speaker-card';
        card.style.setProperty('--speaker-order', String(index % 5));
        card.style.setProperty('--speaker-column', String(column));
        card.style.setProperty('--speaker-row', String(row));
        card.style.setProperty('--speaker-portrait-y', portraitFocusY[imageIndex - 1]);
        card.innerHTML = `
            <div class="speaker-card__portrait">
                <img src="images/speakers/speaker-${imageIndex}.png" width="397" height="793"
                    loading="lazy" decoding="async" alt="${name}">
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
       แยกไฟล์กันเพราะคนละ block ของ BEM แต่ logic ตรงกันทุกขั้น */
    const daySwitcher = document.querySelector('.speaker__day-switcher-inner');
    const dayLinks = daySwitcher
        ? Array.from(daySwitcher.querySelectorAll('.speaker__day-switch[role="tab"]'))
        : [];
    const dayPanels = Array.from(document.querySelectorAll('[data-speaker-day-panel]'));

    if (!dayLinks.length || !dayPanels.length) return;

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

    const updateDaySwitch = (activeLink) => {
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
        });

        updateDaySwitch(activeLink);

        /* ให้ช่วงสเปกตรัมบนเส้นนำสายตาเลื่อนไปเกาะฝั่งของวันที่เลือก */
        daySwitcher.dataset.activeDay = activePanel.dataset.speakerDayPanel || '';

        if (revealTop) {
            revealPanelTop(activePanel);
        } else {
            refreshSpeakerMotion(activePanel);
        }

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

    const hashLink = dayLinks.find((link) => link.getAttribute('href') === window.location.hash);
    const initialLink = hashLink
        || dayLinks.find((link) => link.getAttribute('aria-current') === 'true')
        || dayLinks[0];

    activateDay(initialLink, { updateHistory: false, revealTop: false });

    /* เปิดหน้าด้วย #speaker-day-two ตรง ๆ: ตอน browser เลื่อนหา target แผงยัง hidden
       (ไม่มีขนาด) จึงไม่ได้เลื่อนจริง สั่งซ้ำตอน load เผื่อ preloader ล็อกสกอลล์อยู่ */
    if (hashLink) {
        const panel = document.getElementById(hashLink.getAttribute('aria-controls'));

        if (panel) {
            const scrollToPanel = () => panel.scrollIntoView();

            scrollToPanel();
            window.addEventListener('load', scrollToPanel, { once: true });
        }
    }
})();

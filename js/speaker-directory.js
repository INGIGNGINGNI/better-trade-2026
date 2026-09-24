(() => {
    const speakerDays = {
        dayOne: [
            {
                name: 'ดร.นิเวศน์ เหมวชิรวรากร',
                role: 'นักลงทุนหุ้นเน้นคุณค่า (VI)',
                image: 'day-1/D1-ดร.นิเวศน์-เหมวชิรวรากร.webp',
                overviewClass: 'niwes',
            },
            {
                name: 'ดร.พิพัฒน์ เหลืองนฤมิตชัย',
                role: 'ผู้ช่วยกรรมการผู้จัดการ หัวหน้านักเศรษฐศาสตร์ (Chief Economist) และหัวหน้าฝ่ายวิเคราะห์เศรษฐกิจและการลงทุน กลุ่มธุรกิจการเงิน<br class="d-none d-md-block">เกียรตินาคินภัทร ธนาคาร<br class="d-none d-md-block d-xl-none">เกียรตินาคินภัทร จำกัด (มหาชน)',
                image: 'day-1/D1-ดร.พิพัฒน์-เหลืองนฤมิตชัย.webp',
                overviewClass: 'pipat',
            },
            {
                name: 'ดร.ฐิติมา ชูเชิด',
                role: 'ผู้อำนวยการอาวุโส ผู้บริหารฝ่ายวิจัยเศรษฐกิจมหภาค, ศูนย์วิจัยเศรษฐกิจและธุรกิจ (SCB EIC)',
                image: 'day-1/D1-ดร.ฐิติมา-ชูเชิด.webp',
                overviewClass: 'thitima',
            },
            {
                name: 'คุณธนรัชต์ พสวงศ์',
                role: 'ประธานเจ้าหน้าที่บริหาร กลุ่มฮั่วเซ่งเฮง',
                image: 'day-1/D1-ธนรัชต์-พสวงศ์.webp',
                overviewClass: 'thanarat',
            },
            {
                name: 'คุณมทินา วัชรวราทร',
                role: 'CFA, Head of Investment Strategy, KAsset',
                image: 'day-1/D1-มทินา-วัชรวราทร.webp',
                overviewClass: 'matina',
            },
            {
                name: 'คุณอภิชัย เอี่ยมไพศาล',
                role: 'Research and Listing Manager, BINANCE TH Academy',
                image: 'day-1/D1-อภิชัย-เอี่ยมไพศาล.webp',
                overviewClass: 'apichai',
            },
            {
                name: 'คุณศุภวิชญ์ พูลเพิ่มทรัพย์',
                role: 'Investment Analyst, BINANCE TH Academy',
                image: 'day-1/D1-ศุภวิชญ์-พูลเพิ่มทรัพย์.webp',
                overviewClass: 'supawit',
            },
            {
                name: 'คุณนภดนัย พัฒนาภิวัฒน์',
                role: 'Co-Owner & Second-Generation Successor บริษัท เซลลักซ์ เวนเจอร์ส จำกัด',
                image: 'day-1/D1-นภดนัย-พัฒนาภิวัฒน์.webp',
                overviewClass: 'noppadanai',
            },
            {
                name: 'คุณกฤช แก้วสุวรรณ',
                role: 'Co-Founder Card World',
                image: 'day-1/D1-กฤช-แก้วสุวรรณ.webp',
                overviewClass: 'krit',
            },
            {
                name: 'คุณพสุธา ไดจิ อิเดะ',
                role: 'Head of Business Development, efin Group',
                image: 'day-1/D1-พสุธา-ไดจิ-อิเดะ.webp',
                overviewClass: 'pasutha',
            },
            // {
            //     name: 'คุณวิน พรหมแพทย์',
            //     role: 'ประธานกรรมการบริหาร บลจ. กสิกรไทย จำกัด',
            //     image: 'day-1/D1-วิน-พรหมแพทย์.webp',
            // },
            // {
            //     name: 'BILLKIN',
            //     role: 'Lorem ipsum dolor sit amet.',
            //     image: 'day-1/D1-บิวกิ้น.webp',
            //     overview: false,
            // },
            // {
            //     name: 'Winni',
            //     role: 'Lorem ipsum dolor sit amet.',
            //     image: 'day-1/D1-วินนี่.webp',
            //     overview: false,
            // },
        ],
        dayTwo: [
            {
                name: 'คุณกวี ชูกิจเกษม',
                role: 'Chief Portfolio Advisory ประธานเจ้าหน้าที่ สายการบริหารพอร์ตการลงทุน',
                image: 'day-2/D2-กวี-ชูกิจเกษม.webp',
                overviewClass: 'kawee',
            },
            {
                name: 'คุณณริดา มานะสมจิตร',
                role: 'Director, regional wealth solution: <br class="d-none d-xl-block">Icham pte Ltd',
                image: 'day-2/D2-ณริดา-มานะสมจิตร.webp',
                overviewClass: 'narida',
            },
            {
                name: 'คุณณฤทธิ์ โกสาลาทิพย์',
                role: 'กรรมการผู้จัดการ หัวหน้าสายงานที่ปรึกษาและบริหารการลงทุนลูกค้าบุคคล บริษัทหลักทรัพย์<br class="d-none d-xxl-block">เกียรตินาคินภัทร จำกัด (มหาชน)',
                image: 'day-2/D2-ณฤทธิ์-โกสาลาทิพย์.webp',
                overviewClass: 'narit',
            },
            {
                name: 'คุณพิริยะ สัมพันธารักษ์',
                role: 'CEO and Co-Founder Right Shift',
                image: 'day-2/D2-พิริยะ-สัมพันธารักษ์.webp',
                overviewClass: 'piriya',
            },
            {
                name: 'คุณวชิรเมษฐ์ <br class="d-none d-lg-block d-xl-none">ธเนศสถิตพงศ์',
                role: 'Head of Investment Analytics & Innovation, efin Group',
                image: 'day-2/D2-วชิรเมษฐ์-ธเนศสถิตพงศ์.webp',
                overviewClass: 'wachiramet',
            },
            {
                name: 'คุณ Jekky สุธน <br class="d-none d-lg-block d-xl-none">สิงหสิทธางกูร',
                role: 'Co-Founder, ABCD Fund',
                image: 'day-2/D2-สุธน-สิงหสิทธางกูร.webp',
                overviewClass: 'suthon',
            },
            {
                name: 'คุณเบียร์ วนนท์ วรรณป้าน',
                role: 'Full-Time Trader',
                image: 'day-2/D2-วนนท์-วรรณป้าน.webp',
                overviewClass: 'wanon',
            },
            {
                name: 'คุณกฤษฎิ์ ชวาลรัตน์',
                role: 'Property Developer & Collector',
                image: 'day-2/D2-กฤษฎิ์-ชวาลรัตน์.webp',
                overviewClass: 'krits',
            },
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

    /* ภาพรวม Speaker ใต้ Featured Topics ใช้ข้อมูลชุดเดียวกับ directory ด้านล่าง */
    const overviewGrid = document.querySelector('[data-speaker-overview]');
    const overviewSection = document.querySelector('#speaker-overview');
    const overviewScroller = overviewGrid?.closest('.speaker-overview__scroller');
    const overviewScrollOverlay = document.querySelector('[data-speaker-overview-scroll-overlay]');
    const overviewScrollLottie = document.querySelector('[data-speaker-overview-scroll-lottie]');
    const overviewPicker = document.querySelector('[data-speaker-overview-picker]');
    const overviewTrigger = overviewPicker?.querySelector('[data-speaker-overview-trigger]');
    const overviewPanel = overviewPicker?.querySelector('[data-speaker-overview-panel]');
    const overviewViewButtons = Array.from(document.querySelectorAll('[data-speaker-overview-view]'));
    const overviewCompactCount = document.querySelector('[data-speaker-overview-compact-count]');

    if (overviewGrid && overviewSection && !overviewSection.hidden) {
        const overviewSpeakers = Object.values(speakerDays)
            .flat()
            .filter(({ overview = true }) => overview);
        const expandedSpeakerCount = 36;
        let currentOverviewLayout = 'compact';
        let renderedOverviewRowCount = 0;
        let overviewResizeFrame = 0;
        let overviewIsVisible = false;
        let overviewIsScrollable = false;
        let scrollOverlayTimer = 0;
        let scrollAnimationReady = false;
        let lastOverviewScrollLeft = overviewScroller?.scrollLeft || 0;
        const layoutsWithShownScrollOverlay = new Set();
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const overviewScrollAnimation = overviewScrollLottie && window.lottie
            ? window.lottie.loadAnimation({
                container: overviewScrollLottie,
                renderer: 'svg',
                loop: true,
                autoplay: false,
                path: 'images/animations/speaker-scroll-slide.json',
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid meet',
                },
            })
            : null;

        const playOverviewScrollAnimation = () => {
            if (!overviewScrollAnimation || !scrollAnimationReady) return;

            if (reducedMotion.matches) {
                overviewScrollAnimation.goToAndStop(0, true);
                return;
            }

            overviewScrollAnimation.goToAndPlay(0, true);
        };

        overviewScrollAnimation?.addEventListener('DOMLoaded', () => {
            scrollAnimationReady = true;
            if (overviewScrollOverlay?.classList.contains('is-visible')) {
                playOverviewScrollAnimation();
            }
        });

        const hideOverviewScrollOverlay = () => {
            window.clearTimeout(scrollOverlayTimer);
            overviewScrollOverlay?.classList.remove('is-visible');
            overviewScrollAnimation?.stop();
        };

        const showOverviewScrollOverlay = () => {
            if (!overviewScrollOverlay
                || !overviewIsVisible
                || !overviewIsScrollable
                || layoutsWithShownScrollOverlay.has(currentOverviewLayout)) return;

            layoutsWithShownScrollOverlay.add(currentOverviewLayout);
            overviewScrollOverlay.classList.add('is-visible');
            playOverviewScrollAnimation();
            scrollOverlayTimer = window.setTimeout(hideOverviewScrollOverlay, 5100);
        };

        const updateOverviewScrollerState = (speakerCount) => {
            if (!overviewScroller) return;

            const isScrollable = overviewScroller.scrollWidth > overviewScroller.clientWidth + 1;
            overviewIsScrollable = isScrollable;
            overviewScroller.classList.toggle('is-scrollable', isScrollable);

            if (isScrollable) {
                requestAnimationFrame(showOverviewScrollOverlay);
            } else {
                hideOverviewScrollOverlay();
            }

            if (isScrollable) {
                overviewScroller.tabIndex = 0;
                overviewScroller.setAttribute(
                    'aria-label',
                    `รายชื่อ Speaker ${speakerCount} คน เลื่อนแนวนอนเพื่อดูเพิ่มเติม`,
                );
                return;
            }

            overviewScroller.removeAttribute('tabindex');
            overviewScroller.setAttribute('aria-label', `รายชื่อ Speaker ${speakerCount} คน`);
        };

        if (overviewCompactCount) {
            overviewCompactCount.textContent = String(overviewSpeakers.length);
        }

        const renderOverview = (layout = 'compact') => {
            const isExpanded = layout === 'expanded';
            currentOverviewLayout = layout;
            overviewSection.dataset.speakerOverviewLayout = layout;

            const overviewRowCount = Number.parseInt(
                getComputedStyle(overviewSection).getPropertyValue('--speaker-overview-rows'),
                10,
            ) || 3;
            renderedOverviewRowCount = overviewRowCount;

            const visibleSpeakers = isExpanded
                ? Array.from(
                    { length: expandedSpeakerCount },
                    (_, index) => overviewSpeakers[index % overviewSpeakers.length],
                )
                : overviewSpeakers;
            const overviewFragment = document.createDocumentFragment();

            visibleSpeakers.forEach(({ name, image, overviewClass }, index) => {
                const card = document.createElement('article');
                const portrait = document.createElement('img');

                card.className = 'speaker-overview__card';
                card.classList.add(`speaker-overview__card--${overviewClass}`);
                card.setAttribute('role', 'listitem');
                card.setAttribute('aria-label', name);
                card.style.setProperty('--speaker-overview-order', String(index));

                const rowIndex = index % overviewRowCount;
                const columnIndex = Math.floor(index / overviewRowCount);
                const spectrumIndex = ((columnIndex + (rowIndex * 2)) % 6) + 1;
                card.style.setProperty(
                    '--speaker-overview-circle-color',
                    `var(--color-kv-spectrum-${spectrumIndex})`,
                );

                const originalPortraitSrc = `images/speakers/${image}`;
                const overviewPortraitName = image.split('/').pop();

                portrait.src = `images/speakers/overview/${overviewPortraitName}`;
                portrait.width = 696;
                portrait.height = 904;
                portrait.loading = 'lazy';
                portrait.decoding = 'async';
                portrait.alt = name;
                portrait.addEventListener('error', () => {
                    portrait.src = originalPortraitSrc;
                }, { once: true });

                card.appendChild(portrait);
                overviewFragment.appendChild(card);
            });

            overviewGrid.replaceChildren(overviewFragment);

            if (overviewScroller) {
                lastOverviewScrollLeft = 0;
                overviewScroller.scrollLeft = 0;
                requestAnimationFrame(() => updateOverviewScrollerState(visibleSpeakers.length));
            }

            overviewViewButtons.forEach((button) => {
                const isActive = button.dataset.speakerOverviewView === layout;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });

            overviewTrigger?.setAttribute(
                'aria-label',
                `เลือกรูปแบบ Speaker ขณะนี้แสดง ${isExpanded ? 36 : overviewSpeakers.length} Speakers`,
            );
        };

        const setOverviewPickerOpen = (open) => {
            if (!overviewPicker || !overviewTrigger || !overviewPanel) return;

            overviewPicker.classList.toggle('is-open', open);
            overviewTrigger.setAttribute('aria-expanded', String(open));
            overviewPanel.setAttribute('aria-hidden', String(!open));
            overviewViewButtons.forEach((button) => {
                button.tabIndex = open ? 0 : -1;
            });

            if (open) {
                overviewViewButtons.find((button) => button.classList.contains('is-active'))?.focus();
            }
        };

        overviewViewButtons.forEach((button) => {
            button.addEventListener('click', () => {
                renderOverview(button.dataset.speakerOverviewView);
                setOverviewPickerOpen(false);
                overviewTrigger?.focus();
            });
        });

        renderOverview('compact');
        setOverviewPickerOpen(false);

        if (overviewScroller && overviewScrollOverlay && 'IntersectionObserver' in window) {
            const overviewScrollOverlayObserver = new IntersectionObserver(([entry]) => {
                /* Wait until the speaker cards are materially inside the viewport.
                   This prevents the hint animation from finishing while the user is
                   still scrolling through the section above. */
                overviewIsVisible = entry.isIntersecting && entry.intersectionRatio >= 0.6;

                if (overviewIsVisible) {
                    showOverviewScrollOverlay();
                } else {
                    hideOverviewScrollOverlay();
                }
            }, {
                threshold: [0, 0.6],
                rootMargin: '0px 0px -8% 0px',
            });

            overviewScrollOverlayObserver.observe(overviewScroller);
        } else {
            overviewIsVisible = true;
            showOverviewScrollOverlay();
        }

        overviewScroller?.addEventListener('scroll', () => {
            const nextScrollLeft = overviewScroller.scrollLeft;
            const hasActuallyScrolled = Math.abs(nextScrollLeft - lastOverviewScrollLeft) > 0.5;
            lastOverviewScrollLeft = nextScrollLeft;

            if (hasActuallyScrolled) hideOverviewScrollOverlay();
        }, { passive: true });

        overviewTrigger?.addEventListener('click', () => {
            setOverviewPickerOpen(!overviewPicker.classList.contains('is-open'));
        });

        document.addEventListener('pointerdown', (event) => {
            if (!overviewPicker?.classList.contains('is-open') || overviewPicker.contains(event.target)) return;
            setOverviewPickerOpen(false);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || !overviewPicker?.classList.contains('is-open')) return;
            setOverviewPickerOpen(false);
            overviewTrigger?.focus();
        });

        if (overviewPicker && overviewTrigger && 'IntersectionObserver' in window) {
            const overviewPickerObserver = new IntersectionObserver(([entry]) => {
                const isVisible = entry.isIntersecting;

                overviewSection.classList.toggle('is-view-switch-visible', isVisible);
                overviewPicker.setAttribute('aria-hidden', String(!isVisible));
                overviewTrigger.tabIndex = isVisible ? 0 : -1;

                if (!isVisible) setOverviewPickerOpen(false);
            }, { threshold: 0.01 });

            overviewPickerObserver.observe(overviewSection);
        } else {
            overviewSection.classList.add('is-view-switch-visible');
        }

        window.addEventListener('resize', () => {
            window.cancelAnimationFrame(overviewResizeFrame);
            overviewResizeFrame = window.requestAnimationFrame(() => {
                const nextRowCount = Number.parseInt(
                    getComputedStyle(overviewSection).getPropertyValue('--speaker-overview-rows'),
                    10,
                ) || 3;

                if (nextRowCount !== renderedOverviewRowCount) {
                    renderOverview(currentOverviewLayout);
                    return;
                }

                updateOverviewScrollerState(currentOverviewLayout === 'expanded'
                    ? expandedSpeakerCount
                    : overviewSpeakers.length);
            });
        }, { passive: true });
    }

    /* ---- ตัวสลับวัน: พฤติกรรมเดียวกับ agenda-tabs.js ----
       แยกไฟล์กันเพราะคนละ block ของ BEM แต่ logic ตรงกันทุกขั้น

       จอ ≥992px: Day 1 กับ Day 2 อยู่ในพื้นที่เลื่อนเดียวกันตลอด ตัวสลับวันเป็นแค่
       ลิงก์เลื่อนไปหาหัวข้อ + ตัวบอกตำแหน่งปัจจุบัน (scrollspy)
       จอ ≤991px: ใช้พฤติกรรมแท็บแบบเดิม โชว์ทีละวัน คลิกแล้วซ่อนอีกวันไปเลย */
    const daySwitcher = document.querySelector('.speaker__day-switcher-inner');
    const dayLinks = daySwitcher
        ? Array.from(daySwitcher.querySelectorAll('.speaker__day-switch'))
        : [];
    const dayPanels = Array.from(document.querySelectorAll('[data-speaker-day-panel]'));
    const mobileDaySwitcher = window.matchMedia('(max-width: 991px)');

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

    const revealTargetTop = (target, panel) => {
        window.clearTimeout(motionRefreshTimer);
        removeScrollEndListener();

        const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const distance = Math.abs(target.getBoundingClientRect().top - scrollMargin);
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

        target.scrollIntoView({
            block: 'start',
            behavior: reducedMotion.matches ? 'auto' : 'smooth',
        });

        if (reducedMotion.matches || distance <= 2) {
            requestAnimationFrame(completeReveal);
        }
    };

    const revealPanelTop = (panel) => revealTargetTop(panel, panel);

    /* ซ่อนวันที่ไม่ได้เลือกเฉพาะจอ ≤991px เท่านั้น จอใหญ่กว่านั้นโชว์ทั้งสองวันต่อกัน */
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

            /* ≤991px สลับวันแล้วเนื้อหาถูกสลับทั้งแผง พากลับไปหัวตัวสลับวันเหมือนเดิม
               จอใหญ่เลื่อนไปหาหัวข้อของวันนั้นในพื้นที่เลื่อนเดียวกัน */
            if (mobileDaySwitcher.matches) {
                const switcher = daySwitcher.closest('.speaker__day-switcher');
                revealTargetTop(switcher, panel);
            } else {
                revealPanelTop(panel);
            }

            history.replaceState(null, '', window.location.pathname + window.location.search);
        });
    });

    /* หาว่าแผงไหนควร active โดยวัดตำแหน่งสด ๆ ทุกครั้ง (ไม่แคช) — หน้านี้มี hero ที่
       คำนวณความสูงตัวเองแบบ async และการ์ด speaker เป็นรูป lazy-load ตำแหน่งจริงของ
       Day 2 จึงขยับหลังวัดครั้งแรก ค่าที่แคชไว้จะเพี้ยนจนสลับ active ก่อนเวลา
       แผงที่ถูกซ่อน (จอ ≤991px ที่โชว์ทีละวัน) มี offsetParent เป็น null ตัดออกไปเลย
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

    /* ข้ามเกณฑ์ 991px แล้วต้องจัดการ visibility ให้ตรงโหมดใหม่ก่อน แล้วค่อยวัด
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
       (จอ ≤991px) จึงไม่ได้เลื่อนจริง สั่งซ้ำตอน load เผื่อ preloader ล็อกสกอลล์อยู่ */
    if (hashLink) {
        const panel = panelForLink(hashLink);

        if (panel) {
            const scrollToPanel = () => panel.scrollIntoView();

            scrollToPanel();
            window.addEventListener('load', scrollToPanel, { once: true });
        }
    }
})();

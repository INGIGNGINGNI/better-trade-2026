(function () {
    const indicator = document.querySelector('.journey-indicator');
    if (!indicator) return;

    const title = indicator.querySelector('.journey-indicator__title');
    const route = [
        { id: 'concept', label: 'Concept' },
        { id: 'featured-topics', label: 'Topics' },
        { id: 'ticket', label: 'Ticket Price' },
        { id: 'playbook', label: 'Playbook' },
        { id: 'agenda', label: 'Agenda' },
        /* speaker, moderator, sponsor ถูกซ่อนไว้ก่อนสำหรับรอบ launch จริง — เอา route
           ของ section เหล่านี้ออกด้วย ไม่งั้น .filter(stop => stop.element) จะยังเจอ
           element อยู่ (แค่ display:none ไม่ใช่ถูกลบออกจาก DOM) กลายเป็นจุดค้างในแถบ
           journey-indicator ที่กดแล้วไม่มีอะไรให้เลื่อนไปหา */
        { id: 'expectation', label: 'Expectation' },
        { id: 'floor-plan', label: 'Floor Plan' },
        { id: 'past-event', label: 'Past Event' },
    ].map(stop => ({ ...stop, element: document.getElementById(stop.id) }))
        .filter(stop => stop.element);

    if (route.length < 2) return;

    const rail = indicator.querySelector('.journey-indicator__rail');
    const label = indicator.querySelector('.journey-indicator__label');
    /* data-header-theme="dark" คือ section เต็มจอที่ header ใช้ร่วมด้วย (ทั้ง section เป็น
       พื้นมืดจริง ๆ) ส่วน data-journey-theme="dark" ใช้แยกสำหรับจุดที่มืดแค่บางส่วนของ
       section เช่นภาพพื้นหลังด้านบนของ ticket ไม่ผูกกับ header เพราะพื้นที่ตรงนั้นไม่ใช่
       ทั้ง section ที่เป็นพื้นมืด แค่ผูกกับ header จะทำให้ header สลับเป็นมืดทั้งที่พื้นล่าง
       ของ ticket section ยังเป็นสีขาวอยู่ */
    const darkSections = [...document.querySelectorAll('[data-header-theme="dark"], [data-journey-theme="dark"]')];

    if (!rail || !label) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeIndex = -1;
    let frameId = null;
    let labelRevealTimer = null;

    function getHeaderOffset() {
        const rootStyle = getComputedStyle(document.documentElement);
        const tokenHeight = Number.parseFloat(rootStyle.getPropertyValue('--header-height'));
        if (Number.isFinite(tokenHeight) && tokenHeight > 0) return tokenHeight;

        const header = document.getElementById('site-header');
        const headerHeight = header?.getBoundingClientRect().height || 0;
        return Number.isFinite(headerHeight) ? headerHeight : 0;
    }

    function measure() {
        if (title) {
            indicator.style.setProperty('--journey-title-length', `${Math.ceil(title.scrollWidth)}px`);
        }
        requestRender();
    }

    function hideLabel() {
        window.clearTimeout(labelRevealTimer);
        label.classList.remove('is-visible', 'is-changing');
        indicator.classList.remove('is-marker-visible', 'is-marker-changing');
    }

    function setActiveStop(nextIndex) {
        if (nextIndex === activeIndex) return;
        activeIndex = nextIndex;
        label.textContent = route[activeIndex].label;
        hideLabel();

        window.requestAnimationFrame(() => {
            label.classList.add('is-visible');
            indicator.classList.add('is-marker-visible');
            if (!reducedMotion.matches) {
                label.classList.add('is-changing');
                indicator.classList.add('is-marker-changing');
            }
        });

        labelRevealTimer = window.setTimeout(hideLabel, 1600);
    }

    function getDarkRects() {
        return darkSections
            .map(section => section.getBoundingClientRect())
            .filter(rect => rect.bottom > 0 && rect.top < window.innerHeight);
    }

    function isPointOnDark(x, y, darkRects) {
        return darkRects.some(rect => (
            x >= rect.left
            && x <= rect.right
            && y >= rect.top
            && y < rect.bottom
        ));
    }

    function updateDynamicColors(routeProgress) {
        const railRect = rail.getBoundingClientRect();
        const railX = railRect.left + (railRect.width / 2);
        const markerY = railRect.top + (railRect.height * routeProgress);
        const darkRects = getDarkRects();

        indicator.classList.toggle(
            'is-marker-on-dark',
            isPointOnDark(railX, markerY, darkRects),
        );

        const lightColor = 'rgba(17, 19, 24, 0.20)';
        const darkColor = 'rgba(255, 255, 255, 0.40)';
        const stops = [{ position: 0, color: lightColor }];

        darkRects
            .map(rect => ({
                start: Math.max(0, Math.min(1, (rect.top - railRect.top) / railRect.height)),
                end: Math.max(0, Math.min(1, (rect.bottom - railRect.top) / railRect.height)),
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
        indicator.style.setProperty(
            '--journey-track-background',
            `linear-gradient(to bottom, ${gradientStops})`,
        );

        if (title) {
            const titleRect = title.getBoundingClientRect();
            const titleLightColor = 'var(--color-neutral-900)';
            const titleDarkColor = 'var(--color-neutral-0)';
            const titleStops = [{ position: 0, color: titleLightColor }];

            darkRects
                .filter(rect => rect.right > titleRect.left && rect.left < titleRect.right)
                .map(rect => ({
                    // The title is rotated -90deg: its local left-to-right axis runs
                    // from the viewport bottom upward, so the section range is reversed.
                    start: Math.max(0, Math.min(1, (titleRect.bottom - rect.bottom) / titleRect.height)),
                    end: Math.max(0, Math.min(1, (titleRect.bottom - rect.top) / titleRect.height)),
                }))
                .filter(range => range.end > range.start)
                .sort((a, b) => a.start - b.start)
                .forEach(range => {
                    titleStops.push(
                        { position: range.start, color: titleLightColor },
                        { position: range.start, color: titleDarkColor },
                        { position: range.end, color: titleDarkColor },
                        { position: range.end, color: titleLightColor },
                    );
                });

            titleStops.push({ position: 1, color: titleLightColor });
            const titleGradientStops = titleStops
                .map(stop => `${stop.color} ${(stop.position * 100).toFixed(3)}%`)
                .join(', ');
            indicator.style.setProperty(
                '--journey-title-background',
                `linear-gradient(to right, ${titleGradientStops})`,
            );
        }
    }

    function render() {
        frameId = null;

        /* Read live viewport geometry instead of cached document offsets. Hero changes
           its scroll height after the runner sequence completes, which moves every route
           section without resizing those sections; ResizeObserver therefore cannot tell
           us that the old anchors are stale. Live rects keep visibility and labels tied
           to the section that is actually below the sticky header. */
        const sectionRects = route.map(stop => stop.element.getBoundingClientRect());
        const activationLine = getHeaderOffset() + 1;
        const progressLine = Math.min(window.innerHeight * 0.28, getHeaderOffset() + 160);
        const isSuppressed = document.body.classList.contains('is-loading')
            || document.body.classList.contains('menu-open')
            || document.body.classList.contains('menu-closing');
        const isWithinRoute = sectionRects[0].top <= activationLine
            && sectionRects[sectionRects.length - 1].bottom >= activationLine;

        indicator.classList.toggle('is-visible', isWithinRoute && !isSuppressed);
        if (!isWithinRoute) {
            activeIndex = -1;
            hideLabel();
            return;
        }

        let nextActiveIndex = sectionRects.length - 1;
        for (let index = 0; index < sectionRects.length - 1; index += 1) {
            if (activationLine < sectionRects[index + 1].top) {
                nextActiveIndex = index;
                break;
            }
        }

        const nextIndex = Math.min(nextActiveIndex + 1, sectionRects.length - 1);
        const segmentStart = sectionRects[nextActiveIndex].top;
        const segmentEnd = nextActiveIndex === nextIndex
            ? sectionRects[nextActiveIndex].bottom
            : sectionRects[nextIndex].top;
        const segmentProgress = Math.min(1, Math.max(0, (progressLine - segmentStart) / Math.max(1, segmentEnd - segmentStart)));
        const routeProgress = nextActiveIndex === route.length - 1
            ? 1
            : (nextActiveIndex + segmentProgress) / (route.length - 1);

        indicator.style.setProperty('--journey-progress', `${(routeProgress * 100).toFixed(2)}%`);
        updateDynamicColors(routeProgress);
        setActiveStop(nextActiveIndex);
    }

    function requestRender() {
        if (frameId !== null) return;
        frameId = window.requestAnimationFrame(render);
    }

    const resizeObserver = 'ResizeObserver' in window
        ? new ResizeObserver(measure)
        : null;
    const heroScroller = document.getElementById('scroller');
    if (heroScroller) resizeObserver?.observe(heroScroller);
    route.forEach(stop => resizeObserver?.observe(stop.element));

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    document.fonts?.ready.then(measure);

    const bodyClassObserver = new MutationObserver(measure);
    bodyClassObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });

    measure();
}());

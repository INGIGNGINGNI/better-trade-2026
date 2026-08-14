(function () {
    const indicator = document.querySelector('.journey-indicator');
    if (!indicator) return;

    const title = indicator.querySelector('.journey-indicator__title');
    const route = [
        { id: 'concept', label: 'Concept' },
        { id: 'featured-topics', label: 'Topics' },
        { id: 'ticket', label: 'Ticket' },
        { id: 'agenda', label: 'Agenda' },
        { id: 'expectation', label: 'Experience' },
        { id: 'floor-plan', label: 'Floor Plan' },
        { id: 'speaker', label: 'Speakers' },
        { id: 'moderator', label: 'Moderators' },
        { id: 'past-event', label: 'Past Event' },
    ].map(stop => ({ ...stop, element: document.getElementById(stop.id) }))
        .filter(stop => stop.element);

    if (route.length < 2) return;

    const label = indicator.querySelector('.journey-indicator__label');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let sectionAnchors = [];
    let routeEnd = 0;
    let activeIndex = -1;
    let frameId = null;
    let labelRevealTimer = null;

    function measure() {
        if (title) {
            indicator.style.setProperty('--journey-title-length', `${Math.ceil(title.scrollWidth)}px`);
        }
        sectionAnchors = route.map(stop => stop.element.getBoundingClientRect().top + window.scrollY);
        const lastSection = route[route.length - 1].element;
        routeEnd = lastSection.getBoundingClientRect().bottom + window.scrollY;
        requestRender();
    }

    function hideLabel() {
        window.clearTimeout(labelRevealTimer);
        label.classList.remove('is-visible', 'is-changing');
    }

    function setActiveStop(nextIndex) {
        if (nextIndex === activeIndex) return;
        activeIndex = nextIndex;
        label.textContent = route[activeIndex].label;
        hideLabel();

        window.requestAnimationFrame(() => {
            label.classList.add('is-visible');
            if (!reducedMotion.matches) label.classList.add('is-changing');
        });

        labelRevealTimer = window.setTimeout(hideLabel, 1600);
    }

    function render() {
        frameId = null;

        const marker = window.scrollY + (window.innerHeight * 0.46);
        const isSuppressed = document.body.classList.contains('is-loading')
            || document.body.classList.contains('menu-open')
            || document.body.classList.contains('menu-closing');
        const isWithinRoute = marker >= sectionAnchors[0] && marker <= routeEnd;

        indicator.classList.toggle('is-visible', isWithinRoute && !isSuppressed);
        if (!isWithinRoute) {
            activeIndex = -1;
            hideLabel();
            return;
        }

        let nextActiveIndex = sectionAnchors.length - 1;
        for (let index = 0; index < sectionAnchors.length - 1; index += 1) {
            if (marker < sectionAnchors[index + 1]) {
                nextActiveIndex = index;
                break;
            }
        }

        const nextIndex = Math.min(nextActiveIndex + 1, sectionAnchors.length - 1);
        const segmentStart = sectionAnchors[nextActiveIndex];
        const segmentEnd = nextActiveIndex === nextIndex
            ? routeEnd
            : sectionAnchors[nextIndex];
        const segmentProgress = Math.min(1, Math.max(0, (marker - segmentStart) / Math.max(1, segmentEnd - segmentStart)));
        const routeProgress = nextActiveIndex === route.length - 1
            ? 1
            : (nextActiveIndex + segmentProgress) / (route.length - 1);

        const isOnDark = route[nextActiveIndex].element.dataset.headerTheme === 'dark';
        indicator.style.setProperty('--journey-progress', `${(routeProgress * 100).toFixed(2)}%`);
        indicator.classList.toggle('is-on-dark', isOnDark);
        setActiveStop(nextActiveIndex);
    }

    function requestRender() {
        if (frameId !== null) return;
        frameId = window.requestAnimationFrame(render);
    }

    const resizeObserver = 'ResizeObserver' in window
        ? new ResizeObserver(measure)
        : null;
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

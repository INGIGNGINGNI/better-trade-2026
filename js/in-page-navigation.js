(() => {
    const HERO_SKIP_NAVIGATION_EVENT = 'bettertrade:hero-skip-navigation';
    const SECTION_NAVIGATION_EVENT = 'bettertrade:section-navigation';

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');

        if (!link || link.matches('[role="tab"]')) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;

        const target = document.getElementById(hash.slice(1));
        if (!target) return;

        event.preventDefault();

        const navigate = () => {
            target.scrollIntoView({ block: 'start' });
            history.replaceState(null, '', window.location.pathname + window.location.search);
            window.dispatchEvent(new CustomEvent(SECTION_NAVIGATION_EVENT, {
                detail: { targetId: target.id },
            }));
        };

        const isHeaderNavigation = Boolean(link.closest('.site-header, .site-header__mobile'));
        if (isHeaderNavigation) {
            const detail = { target, navigate, handled: false };
            window.dispatchEvent(new CustomEvent(HERO_SKIP_NAVIGATION_EVENT, { detail }));
            if (detail.handled) return;
        }

        navigate();
    });
})();

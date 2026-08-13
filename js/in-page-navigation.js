(() => {
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');

        if (!link || link.matches('[role="tab"]')) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;

        const target = document.getElementById(hash.slice(1));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ block: 'start' });
        history.replaceState(null, '', window.location.pathname + window.location.search);
    });
})();

(() => {
    const tablists = document.querySelectorAll('.faq__tabs[role="tablist"]');
    if (!tablists.length) return;

    tablists.forEach(tablist => {
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const indicator = tablist.querySelector('.faq__tab-indicator');
        if (!tabs.length) return;

        function updateIndicator(activeTab) {
            if (!indicator || !activeTab || tablist.closest('[hidden]')) return false;

            tablist.style.setProperty('--faq-tab-indicator-x', `${activeTab.offsetLeft}px`);
            tablist.style.setProperty('--faq-tab-indicator-width', `${activeTab.offsetWidth}px`);
            return true;
        }

        function markIndicatorReady() {
            if (tablist.dataset.indicatorReady === 'true') return;
            requestAnimationFrame(() => {
                tablist.dataset.indicatorReady = 'true';
            });
        }

        function getStickyOffset() {
            const siteHeader = document.getElementById('site-header');
            const tabsViewport = tablist.closest('.faq__tabs-viewport');

            return (siteHeader?.offsetHeight || 0) + (tabsViewport?.offsetHeight || 0);
        }

        function scrollToFirstQuestion(activeTab) {
            const panel = document.getElementById(activeTab.getAttribute('aria-controls'));
            const firstQuestion = panel?.querySelector('.faq__question');

            if (!firstQuestion) return;

            requestAnimationFrame(() => {
                const targetTop = firstQuestion.getBoundingClientRect().top + window.scrollY - getStickyOffset();

                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: 'smooth'
                });
            });
        }

        function activateTab(activeTab, shouldFocus = false, shouldScroll = false) {
            tabs.forEach(tab => {
                const isActive = tab === activeTab;
                tab.setAttribute('aria-selected', String(isActive));
                tab.tabIndex = isActive ? 0 : -1;

                const panel = document.getElementById(tab.getAttribute('aria-controls'));
                if (panel) panel.hidden = !isActive;
            });

            if (updateIndicator(activeTab)) markIndicatorReady();
            if (shouldFocus) activeTab.focus();
            if (shouldScroll) scrollToFirstQuestion(activeTab);
        }

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activateTab(tab, false, true));

            tab.addEventListener('keydown', event => {
                let nextIndex = null;

                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    nextIndex = (index + 1) % tabs.length;
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    nextIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = tabs.length - 1;
                }

                if (nextIndex === null) return;
                event.preventDefault();
                activateTab(tabs[nextIndex], true);
            });
        });

        function syncActiveIndicator() {
            const activeTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
            if (updateIndicator(activeTab)) markIndicatorReady();
        }

        syncActiveIndicator();
        window.addEventListener('resize', syncActiveIndicator, { passive: true });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(syncActiveIndicator);
        }
    });
})();

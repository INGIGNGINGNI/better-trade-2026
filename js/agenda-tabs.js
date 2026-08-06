(() => {
    const tabLists = document.querySelectorAll('.agenda__tabs[role="tablist"]');

    tabLists.forEach((tabList) => {
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        const indicator = tabList.querySelector('.agenda__tab-indicator');

        const updateIndicator = (activeTab) => {
            const indicatorHeight = indicator ? indicator.offsetHeight : 0;
            const indicatorY = activeTab.offsetTop + activeTab.offsetHeight - indicatorHeight;

            tabList.style.setProperty('--agenda-tab-indicator-x', `${activeTab.offsetLeft}px`);
            tabList.style.setProperty('--agenda-tab-indicator-y', `${indicatorY}px`);
            tabList.style.setProperty('--agenda-tab-indicator-width', `${activeTab.offsetWidth}px`);
        };

        const activateTab = (activeTab, shouldFocus = true) => {
            tabs.forEach((tab) => {
                const isActive = tab === activeTab;
                const panelId = tab.getAttribute('aria-controls');
                const panel = panelId ? document.getElementById(panelId) : null;

                tab.setAttribute('aria-selected', String(isActive));
                tab.tabIndex = isActive ? 0 : -1;

                if (panel) {
                    panel.hidden = !isActive;
                }
            });

            updateIndicator(activeTab);

            if (shouldFocus) {
                activeTab.focus();
            }
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activateTab(tab, false));

            tab.addEventListener('keydown', (event) => {
                let nextIndex = index;

                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    nextIndex = (index + 1) % tabs.length;
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    nextIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = tabs.length - 1;
                } else {
                    return;
                }

                event.preventDefault();
                activateTab(tabs[nextIndex]);
            });
        });

        const initialTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];

        if (initialTab) {
            updateIndicator(initialTab);
            requestAnimationFrame(() => {
                tabList.dataset.indicatorReady = 'true';
            });

            window.addEventListener('resize', () => {
                const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');

                if (activeTab) {
                    updateIndicator(activeTab);
                }
            });

            if (document.fonts) {
                document.fonts.ready.then(() => {
                    const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');

                    if (activeTab) {
                        updateIndicator(activeTab);
                    }
                });
            }
        }
    });
})();

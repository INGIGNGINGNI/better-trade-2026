(() => {
    const LOADER_COMPLETE_EVENT = 'bettertrade:loader-complete';
    const banner = document.querySelector('[data-cookie-banner]');
    const acceptButton = banner?.querySelector('[data-cookie-accept]');
    const declineButton = banner?.querySelector('[data-cookie-decline]');

    if (!banner || !acceptButton || !declineButton) return;

    const hideBanner = choice => {
        banner.classList.remove('is-visible');
        window.dispatchEvent(new CustomEvent('bettertrade:cookie-choice', {
            detail: { choice },
        }));

        window.setTimeout(() => {
            banner.hidden = true;
        }, 560);
    };

    acceptButton.addEventListener('click', () => hideBanner('accept'));
    declineButton.addEventListener('click', () => hideBanner('decline'));

    const showBanner = () => {
        banner.hidden = false;
        window.requestAnimationFrame(() => banner.classList.add('is-visible'));
    };

    const loaderHasFinished = !document.body.classList.contains('is-loading')
        && !document.getElementById('loader');

    if (loaderHasFinished) {
        showBanner();
    } else {
        window.addEventListener(LOADER_COMPLETE_EVENT, showBanner, { once: true });
    }
})();

(() => {
    const media = document.querySelector('[data-concept-video]');
    const poster = media?.querySelector('.concept__video-poster');
    const iframe = media?.querySelector('iframe[data-src]');

    if (!media || !poster || !iframe) return;

    poster.addEventListener('click', () => {
        if (!iframe.src) {
            iframe.src = iframe.dataset.src || '';
        }

        media.classList.add('is-video-playing');
    });
})();

(() => {
    const section = document.querySelector('.topics-showcase');
    if (!section) return;

    const topics = [...section.querySelectorAll('.concept__topics p')];
    if (!topics.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
        return;
    }

    // Without this class the hidden state never applies, so bailing out above leaves the
    // topics plainly visible.
    section.classList.add('is-reveal-ready');

    /* The whole list is shorter than a desktop viewport, so scrolling the section into view
       brings several topics past the line in one callback. Those get a small increasing
       delay in reading order — a batch fans out top-to-bottom instead of popping at once —
       while a topic that arrives on its own reveals immediately. */
    const BATCH_STAGGER_MS = 110;

    const topicObserver = new IntersectionObserver(entries => {
        const arriving = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        arriving.forEach((entry, index) => {
            const topic = entry.target;
            topic.style.setProperty('--topic-delay', `${index * BATCH_STAGGER_MS}ms`);
            topic.classList.add('is-topic-visible');
            topicObserver.unobserve(topic);
        });
    }, {
        // Reveal a touch before the topic is fully in frame, so it is already settling by
        // the time it reaches comfortable reading height.
        threshold: 0.4,
        rootMargin: '0px 0px -10% 0px',
    });

    topics.forEach(topic => topicObserver.observe(topic));
})();

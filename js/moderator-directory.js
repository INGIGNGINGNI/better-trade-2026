(() => {
    const moderators = [
        {
            name: 'คุณดาริน ปริญญากุล',
            role: 'Lorem ipsum dolor sit amet.',
            image: 'mc/MC-ดาริน-ปริญญากุล.webp',
        },
        {
            name: 'คุณชัชชญา อังคุลี',
            role: 'บรรณาธิการ Crypto by efinanceThai',
            image: 'mc/MC-ชัชชญา-อังคุลี.webp',
        },
        {
            name: 'คุณธนธร กาญจนิศากร',
            role: 'เจ้าของเพจ NamFinance',
            image: 'mc/MC-ธนธร-กาญจนิศากร.webp',
        },
    ];

    const grid = document.querySelector('[data-moderator-directory]');
    if (!grid) return;

    const createModeratorCard = ({
        name,
        role = '',
        image,
        imageY = '0%',
        imageScale = 1,
        imageWidth = 928,
        imageHeight = 1204,
    }, index) => {
        const card = document.createElement('article');

        card.className = 'speaker-card';
        card.style.setProperty('--speaker-order', String(index % 4));
        card.style.setProperty('--speaker-portrait-y', imageY);
        card.style.setProperty('--speaker-portrait-scale', String(imageScale));
        card.innerHTML = `
            <div class="speaker-card__portrait">
                <div class="speaker-card__frame">
                    <img src="images/speakers/${image}" width="${imageWidth}" height="${imageHeight}"
                        loading="lazy" decoding="async" alt="${name}">
                </div>
            </div>
            <div class="speaker-card__meta">
                <h3>${name}</h3>
                ${role ? `<p>${role}</p>` : ''}
            </div>`;

        return card;
    };

    const fragment = document.createDocumentFragment();
    moderators.forEach((moderator, index) => {
        fragment.appendChild(createModeratorCard(moderator, index));
    });

    grid.replaceChildren(fragment);
})();

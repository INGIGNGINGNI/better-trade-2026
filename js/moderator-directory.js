(() => {
    const moderators = [
        {
            name: 'คุณเนาวรัตน์ เจริญประพิณ',
            role: 'ผู้ดำเนินรายการด้านเศรษฐกิจ และการลงทุน Money Channel',
            image: 'MC-เนาวรัตน์-เจริญประพิณ.webp',
        },
        {
            name: 'คุณธนธร กาญจนิศากร (NamFinance)',
            role: 'ที่ปรึกษาการเงินส่วนบุคคล พิธีกรรายการ<br class="d-none d-xxl-block">การเงิน',
            image: 'MC-ธนธร-กาญจนิศากร.webp',
        },
        {
            name: 'คุณดาริน วิวัฒน์เจริญพงศ์',
            role: '',
            image: 'MC-ดาริน-วิวัฒน์เจริญพงศ์.webp',
        },
        // {
        //     name: 'คุณชัชชญา อังคุลี',
        //     role: 'บรรณาธิการ Crypto by efinanceThai',
        //     image: 'MC-ชัชชญา-อังคุลี.webp',
        // },
        {
            name: 'คุณอิก บรรพต ธนาเพิ่มสุข',
            role: 'AFPT และเจ้าของเพจ ถามอีกกับอิก',
            image: 'MC-บรรพต-ธนาเพิ่มสุข.webp',
        },
        {
            name: 'คุณวรเกียรติ นิ่มมาก',
            role: 'พิธีกร Amarin TV และเจ้าของเพจ<br class="d-none d-xl-block">ตายายสอนหลาน',
            image: 'MC-วรเกียรติ-นิ่มมาก.webp',
        },
        {
            name: 'คุณณัฐเศรษฐ ตุ้ยดา',
            role: 'AFPT, Senior Content Creator, efinanceThai',
            image: 'MC-ณัฐเศรษฐ-ตุ้ยดา.webp',
        },
        {
            name: 'Jessie Ink',
            role: 'เจ้าของเพจ Jessie Variety',
            image: 'MC-ทวีชัย-แออัด.webp',
        },
        {
            name: 'คุณปริม สุขศรีขาว',
            role: 'เจ้าของเพจ Prim Invest',
            image: 'MC-ปริม-สุขศรีขาว.webp',
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
                    <img src="images/mc/${image}" width="${imageWidth}" height="${imageHeight}"
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

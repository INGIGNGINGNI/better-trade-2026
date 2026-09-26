/* Loader เปิดหน้า + ไอคอนสินทรัพย์ + วิดีโอท้องฟ้าหลัง Hero
   แยกออกมาจาก hero-v2-scroll-motion.js (hero เรือ/คนวิ่งเดิม) เหลือเฉพาะส่วนที่ยังใช้:
   1. loader — ไอคอนสลับกันกลางจอพร้อมแถบ progress จากนั้นไอคอนตัวสุดท้ายส่งต่อให้ไอคอนจริงใน hero
      แล้วทั้งหกตัวกระจายจากกลางจอกลับไปตำแหน่งของตัวเอง (จังหวะเดียวกับ playIntro() เดิม)
      ตอนจบต้องถอด body.is-loading + ลบ #loader + ส่ง LOADER_COMPLETE_EVENT เพราะ
      early-bird / back-to-top / journey / mobile-cta-bar / cookie-banner / topics-motion รอสัญญาณนี้อยู่
   2. ไอคอนลอยขึ้นลงช้า ๆ (idle float เดิม) หยุดเมื่อ hero ไม่อยู่ในจอ
   3. วิดีโอท้องฟ้า — เล่นเฉพาะตอน hero อยู่ในจอ ปิดเมื่อ reduced motion หรือ save-data */
(() => {
    const LOADER_COMPLETE_EVENT = 'bettertrade:loader-complete';
    const LOADING_SPEED = 2; // >1 = แถบ progress และไอคอนสลับเร็วขึ้น ส่วนจังหวะเปิดฉากคงเดิม
    // ไอคอนที่สลับโชว์ตอนโหลด (ตัวสุดท้ายค้างไว้เป็นตัวส่งต่อให้ hero)
    const LOADER_ORDER = ['bitcoin', 'gold', 'stock', 'triangle'];
    // ลำดับการกระจายออกจากกลางจอ
    const ASSET_KEYS = ['stock', 'bitcoin', 'gold', 'card', 'heart', 'triangle'];
    const SEED_KEY = 'triangle';
    const WALL_OVERLAP = 0; // ปิดพอดีชนกันที่กึ่งกลาง ไม่ซ้อนทับกัน (ระยะเปิดยาวที่สุดที่ไม่ซ้อน)
    const WALL_OPEN_DURATION = 0.9;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData === true;

    const hero = document.getElementById('hero');
    const heroInner = hero?.querySelector('.hero__inner');
    const skyVideo = hero?.querySelector('.hero__sky-video');
    const loader = document.getElementById('loader');
    const loaderSurface = loader?.querySelector('.loader-surface');
    const loaderProgress = loader?.querySelector('.loader-progress');
    const loaderProgressFill = loader?.querySelector('.loader-progress__fill');
    const loaderProgressValue = loader?.querySelector('.loader-progress__value');
    const siteHeader = document.getElementById('site-header');

    const assets = Object.fromEntries(ASSET_KEYS.map(key => {
        const node = hero?.querySelector(`[data-hero-asset="${key}"]`);
        return [key, node && {
            node,
            float: node.querySelector('.hero-asset__float'),
            inner: node.querySelector('.hero-asset__inner'),
            loaderIcon: loader?.querySelector(`[data-loader-icon="${key}"]`),
        }];
    }).filter(([, asset]) => asset));
    const assetInners = Object.values(assets).map(asset => asset.inner);
    const loaderIcons = Object.values(assets).map(asset => asset.loaderIcon).filter(Boolean);

    let loaderDone = false;
    let heroVisible = true;
    const idleTweens = [];

    function startIdle() {
        if (reduced || idleTweens.length || typeof gsap === 'undefined') return;

        Object.values(assets).forEach(({ float }) => {
            idleTweens.push(gsap.to(float, {
                y: `+=${gsap.utils.random(9, 17)}`,
                rotate: `+=${gsap.utils.random(3, 8) * (Math.random() > 0.5 ? 1 : -1)}`,
                duration: gsap.utils.random(3, 5),
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                paused: !heroVisible || document.hidden,
            }));
        });
    }

    function syncIdle() {
        const active = heroVisible && !document.hidden && !iconsFlying;
        idleTweens.forEach(tween => tween.paused(!active));
    }

    /* js/hero-scroll-motion.js บินไอคอนลงไปหาการ์ดบัตรโดยขยับ .hero-asset__inner ในกรอบของ .hero-asset__float
       ถ้าลอย/หมุน idle ต่อ เส้นทางบินจะเอียงตามมุมที่ float หมุนอยู่ จึงหยุด idle แล้วพา float กลับตำแหน่งตั้งต้นก่อน */
    let iconsFlying = false;
    window.addEventListener('bettertrade:hero-icons-flying', event => {
        iconsFlying = Boolean(event.detail?.flying);
        // กลับขึ้นบนสุด: float อยู่ที่ตั้งต้นแล้ว เริ่ม idle ใหม่จากตั้งต้นเช่นกัน ไม่กระตุก
        if (!iconsFlying) idleTweens.forEach(tween => tween.progress(0));
        syncIdle();
        if (iconsFlying && typeof gsap !== 'undefined') {
            gsap.to(Object.values(assets).map(a => a.float), { y: 0, rotate: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        }
    });

    function finishLoader() {
        if (loaderDone) return;
        loaderDone = true;

        document.documentElement.classList.remove('is-preparing-page-scroll');
        document.body.classList.remove('is-loading');
        loader?.remove();
        if (typeof gsap !== 'undefined') {
            gsap.set(assetInners, { opacity: 1, clearProps: 'transform' });
            gsap.set([siteHeader, heroInner], { clearProps: 'opacity,transform' });
            gsap.set(hero?.querySelectorAll('.hero__wall') || [], { clearProps: 'transform,transformOrigin,opacity' });
        } else {
            assetInners.forEach(inner => { inner.style.opacity = '1'; });
        }
        startIdle();
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        window.dispatchEvent(new Event(LOADER_COMPLETE_EVENT));
    }

    /* ตำแหน่งตั้งต้นของไอคอนจริงแต่ละตัว = กลางจอ (ที่ไอคอน loader อยู่) แปลงเป็นแกนของ .hero-asset
       ที่เอียงอยู่ (--rot) เพื่อให้ inner ซ้อนทับไอคอน loader พอดีแล้วค่อยวิ่งกลับไปที่ 0 */
    function measureScatterOrigins() {
        const bounds = loader.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;

        return Object.fromEntries(Object.entries(assets).map(([key, { node, loaderIcon }]) => {
            const target = node.getBoundingClientRect();
            const rotation = Number.parseFloat(getComputedStyle(node).getPropertyValue('--rot')) || 0;
            const angle = rotation * Math.PI / 180;
            const dx = centerX - (target.left + target.width / 2);
            const dy = centerY - (target.top + target.height / 2);
            const width = Math.max(1, node.offsetWidth);

            return [key, {
                x: Math.cos(angle) * dx + Math.sin(angle) * dy,
                y: -Math.sin(angle) * dx + Math.cos(angle) * dy,
                scale: Math.max(1, loaderIcon?.offsetWidth || width) / width,
                rotation: -rotation,
            }];
        }));
    }

    /* ปิดกำแพงไว้ก่อนเปิดฉาก (ซ่อนด้วย opacity 0): ยืด scaleX จากขอบจอด้านนอก จนขอบในของทั้งสองฝั่ง
       มาชนกันที่กึ่งกลางช่องระหว่างกำแพง (ขอบในอยู่ที่ 36% / 63% ของกรอบภาพวิทยากร ตามที่ CSS วาง)
       คืนค่า { left, right } ไว้ให้ timeline เลื่อนเปิด หรือ null ถ้ากำแพงไม่แสดง */
    function closeHeroWalls() {
        const left = hero?.querySelector('.hero__wall--left');
        const right = hero?.querySelector('.hero__wall--right');
        const figure = hero?.querySelector('.hero__speakers');
        if (!left || !right || !figure || getComputedStyle(left).display === 'none') return null;

        const heroBox = hero.getBoundingClientRect();
        const fig = figure.getBoundingClientRect();
        const innerL = fig.left + fig.width * 0.36 - heroBox.left;
        const innerR = fig.left + fig.width * 0.63 - heroBox.left;
        const meet = (innerL + innerR) / 2;
        if (innerL <= 0 || innerR >= heroBox.width) return null;
        // ขอบในของทั้งสองฝั่งชนกันที่กึ่งกลาง (+ WALL_OVERLAP ถ้าต้องการให้ซ้อน)
        const overlap = heroBox.width * WALL_OVERLAP;

        gsap.set(left, {
            transformOrigin: `${heroBox.left - left.getBoundingClientRect().left}px 50%`,
            scaleX: (meet + overlap) / innerL,
            opacity: 0,
        });
        gsap.set(right, {
            transformOrigin: `${heroBox.right - right.getBoundingClientRect().left}px 50%`,
            scaleX: (heroBox.width - meet + overlap) / (heroBox.width - innerR),
            opacity: 0,
        });
        return { left, right };
    }

    function playLoader() {
        // โหลดหน้ากลางทาง, reduced motion หรือไม่มี gsap ข้ามไปหน้าจริงเลย
        if (!loader || typeof gsap === 'undefined' || reduced || window.scrollY > 10) {
            finishLoader();
            return;
        }

        const iconStep = 0.48;
        const loadingDuration = (0.16 + (LOADER_ORDER.length - 1) * iconStep + 0.24 + 0.4) / LOADING_SPEED;
        const exitAt = loadingDuration;
        const sceneRevealAt = exitAt + 0.12;
        const scatterStartOffset = 0.10;
        const scatterStagger = 0.045;
        const scatterDuration = 1.12;
        const progress = { value: 0 };

        gsap.set(siteHeader, { opacity: 0, y: -16 });
        gsap.set(heroInner, { opacity: 0, y: 16 });
        const closeWalls = closeHeroWalls();
        gsap.set(assetInners, { opacity: 0 });
        gsap.set(loaderIcons, {
            left: '50%',
            top: '50%',
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: 0,
            scale: 0.78,
            rotation: 0,
            opacity: 0,
        });

        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: finishLoader,
        });

        tl.fromTo(loaderProgressFill,
            { scaleX: 0 },
            { scaleX: 1, duration: loadingDuration - 0.12 / LOADING_SPEED, ease: 'none' }, 0.06 / LOADING_SPEED)
            .to(progress, {
                value: 100,
                duration: loadingDuration - 0.12 / LOADING_SPEED,
                ease: 'none',
                onUpdate: () => {
                    const value = Math.round(progress.value);
                    loaderProgressValue.textContent = `${String(value).padStart(2, '0')}%`;
                    loaderProgress.setAttribute('aria-valuenow', String(value));
                },
            }, 0.06 / LOADING_SPEED);

        LOADER_ORDER.forEach((key, i) => {
            const icon = assets[key]?.loaderIcon;
            if (!icon) return;
            const at = (0.16 + i * iconStep) / LOADING_SPEED;
            const tilt = i % 2 === 0 ? -7 : 7;

            tl.fromTo(icon,
                { opacity: 0, scale: 0.72, rotation: tilt },
                { opacity: 1, scale: 1, rotation: 0, duration: 0.24 / LOADING_SPEED },
                at
            );

            if (i < LOADER_ORDER.length - 1) {
                tl.to(icon,
                    { opacity: 0, scale: 1.08, duration: 0.18 / LOADING_SPEED, ease: 'power2.in' },
                    at + 0.28 / LOADING_SPEED
                );
            }
        });

        tl.to(loaderProgress, { opacity: 0, y: 8, duration: 0.22 / LOADING_SPEED }, exitAt - 0.12 / LOADING_SPEED);

        // ส่งไอคอนกลางจอต่อให้ไอคอนจริงใน hero: วางทุกตัวซ้อนกันที่กลางจอ (ตัวอื่นเล็กลงครึ่งหนึ่ง
        // ซ่อนอยู่หลังตัวส่งต่อ) แล้ว crossfade ตัวส่งต่อจาก loader ไป hero ให้ความสว่างรวมคงที่
        tl.call(() => {
            const origins = measureScatterOrigins();

            Object.entries(assets).forEach(([key, { inner }]) => {
                const isSeed = key === SEED_KEY;
                gsap.set(inner, {
                    ...origins[key],
                    scale: origins[key].scale * (isSeed ? 1 : 0.5),
                    opacity: 0,
                    transformOrigin: '50% 50%',
                    force3D: true,
                });
            });
        }, null, exitAt);
        tl.to(loaderIcons, { opacity: 0, duration: 0.16, ease: 'none' }, exitAt + 0.02);
        if (assets[SEED_KEY]) {
            tl.to(assets[SEED_KEY].inner, { opacity: 1, duration: 0.16, ease: 'none' }, exitAt + 0.02);
        }

        // ปลด scroll ตอน loader ยังทึบอยู่ ให้เบราว์เซอร์จัด scrollbar/relayout ให้เสร็จก่อนเห็นหน้าจริง
        tl.call(() => {
            document.documentElement.classList.add('is-preparing-page-scroll');
            document.body.classList.remove('is-loading');
        }, null, sceneRevealAt - 0.16);

        tl.call(() => window.dispatchEvent(new Event('loader:mist-stop')), null, exitAt)
            .to(loaderSurface, { opacity: 0, duration: 0.78, ease: 'power2.out' }, sceneRevealAt)
            .to(siteHeader, { opacity: 1, y: 0, duration: 0.56 }, sceneRevealAt + 0.52)
            .to(heroInner, { opacity: 1, y: 0, duration: 0.62 }, sceneRevealAt + 0.70);

        // กำแพง (ปิดชนกันอยู่) จางเข้ามาพร้อมเนื้อหา hero แล้วเลื่อนเปิดออกทันทีที่จางเข้าเสร็จ
        if (closeWalls) {
            const wallFadeAt = sceneRevealAt + 0.70;
            const wallFadeDuration = 0.62;
            const openAt = wallFadeAt + wallFadeDuration; // จางเข้าเสร็จแล้วเลื่อนเปิดทันที
            tl.to([closeWalls.left, closeWalls.right], { opacity: 1, duration: wallFadeDuration, ease: 'power1.out' }, wallFadeAt)
                .to(closeWalls.left, { scaleX: 1, duration: WALL_OPEN_DURATION, ease: 'power3.inOut' }, openAt)
                .to(closeWalls.right, { scaleX: 1, duration: WALL_OPEN_DURATION, ease: 'power3.inOut' }, openAt + 0.025);
        }

        tl.set(loaderSurface, { display: 'none' }, sceneRevealAt + 0.78);

        ASSET_KEYS.forEach((key, i) => {
            if (!assets[key]) return;
            tl.to(assets[key].inner, {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                force3D: true,
                duration: scatterDuration,
                ease: 'power3.inOut',
            }, sceneRevealAt + scatterStartOffset + i * scatterStagger);
        });

        tl.to(loader, { opacity: 0, duration: 0.18, ease: 'none' }, sceneRevealAt + 1.62);
    }

    function setupSkyVideo() {
        if (!skyVideo) return;

        if (reduced || saveData) {
            skyVideo.pause();
            return;
        }

        const markReady = () => hero.classList.add('is-sky-ready');

        const play = () => {
            const promise = skyVideo.play();
            promise?.then?.(markReady).catch(() => hero.classList.remove('is-sky-ready'));
        };

        skyVideo.playbackRate = 0.72;
        skyVideo.addEventListener('playing', markReady);
        skyVideo.addEventListener('error', () => hero.classList.remove('is-sky-ready'));
        play();
    }

    // วิดีโอท้องฟ้าและไอคอนลอยทำงานเฉพาะตอน hero อยู่ในจอ
    function syncSceneActivity() {
        const active = heroVisible && !document.hidden;
        syncIdle();
        if (!skyVideo || reduced || saveData) return;
        if (active) skyVideo.play()?.catch?.(() => {});
        else skyVideo.pause();
    }

    /* กำแพงซ้าย-ขวาอยู่ layer เดียวกับท้องฟ้า (นอก .hero__inner) จึงต้องคัดลอกตำแหน่ง/ขนาดกรอบภาพวิทยากร
       มาให้ทุกครั้งที่ layout เปลี่ยน (CSS ซ่อนกำแพงที่ ≤991 ก็ข้ามไป) */
    function setupWall() {
        const walls = hero ? [...hero.querySelectorAll('.hero__wall')] : [];
        // กรอบภาพจริง (.hero__speakers) ไม่ใช่คอลัมน์ ≤991 คอลัมน์มี gutter ซ้าย-ขวา ≥992 ทั้งสองเท่ากัน
        const visual = hero?.querySelector('.hero__speakers');
        if (!walls.length || !visual) return;

        const content = hero.querySelector('.hero__content');
        const stats = hero.querySelector('.hero__stats');
        const cta = hero.querySelector('#cta-slot');

        const sync = () => {
            const heroBox = hero.getBoundingClientRect();
            const rect = visual.getBoundingClientRect();
            // ระหว่าง loader .hero__inner ถูกเลื่อนลง (translateY) ชั่วคราว วัดตำแหน่งจริงโดยหักค่านั้นออก
            // ไม่งั้นกำแพงจะเลื่อนลงตามจนเห็นช่องฟ้าเหนือกำแพง
            const innerShift = heroInner ? new DOMMatrixReadOnly(getComputedStyle(heroInner).transform).m42 : 0;
            const box = { top: rect.top - innerShift, left: rect.left, width: rect.width, height: rect.height };

            // จุดอ้างอิงของเนื้อหา (px เทียบกับ hero) ให้ CSS วางไอคอนสินทรัพย์ในช่องว่างข้างเนื้อหา ไม่ทับข้อความ
            const local = el => {
                const r = el.getBoundingClientRect();
                return { l: r.left - heroBox.left, r: r.right - heroBox.left, y: r.top + r.height / 2 - innerShift - heroBox.top };
            };
            const setVar = (name, value) => hero.style.setProperty(name, `${Math.round(value)}px`);
            if (content) setVar('--bt-hero-content-l', local(content).l);
            if (stats) {
                const st = local(stats);
                setVar('--bt-hero-stats-l', st.l);
                setVar('--bt-hero-stats-r', st.r);
                setVar('--bt-hero-stats-y', st.y);
            }
            // ปุ่มซื้อบัตรถูกซ่อน (≤575) ใช้แถว stat เป็นจุดอ้างอิงของ triangle / card แทน
            const ctaShown = cta && cta.getClientRects().length > 0 && cta.offsetWidth > 0;
            const anchor = ctaShown ? cta : stats;
            if (anchor) {
                const c = local(anchor);
                setVar('--bt-hero-cta-l', c.l);
                setVar('--bt-hero-cta-r', c.r);
                setVar('--bt-hero-cta-y', c.y);
            }
            setVar('--bt-hero-img-top', box.top - heroBox.top);
            setVar('--bt-hero-img-h', box.height);

            if (getComputedStyle(walls[0]).display === 'none') return;
            // ≤991 ขอบเฉียงของกำแพงเริ่มที่ขอบจอระดับแถวตัวเลข stat (CSS ใช้เฉพาะช่วงนั้น)
            // (≤575 แถว stat ย้ายไปอยู่ใต้ภาพ ใช้ขอบบนของภาพแทน ถ้าภาพอยู่สูงกว่า)
            const start = stats ? Math.min(stats.getBoundingClientRect().top, rect.top) - innerShift - heroBox.top : 0;
            walls.forEach(wall => {
                wall.style.setProperty('--bt-hero-wall-start', `${start}px`);
                wall.style.setProperty('--bt-hero-width', `${heroBox.width}px`);
                wall.style.setProperty('--bt-hero-height', `${heroBox.height}px`);
                wall.style.setProperty('--bt-hero-wall-top', `${box.top - heroBox.top}px`);
                wall.style.setProperty('--bt-hero-wall-left', `${box.left - heroBox.left}px`);
                wall.style.setProperty('--bt-hero-wall-width', `${box.width}px`);
                wall.style.setProperty('--bt-hero-wall-height', `${box.height}px`);
            });
        };

        sync();
        const resizeObserver = new ResizeObserver(sync);
        resizeObserver.observe(visual);
        if (content) resizeObserver.observe(content);
        document.fonts?.ready.then(sync);
        window.addEventListener('resize', sync);
        // ระหว่าง loader เนื้อหาถูกเลื่อนลง 16px (transform ไม่ทำให้ ResizeObserver ทำงาน) วัดใหม่ตอนจบ
        window.addEventListener(LOADER_COMPLETE_EVENT, sync);
    }

    function boot() {
        setupWall();
        setupSkyVideo();
        if (hero) {
            new IntersectionObserver(([entry]) => {
                heroVisible = entry.isIntersecting;
                syncSceneActivity();
            }, { threshold: 0.04 }).observe(hero);
            document.addEventListener('visibilitychange', syncSceneActivity);
        }
        playLoader();
    }

    if (document.readyState === 'complete') boot();
    else window.addEventListener('load', boot);
})();

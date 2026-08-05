        gsap.registerPlugin(ScrollTrigger);

        /* =========================================================
           Geometry measured from KV-BT-2026-Final.psd (3240 x 4050).
           cx/cy/w are percentages of that canvas; rot is CSS degrees.
           ========================================================= */
        const KV_RATIO = 3240 / 4050;                 // 0.8
        const KV = {
            ship: { l: 15.25, t: 26.00, w: 70.65 },
            stairs: { l: 1.98, t: 78.22, w: 95.83 },
            pshadow: { l: 5.09, t: 77.70, w: 60.77 },
            title: { cx: 52.36, cy: 16.16, w: 52.00, rot: 0 },
            triangle: { cx: 47.19, cy: 32.41, w: 6.27, rot: 20 },
            bitcoin: { cx: 26.57, cy: 28.47, w: 7.75, rot: -7 },
            gold: { cx: 71.48, cy: 32.42, w: 6.12, rot: 45 },
            heart: { cx: 68.49, cy: 40.44, w: 9.21, rot: 0 },
            // Nudged out from the KV's 71.30 / 53.06: behind the ship that spot leaves it
            // 86% hidden (the KV draws the card in front). +3% out puts it at 32%.
            card: { cx: 74.30, cy: 56.06, w: 9.03, rot: 50 },
            stock: { cx: 28.49, cy: 41.94, w: 8.10, rot: -40 },   // dialled down from the KV's 12.40
        };

        /* Frame 1 — the poster arrangement, in percentages of the viewport. */
        const POSTER = {
            title: { cx: 50.0, cy: 40.0, w: 50.0, rot: 0, min: 300, max: 1000 },
            triangle: { cx: 8.5, cy: 14.5, w: 13.0, rot: -10, min: 58, max: 230 },
            gold: { cx: 84.5, cy: 16.8, w: 5.5, rot: 8, min: 48, max: 130 },
            card: { cx: 91.5, cy: 42.0, w: 9.5, rot: 12, min: 52, max: 180 },
            stock: { cx: 6.4, cy: 71.0, w: 4.2, rot: -14, min: 22, max: 68 },
            bitcoin: { cx: 26.8, cy: 66.5, w: 6.0, rot: -8, min: 44, max: 140 },
            heart: { cx: 89.5, cy: 76.0, w: 14.0, rot: -5, min: 56, max: 240 },
        };
        const posterIconShiftY = viewportWidth => viewportWidth <= 991 ? 5 : 9;

        /* The eight runners, split out of the PSD's คน+เงา group. Listed far -> near so
           the reveal stagger reads as a crowd arriving from the distance. revealAngle
           is measured from vertical: positive rises right, negative rises left. */
        const RUNNERS = [
            { id: 'p1-far', l: 32.90, t: 74.77, w: 19.69, revealAngle: 8, revealDistance: 20 },
            { id: 'p2', l: 41.48, t: 76.79, w: 3.55, revealAngle: -18, revealDistance: 28 },
            { id: 'p3', l: 50.71, t: 76.47, w: 3.40, revealAngle: -14, revealDistance: 28 },
            { id: 'p4', l: 34.23, t: 76.47, w: 5.06, revealAngle: 5, revealDistance: 32 },
            { id: 'p5', l: 44.81, t: 78.10, w: 6.98, revealAngle: -8, revealDistance: 36 },
            { id: 'p6', l: 55.68, t: 78.12, w: 7.31, revealAngle: -12, revealDistance: 38 },
            { id: 'p7-left', l: 15.25, t: 75.41, w: 17.78, revealAngle: 24, revealDistance: 52 },
            { id: 'p8-right', l: 65.49, t: 77.60, w: 17.01, revealAngle: -24, revealDistance: 52 },
        ];

        /* Beat 2a — the ship enters from off-screen right, low in the frame, and sails
           left across the channel while growing toward the camera. It crosses the right
           wall on the way in, so the wall overlay reveals it exactly like a ship coming
           out from behind a cliff. */
        const SHIP_IN = { scale: 0.26, startYVH: 0.11, blur: 4 };
        const SHIP_LIGHT = {
            brightnessFrom: 0.96,
            brightnessTo: 1.04,
            saturationFrom: 0.90,
            saturationTo: 1.06,
            shadowAlphaFrom: 0.04,
            shadowAlphaTo: 0.20,
        };

        const WALL_DEPTH = 0.72;
        const SKY_DEPTH = { scaleFrom: 1.015, scaleTo: 1.035, liftPercent: -0.4 };

        /* How tall the virtual KV canvas is, in viewport heights. Bigger = the KV fills
           more of a wide screen and the beat-2 camera move gets longer. Portrait screens
           are already close to the KV's own proportion, so they need less zoom. */
        const stageHeightVH = aspect => aspect >= 1.2 ? 1.40 : 1.15;

        const KEYS = ['title', 'triangle', 'bitcoin', 'gold', 'heart', 'card', 'stock'];
        const LOADER_ORDER = ['stock', 'bitcoin', 'gold', 'card', 'heart', 'triangle'];
        const ASSET_IDLE_ENABLED = false;

        const el = {
            stagewrap: document.getElementById('stagewrap'),
            bg: document.getElementById('bg'),
            skyVideo: document.getElementById('sky-video'),
            stage: document.getElementById('stage'),
            ship: document.getElementById('ship'),
            walls: document.getElementById('walls'),
            wallIntroLeft: document.getElementById('wall-left-intro'),
            wallIntroRight: document.getElementById('wall-right-intro'),
            wallLeft: document.getElementById('wall-left'),
            wallRight: document.getElementById('wall-right'),
            stairs: document.getElementById('stairs'),
            pshadow: document.getElementById('pshadow'),
            loader: document.getElementById('loader'),
            loaderSurface: document.querySelector('.loader-surface'),
            loaderProgress: document.querySelector('.loader-progress'),
            loaderProgressFill: document.querySelector('.loader-progress__fill'),
            loaderProgressValue: document.querySelector('.loader-progress__value'),
            siteScrollbar: document.getElementById('site-scrollbar'),
            siteScrollbarThumb: document.querySelector('.site-scrollbar__thumb'),
        };
        KEYS.forEach(k => {
            el[k] = document.getElementById('a-' + k);
            el[k + 'Float'] = el[k].querySelector('.floaty');
            el[k + 'Inner'] = el[k].querySelector('.inner');
        });
        el.loaderIcons = Object.fromEntries(LOADER_ORDER.map(k => [
            k,
            document.querySelector(`[data-loader-icon="${k}"]`),
        ]));

        // One <img> per runner, so each can be revealed on its own beat.
        el.runners = RUNNERS.map(r => {
            const img = document.createElement('img');
            img.src = `../images/${r.id}.webp`;
            img.alt = '';
            img.className = 'person';
            img.dataset.id = r.id;
            el.stage.appendChild(img);
            return img;
        });

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        let M = {};          // measured layout
        let scrollTL = null;
        let introDone = false;
        let scrollbarRAF = null;
        let scrollbarDrag = null;

        function updateSiteScrollbar() {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const trackHeight = el.siteScrollbar.clientHeight;
            const thumbHeight = maxScroll > 0
                ? Math.max(32, trackHeight * window.innerHeight / document.documentElement.scrollHeight)
                : trackHeight;
            const travel = Math.max(0, trackHeight - thumbHeight);
            const progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;

            el.siteScrollbar.style.setProperty('--thumb-height', `${thumbHeight}px`);
            el.siteScrollbar.style.setProperty('--thumb-y', `${travel * progress}px`);
            el.siteScrollbar.classList.toggle('is-hidden', maxScroll <= 0);
            el.siteScrollbar.tabIndex = document.body.classList.contains('is-loading') || maxScroll <= 0 ? -1 : 0;
            el.siteScrollbar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
        }

        function requestSiteScrollbarUpdate() {
            if (scrollbarRAF) return;
            scrollbarRAF = requestAnimationFrame(() => {
                scrollbarRAF = null;
                updateSiteScrollbar();
            });
        }

        function scrollFromScrollbarPointer(clientY, startScroll, startPointerY) {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const thumbHeight = parseFloat(getComputedStyle(el.siteScrollbar).getPropertyValue('--thumb-height')) || 32;
            const travel = Math.max(1, el.siteScrollbar.clientHeight - thumbHeight);
            window.scrollTo(0, clamp(startScroll + (clientY - startPointerY) * maxScroll / travel, 0, maxScroll));
        }

        el.siteScrollbarThumb.addEventListener('pointerdown', event => {
            event.preventDefault();
            scrollbarDrag = { pointerY: event.clientY, scrollY: window.scrollY };
            el.siteScrollbar.classList.add('is-dragging');
            el.siteScrollbarThumb.setPointerCapture(event.pointerId);
        });

        el.siteScrollbarThumb.addEventListener('pointermove', event => {
            if (!scrollbarDrag) return;
            scrollFromScrollbarPointer(event.clientY, scrollbarDrag.scrollY, scrollbarDrag.pointerY);
        });

        const stopScrollbarDrag = event => {
            if (!scrollbarDrag) return;
            scrollbarDrag = null;
            el.siteScrollbar.classList.remove('is-dragging');
            if (el.siteScrollbarThumb.hasPointerCapture(event.pointerId)) {
                el.siteScrollbarThumb.releasePointerCapture(event.pointerId);
            }
        };
        el.siteScrollbarThumb.addEventListener('pointerup', stopScrollbarDrag);
        el.siteScrollbarThumb.addEventListener('pointercancel', stopScrollbarDrag);

        el.siteScrollbar.addEventListener('pointerdown', event => {
            if (event.target === el.siteScrollbarThumb) return;
            const track = el.siteScrollbar.getBoundingClientRect();
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const thumbHeight = parseFloat(getComputedStyle(el.siteScrollbar).getPropertyValue('--thumb-height')) || 32;
            const travel = Math.max(1, track.height - thumbHeight);
            const progress = clamp((event.clientY - track.top - thumbHeight / 2) / travel, 0, 1);
            window.scrollTo({ top: progress * maxScroll, behavior: 'smooth' });
        });

        el.siteScrollbar.addEventListener('keydown', event => {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const keyTargets = {
                ArrowUp: window.scrollY - 64,
                ArrowDown: window.scrollY + 64,
                PageUp: window.scrollY - window.innerHeight * 0.8,
                PageDown: window.scrollY + window.innerHeight * 0.8,
                Home: 0,
                End: maxScroll,
            };
            if (!(event.key in keyTargets)) return;
            event.preventDefault();
            window.scrollTo(0, clamp(keyTargets[event.key], 0, maxScroll));
        });

        window.addEventListener('scroll', requestSiteScrollbarUpdate, { passive: true });

        /* ?frame=0.55 renders one still frame of the scroll timeline instead of wiring
           it to the scrollbar: no ScrollTrigger, no pin, document exactly one viewport.
           Handy for checking a beat, and for screenshotting in tools that can't scroll. */
        const FRAME = new URLSearchParams(location.search).get('frame');
        const STATIC_FRAME = FRAME !== null;

        /* ---------------------------------------------------------
           layout(): position everything for BOTH frames, in pixels.
           --------------------------------------------------------- */
        function layout() {
            const vw = window.innerWidth, vh = window.innerHeight;

            // Virtual KV canvas: as tall as it can be without overflowing the viewport width.
            const SW = Math.min(vh * stageHeightVH(vw / vh) * KV_RATIO, vw * 0.98);
            const SH = SW / KV_RATIO;
            const stageLeft = (vw - SW) / 2;

            el.stage.style.cssText =
                `position:absolute;width:${SW}px;height:${SH}px;left:${stageLeft}px;top:0;will-change:transform;`;

            // How far the camera travels in beat 2.
            const PAN = Math.max(0, SH - vh) * 0.98;

            // Scroll length = the pinned view + beat 1 + however far beat 2 actually moves,
            // so a short camera move never leaves dead scroll behind it.
            const scrollerHeight = vh + vh * 1.3 + PAN * 1.4;
            const heroScrollDistance = Math.max(1, scrollerHeight - vh);
            document.getElementById('scroller').style.height =
                STATIC_FRAME ? vh + 'px' : scrollerHeight + 'px';
            if (STATIC_FRAME) {
                document.getElementById('after').style.display = 'none';
                document.documentElement.style.overflow = 'hidden';
            }

            // Background keeps the KV proportion but must cover the viewport in BOTH
            // axes — on a tall/narrow screen, matching width alone leaves a gap below.
            const bgW = Math.max(vw, SW, vh * KV_RATIO), bgH = bgW / KV_RATIO;
            el.bg.style.width = bgW + 'px';
            el.bg.style.height = bgH + 'px';
            el.bg.style.left = ((vw - bgW) / 2) + 'px';
            el.bg.style.top = '0px';
            const PANBG = Math.min(PAN * (bgH / SH), Math.max(0, bgH - vh));

            // The wall overlay lives inside #stage (so it can sit above the ship) but has
            // to register pixel-for-pixel with #bg, which is a sibling. Same size, and its
            // offset is the background's box expressed in stage-local coordinates.
            el.walls.style.width = bgW + 'px';
            el.walls.style.height = bgH + 'px';
            el.walls.style.left = ((vw - bgW) / 2 - stageLeft) + 'px';
            el.walls.style.top = '0px';

            // Ship, stairs, shadows and every runner sit at their true KV coordinates.
            const place = (node, g) => {
                node.style.width = (g.w / 100 * SW) + 'px';
                node.style.left = (g.l / 100 * SW) + 'px';
                node.style.top = (g.t / 100 * SH) + 'px';
            };
            place(el.ship, KV.ship);
            place(el.stairs, KV.stairs);
            place(el.pshadow, KV.pshadow);
            el.runners.forEach((node, i) => place(node, RUNNERS[i]));

            const assets = {};
            KEYS.forEach(k => {
                const kv = KV[k], po = POSTER[k], node = el[k];
                const isAssetIcon = k !== 'title';

                // Frame 2 (KV) — the element's resting size and slot.
                const wB = kv.w / 100 * SW;
                node.style.width = wB + 'px';
                const hB = node.offsetHeight;               // from the image's natural ratio
                const xB = kv.cx / 100 * SW, yB = kv.cy / 100 * SH;
                node.style.left = (xB - wB / 2) + 'px';
                node.style.top = (yB - hB / 2) + 'px';

                // Frame 1 (poster) — expressed as a delta from the resting slot.
                const wA = clamp(vw * po.w / 100, po.min, po.max);
                const posterCy = po.cy + (isAssetIcon ? posterIconShiftY(vw) : 0);
                assets[k] = {
                    dx: (vw * po.cx / 100) - (stageLeft + xB),
                    dy: (vh * posterCy / 100) - yB,
                    scale: wA / wB,
                    rotA: po.rot,
                    rotB: kv.rot,
                };
            });

            // Where the ship starts: just past the right edge of the viewport, low in the
            // frame, so its run-in crosses the right wall before it reaches the channel.
            const shipCx = stageLeft + (KV.ship.l + KV.ship.w / 2) / 100 * SW;
            const shipHalfStart = (KV.ship.w / 100 * SW) * SHIP_IN.scale / 2;
            const shipStartX = (vw + shipHalfStart + 40) - shipCx;
            const shipStartY = SHIP_IN.startYVH * vh;

            const wallTravel = clamp(vw * 0.03, 20, 48);
            const wallSeal = clamp(vw * 0.01, 12, 20);
            const wallSealScale = clamp(1 + wallSeal / (bgW * 0.36), 1.02, 1.05);
            const wallCloseAt = clamp(
                getHeroStickyThreshold(heroScrollDistance, vh) / heroScrollDistance,
                0.46,
                0.60
            );
            M = {
                vw, vh, SW, SH, PAN, PANBG, bgW, bgH, assets, shipStartX, shipStartY,
                wallTravel, wallSealScale, wallCloseAt,
            };
        }

        /* ---------------------------------------------------------
           buildScroll(): one scrubbed timeline, two beats.
             0.00–0.10  hold the poster
             0.10–0.45  assets migrate poster -> KV; the ship sails out of the sky wedge
             0.47–0.55  the staircase rises into place
             0.55–1.00  camera pans down while the runners arrive far -> near
           --------------------------------------------------------- */
        function buildScroll() {
            if (scrollTL) { scrollTL.scrollTrigger?.kill(); scrollTL.kill(); }

            // Walls begin registered with the sky, then acquire a restrained depth offset
            // during the lower camera move. This keeps the opening beat precise while
            // making the split sources read as separate planes later in the scroll.
            const wallDepth = { v: 0 };
            const syncWalls = () => {
                const bgY = Number(gsap.getProperty(el.bg, 'y')) || 0;
                const stageY = Number(gsap.getProperty(el.stage, 'y')) || 0;
                const wallScreenY = bgY + (stageY - bgY) * wallDepth.v;
                gsap.set(el.walls, {
                    y: wallScreenY - stageY,
                });
            };

            scrollTL = gsap.timeline({
                defaults: { ease: 'none' },
                paused: STATIC_FRAME,
                onUpdate: syncWalls,
                scrollTrigger: STATIC_FRAME ? undefined : {
                    trigger: '#scroller',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.8,
                    pin: '#stagewrap',
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                }
            });

            KEYS.forEach((k, i) => {
                const a = M.assets[k];
                scrollTL.fromTo(el[k],
                    { x: a.dx, y: a.dy, scale: a.scale, rotation: a.rotA },
                    { x: 0, y: 0, scale: 1, rotation: a.rotB, duration: 0.45, ease: 'power2.inOut' },
                    0.10 + i * 0.018
                );
            });

            // Walls occlude the incoming ship, then move behind every foreground asset
            // at the shared sticky/closing threshold so the seal cannot cover artwork.
            scrollTL
                .set(el.walls, { zIndex: 20 }, 0)
                .set(el.walls, { zIndex: 4 }, M.wallCloseAt);

            // --- the ship sails out of the sky channel ---------------------------------
            // The wall overlay does the hiding, so the ship itself is never clipped; it
            // only starts small, high and hazy, then grows and descends into place.
            const shipFx = {
                blur: SHIP_IN.blur,
                brightness: SHIP_LIGHT.brightnessFrom,
                saturation: SHIP_LIGHT.saturationFrom,
                shadowAlpha: SHIP_LIGHT.shadowAlphaFrom,
            };
            const paintShip = () => {
                el.ship.style.filter = [
                    `blur(${shipFx.blur.toFixed(2)}px)`,
                    `brightness(${shipFx.brightness.toFixed(3)})`,
                    `saturate(${shipFx.saturation.toFixed(3)})`,
                    `drop-shadow(0 14px 20px rgba(42, 62, 102, ${shipFx.shadowAlpha.toFixed(3)}))`,
                ].join(' ');
            };
            paintShip();

            const wallPeak = M.wallTravel * 1.08;
            const wallOpenDuration = clamp(M.wallCloseAt - 0.34, 0.12, 0.19);
            const wallPeakEnd = 0.26 + wallOpenDuration;
            const wallSettleDuration = clamp(M.wallCloseAt - wallPeakEnd - 0.02, 0.04, 0.08);

            scrollTL
                // x, y and scale run over the same window but on different eases, which
                // bends the straight-line move into an arc: a fast run-in from the right
                // that settles, while the ship lifts and grows as it nears the camera.
                .fromTo(el.ship, { x: M.shipStartX }, { x: 0, duration: 0.34, ease: 'power2.out' }, 0.12)
                .fromTo(el.ship, { y: M.shipStartY }, { y: 0, duration: 0.34, ease: 'power1.inOut' }, 0.12)
                .fromTo(el.ship, { scale: SHIP_IN.scale }, { scale: 1, duration: 0.34, ease: 'power2.out' }, 0.12)
                .fromTo(shipFx, {
                    blur: SHIP_IN.blur,
                    brightness: SHIP_LIGHT.brightnessFrom,
                    saturation: SHIP_LIGHT.saturationFrom,
                    shadowAlpha: SHIP_LIGHT.shadowAlphaFrom,
                }, {
                    blur: 0,
                    brightness: SHIP_LIGHT.brightnessTo,
                    saturation: SHIP_LIGHT.saturationTo,
                    shadowAlpha: SHIP_LIGHT.shadowAlphaTo,
                    duration: 0.30,
                    ease: 'power2.out',
                    onUpdate: paintShip,
                }, 0.14)

                // The physical wall layers part after the ship crosses the right edge.
                // A small overshoot gives the opening weight before both sides settle.
                .fromTo(el.wallLeft, { x: 0, scaleX: 1 }, { x: -wallPeak, scaleX: 1, duration: wallOpenDuration, ease: 'power3.inOut' }, 0.26)
                .fromTo(el.wallRight, { x: 0, scaleX: 1 }, { x: wallPeak, scaleX: 1, duration: wallOpenDuration, ease: 'power3.inOut' }, 0.26)
                .to(el.wallLeft, { x: -M.wallTravel, scaleX: 1, duration: wallSettleDuration, ease: 'power2.out' }, wallPeakEnd)
                .to(el.wallRight, { x: M.wallTravel, scaleX: 1, duration: wallSettleDuration, ease: 'power2.out' }, wallPeakEnd)
                // Closing starts at the same scroll threshold as the sticky header. Each
                // wall scales from its outer viewport edge, so sealing the channel never
                // uncovers a strip of sky at the left or right edge of the screen.
                .to(el.wallLeft, { x: 0, scaleX: M.wallSealScale, duration: 0.34, ease: 'power2.inOut' }, M.wallCloseAt)
                .to(el.wallRight, { x: 0, scaleX: M.wallSealScale, duration: 0.34, ease: 'power2.inOut' }, M.wallCloseAt)
                // Triangle crosses the ship earlier than the other assets, so it changes
                // depth just before their bounds meet. The remaining assets keep the
                // original switch point after the walls have mostly retreated.
                .set('#a-triangle', { zIndex: 5 }, 0.34)
                .set(['#a-bitcoin', '#a-gold', '#a-card'], { zIndex: 5 }, 0.41)

                // --- then the ground arrives: stairs first, runners one at a time --------
                .fromTo(el.stairs, { y: 90, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.14, ease: 'power2.out' }, 0.47)
                .fromTo(el.pshadow, { opacity: 0 },
                    { opacity: 1, duration: 0.26, ease: 'none' }, 0.56)
                .fromTo(el.stage, { y: 0 }, { y: -M.PAN, duration: 0.45 }, 0.55)
                .fromTo(el.bg, { y: 0 }, { y: -M.PANBG, duration: 0.90 }, 0.10)
                .fromTo(el.skyVideo,
                    { scale: SKY_DEPTH.scaleFrom, yPercent: 0 },
                    { scale: SKY_DEPTH.scaleTo, yPercent: SKY_DEPTH.liftPercent, duration: 0.90, ease: 'sine.inOut' },
                    0.10)
                .fromTo(wallDepth, { v: 0 }, { v: WALL_DEPTH, duration: 0.45, ease: 'power1.inOut' }, 0.55)
                // immediateRender:false so this doesn't overwrite the intro's starting state.
                .fromTo('#ui', { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.16, ease: 'power2.in', immediateRender: false }, 0.10);

            // Runners rise along their own body angle, far -> near, one beat at a time.
            el.runners.forEach((node, i) => {
                const runner = RUNNERS[i];
                const angle = runner.revealAngle * Math.PI / 180;
                const fromX = -Math.sin(angle) * runner.revealDistance;
                const fromY = Math.cos(angle) * runner.revealDistance;
                scrollTL.fromTo(node,
                    { x: fromX, y: fromY, opacity: 0, scale: 0.95 },
                    { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(1.04)' },
                    0.55 + i * 0.043
                );
            });

            syncWalls();
            if (STATIC_FRAME) scrollTL.progress(clamp(parseFloat(FRAME) || 0, 0, 1)).pause();
        }

        /* ---------------------------------------------------------
           Opening loader: cycle the six assets, then open the walls
           and scatter each loader copy to its real poster position.
           --------------------------------------------------------- */
        function playIntro() {
            if (introDone) return;
            introDone = true;

            const finishImmediately = () => {
                document.body.classList.remove('is-loading');
                el.loader?.remove();
                gsap.set('.asset .inner', { opacity: 1, clearProps: 'transform' });
                gsap.set('#ui', { opacity: 1, y: 0 });
                gsap.set(siteHeader, { clearProps: 'opacity,transform' });
                startIdle();
                requestSiteScrollbarUpdate();
            };

            // Reloading mid-page and accessibility/static modes skip decorative motion.
            if (window.scrollY > 10 || reduced || STATIC_FRAME) {
                finishImmediately();
                return;
            }

            const loadingDuration = 3.2;
            const exitAt = loadingDuration;
            const loaderIcons = LOADER_ORDER.map(k => el.loaderIcons[k]);
            const progress = { value: 0 };
            const iconTargets = {};

            gsap.set(siteHeader, { opacity: 0, y: -16 });
            gsap.set('.asset .inner', { opacity: 0 });
            gsap.set('#ui', { opacity: 0, y: 16 });
            gsap.set(loaderIcons, {
                xPercent: -50,
                yPercent: -50,
                x: 0,
                y: 0,
                scale: 0.78,
                rotation: 0,
                opacity: 0,
            });

            LOADER_ORDER.forEach(k => {
                const icon = el.loaderIcons[k];
                const target = el[k].getBoundingClientRect();
                const initialWidth = Math.max(1, icon.offsetWidth);
                const posterWidth = parseFloat(el[k].style.width) * M.assets[k].scale;
                iconTargets[k] = {
                    x: target.left + target.width / 2 - M.vw / 2,
                    y: target.top + target.height / 2 - M.vh / 2,
                    scale: posterWidth / initialWidth,
                    rotation: M.assets[k].rotA,
                };
            });

            gsap.set(el.walls, { zIndex: 20 });
            gsap.set(el.wallIntroLeft, { x: 0, scaleX: 1.38 });
            gsap.set(el.wallIntroRight, { x: 0, scaleX: 1.33 });

            const tl = gsap.timeline({
                defaults: { ease: 'power3.out' },
                onComplete: () => {
                    gsap.set('.asset .inner', { opacity: 1, clearProps: 'transform' });
                    document.body.classList.remove('is-loading');
                    el.loader.remove();
                    gsap.set(siteHeader, { clearProps: 'opacity,transform' });
                    ScrollTrigger.refresh();
                    startIdle();
                    requestSiteScrollbarUpdate();
                },
            });

            tl.fromTo(el.loaderProgressFill,
                { scaleX: 0 },
                { scaleX: 1, duration: loadingDuration - 0.12, ease: 'none' }, 0.06)
                .to(progress, {
                    value: 100,
                    duration: loadingDuration - 0.12,
                    ease: 'none',
                    onUpdate: () => {
                        const value = Math.round(progress.value);
                        el.loaderProgressValue.textContent = `${String(value).padStart(2, '0')}%`;
                        el.loaderProgress.setAttribute('aria-valuenow', String(value));
                    },
                }, 0.06);

            LOADER_ORDER.forEach((k, i) => {
                const icon = el.loaderIcons[k];
                const at = 0.16 + i * 0.48;
                const tilt = i % 2 === 0 ? -7 : 7;

                tl.fromTo(icon,
                    { opacity: 0, scale: 0.72, rotation: tilt },
                    { opacity: 1, scale: 1, rotation: 0, duration: 0.24 },
                    at
                );

                if (i < LOADER_ORDER.length - 1) {
                    tl.to(icon,
                        { opacity: 0, scale: 1.08, duration: 0.18, ease: 'power2.in' },
                        at + 0.28
                    );
                }
            });

            tl.to(el.loaderProgress, { opacity: 0, y: 8, duration: 0.22 }, exitAt - 0.12)
                .set(loaderIcons, {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotation: 0,
                }, exitAt)
                .to(el.loaderSurface, { opacity: 0, duration: 0.72, ease: 'power2.out' }, exitAt)
                .to(el.wallIntroLeft, { scaleX: 1, duration: 1.15, ease: 'power3.inOut' }, exitAt)
                .to(el.wallIntroRight, { scaleX: 1, duration: 1.15, ease: 'power3.inOut' }, exitAt)
                .fromTo(el.titleInner,
                    { opacity: 0, y: -20, scale: 0.96 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: 'power3.out' },
                    exitAt + 0.34
                )
                .to(siteHeader, { opacity: 1, y: 0, duration: 0.56 }, exitAt + 0.48)
                .to('#ui', { opacity: 1, y: 0, duration: 0.62 }, exitAt + 0.64);

            LOADER_ORDER.forEach((k, i) => {
                const icon = el.loaderIcons[k];
                const target = iconTargets[k];
                const at = exitAt + 0.10 + i * 0.045;

                tl.set(icon, { zIndex: 20 + i }, at)
                    .to(icon, {
                        x: target.x,
                        y: target.y,
                        scale: target.scale,
                        rotation: target.rotation,
                        duration: 1.06,
                        ease: 'power3.inOut',
                    }, at);
            });

            tl.set('.asset .inner', { opacity: 1 }, exitAt + 1.54)
                .set(loaderIcons, { opacity: 0 }, exitAt + 1.54)
                .to(el.loader, { opacity: 0, duration: 0.18, ease: 'none' }, exitAt + 1.54);
        }

        /* ---------- idle float (on .floaty) ---------- */
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const saveData = navigator.connection?.saveData === true;
        let idleStarted = false;
        let idleTweens = [];
        let sceneIsVisible = true;
        let skyObserver = null;

        function setupSkyMotion() {
            const video = el.skyVideo;
            const mediaMotionAllowed = !reduced && !saveData && !STATIC_FRAME;

            const syncSceneActivity = () => {
                const active = sceneIsVisible && !document.hidden;
                idleTweens.forEach(tween => tween.paused(!active));

                if (!mediaMotionAllowed) return;
                if (active) {
                    video.play().catch(() => el.bg.classList.remove('is-video-ready'));
                } else {
                    video.pause();
                }
            };

            if (!mediaMotionAllowed) {
                video.pause();
                el.bg.classList.remove('is-video-ready');
            } else {
                video.playbackRate = 0.72;
                video.addEventListener('playing', () => {
                    el.bg.classList.add('is-video-ready');
                }, { once: true });
                video.addEventListener('error', () => {
                    el.bg.classList.remove('is-video-ready');
                });
            }

            if (STATIC_FRAME || reduced) return;

            skyObserver = new IntersectionObserver(([entry]) => {
                sceneIsVisible = entry.isIntersecting;
                syncSceneActivity();
            }, { threshold: 0.04 });
            skyObserver.observe(el.stagewrap);

            document.addEventListener('visibilitychange', syncSceneActivity);
        }

        function startIdle() {
            if (!ASSET_IDLE_ENABLED || idleStarted || reduced || STATIC_FRAME) return;
            idleStarted = true;

            KEYS.filter(k => k !== 'title').forEach(k => {
                const tween = gsap.to(el[k + 'Float'], {
                    y: `+=${gsap.utils.random(9, 17)}`,
                    rotate: `+=${gsap.utils.random(3, 8) * (Math.random() > 0.5 ? 1 : -1)}`,
                    duration: gsap.utils.random(3, 5),
                    ease: 'sine.inOut', yoyo: true, repeat: -1,
                    paused: !sceneIsVisible || document.hidden,
                });
                idleTweens.push(tween);
            });

            // The CTA animates itself in CSS now — driving scale from GSAP too would
            // fight the hover transform.
        }

        /* ---------- boot ---------- */
        function boot() {
            layout();
            setupSkyMotion();
            const skipOpeningMotion = STATIC_FRAME || reduced || window.scrollY > 10;

            if (skipOpeningMotion) {
                // Static/seeked states must render last so their timeline progress wins.
                playIntro();
                buildScroll();
            } else {
                // The loader needs frame-0 asset geometry before it can scatter accurately.
                buildScroll();
                playIntro();
            }
            requestSiteScrollbarUpdate();
        }

        if (document.readyState === 'complete') boot();
        else window.addEventListener('load', boot);

        let rAF = null;
        let viewportWidth = window.innerWidth;
        let viewportHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            const nextWidth = window.innerWidth;
            const nextHeight = window.innerHeight;
            if (nextWidth === viewportWidth && nextHeight === viewportHeight) return;
            viewportWidth = nextWidth;
            viewportHeight = nextHeight;

            if (rAF) cancelAnimationFrame(rAF);
            rAF = requestAnimationFrame(() => {
                layout();
                buildScroll();
                ScrollTrigger.refresh();
                requestSiteScrollbarUpdate();
            });
        });

        /* ---------- press K to diff against the original KV ---------- */
        document.addEventListener('keydown', e => {
            if (e.key.toLowerCase() !== 'k') return;
            const ref = document.getElementById('kvref');
            if (!ref.style.backgroundImage) ref.style.backgroundImage = "url('../images/kv-ref.webp')";
            ref.style.opacity = ref.style.opacity === '1' ? '0' : '1';
        });
    

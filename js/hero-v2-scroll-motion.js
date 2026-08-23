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
            title: { cx: 52.36, cy: 16.16, w: 44.20, rot: 0 },
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
            title: { cx: 50.0, cy: 31.0, w: 42.5, rot: 0, min: 255, max: 850 },
            triangle: { cx: 8.5, cy: 14.5, w: 13.0, rot: -10, min: 58, max: 230 },
            gold: { cx: 84.5, cy: 16.8, w: 5.5, rot: 8, min: 48, max: 130 },
            card: { cx: 91.5, cy: 42.0, w: 9.5, rot: 12, min: 52, max: 180 },
            stock: { cx: 6.4, cy: 71.0, w: 4.2, rot: -14, min: 22, max: 68 },
            bitcoin: { cx: 26.8, cy: 66.5, w: 6.0, rot: -8, min: 44, max: 140 },
            heart: { cx: 89.5, cy: 76.0, w: 14.0, rot: -5, min: 56, max: 240 },
        };
        const posterIconShiftY = viewportWidth => viewportWidth <= 991 ? 5 : 9;
        // Ceiling on the poster title's height, as a share of the viewport. Only bites on
        // short viewports, where a width-driven title would overlap the CTA block below.
        const TITLE_MAX_VH = 0.289;
        const TITLE_UI_GAP = { min: 24, preferredVh: 0.04, max: 44 };
        const UI_BOTTOM_RESERVE = 32;
        const mobileHeaderClearanceShift = viewportWidth => viewportWidth <= 575 ? 9 : 0;
        const mobileUiStaticTopRatio = viewportWidth => viewportWidth <= 575 ? 0.76 : 0.70;
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
        const SHIP_RUN = {
            duration: 4.037367,
            fps: 30000 / 1001,
            startAt: 1.00,
            scrollDuration: 0.86,
            whiteoutDuration: 0.42,
            conceptRevealDelay: 720,
            playbackRate: 1.75,
            /* ship-new-3 is a 16:9 composition centred and bottom-aligned. */
            canvasRatio: 2560 / 1440,
            contentHeightShare: 0.7333,
            // The portrait asset this sequence was originally aligned to: its aspect and
            // content share are the reference the entry size is reproduced from.
            legacyCanvasRatio: 1248 / 1664,
            legacyContentHeightShare: 0.7344,
        };
        const HERO_RUN_PROGRESS_EVENT = 'bettertrade:hero-run-progress';
        const HERO_SCROLL_CUE_EVENT = 'bettertrade:hero-scroll-cue';
        const HERO_SCROLL_CUE_REVEAL_AT = 0.34;
        const HERO_SCROLL_ACCELERATION = 2;
        let heroRunProgressMode = '';
        let heroRunProgressValue = -1;
        let heroScrollCueVisible = false;

        function publishHeroScrollCueState(visible) {
            window.__betterTradeHeroScrollCueVisible = visible;
            if (visible === heroScrollCueVisible) return;

            heroScrollCueVisible = visible;
            window.dispatchEvent(new CustomEvent(HERO_SCROLL_CUE_EVENT, {
                detail: { visible },
            }));
        }

        function publishHeroRunProgress(mode, progress = 0) {
            const value = clamp(progress, 0, 1);
            if (mode === heroRunProgressMode
                && Math.abs(value - heroRunProgressValue) < 0.001) return;

            heroRunProgressMode = mode;
            heroRunProgressValue = value;
            window.dispatchEvent(new CustomEvent(HERO_RUN_PROGRESS_EVENT, {
                detail: { mode, progress: value },
            }));
        }

        function updateHeroRunProgress() {
            if (STATIC_FRAME) {
                publishHeroScrollCueState(false);
                publishHeroRunProgress('hidden');
                return;
            }

            if (isMobileStatic() || reduced) {
                publishHeroScrollCueState(false);
                const revealAt = Math.max(0, el.concept.offsetTop - document.documentElement.clientHeight * 0.5);
                publishHeroRunProgress(window.scrollY >= revealAt ? 'ready' : 'hidden');
                return;
            }

            if (shipRunHasCompleted) {
                publishHeroScrollCueState(false);
                publishHeroRunProgress(window.scrollY > 10 ? 'ready' : 'hidden', 1);
                return;
            }

            if (shipRunScrubState === 'playing') {
                publishHeroScrollCueState(false);
                updateShipRunPlaybackProgress();
                return;
            }

            const timelineTime = scrollTL?.time() || 0;
            publishHeroScrollCueState(
                timelineTime >= HERO_SCROLL_CUE_REVEAL_AT && timelineTime < SHIP_RUN.startAt
            );
            if (timelineTime < SHIP_RUN.startAt) {
                publishHeroRunProgress('hidden');
                return;
            }

            publishHeroRunProgress(
                'progress',
                (timelineTime - SHIP_RUN.startAt) / SHIP_RUN.scrollDuration
            );
        }

        /* How tall the virtual KV canvas is, in viewport heights. Bigger = the KV fills
           more of a wide screen and the beat-2 camera move gets longer. Portrait screens
           are already close to the KV's own proportion, so they need less zoom. */
        const stageHeightVH = aspect => aspect >= 1.2 ? 1.40 : 1.15;

        const KEYS = ['title', 'triangle', 'bitcoin', 'gold', 'heart', 'card', 'stock'];
        // All 6 asset icons — regroups at the center and scatters to its poster slot as a
        // full set once loading ends, regardless of how many cycled through the spinner.
        const ASSET_ICON_KEYS = ['stock', 'bitcoin', 'gold', 'card', 'heart', 'triangle'];
        // The spinner only cycles through this (shorter) subset while loading. Fewer entries
        // = a shorter cycle without touching LOADING_SPEED. 'triangle' must stay last: it's
        // the icon the loader settles on right before the walls open.
        const LOADER_ORDER = ['bitcoin', 'gold', 'stock', 'triangle'];
        const ASSET_IDLE_ENABLED = true;
        const LOADING_SPEED = 2; // >1 = faster progress bar + icon cycling; the wall/title/header reveal keeps its original pace
        const mobileStaticQuery = window.matchMedia('(max-width: 1199px)');
        const isMobileStatic = () => mobileStaticQuery.matches && !STATIC_FRAME;
        const readLargeViewportHeight = () => {
            if (!window.CSS?.supports?.('height', '100lvh')) return document.documentElement.clientHeight;

            const probe = document.createElement('div');
            probe.setAttribute('aria-hidden', 'true');
            probe.style.cssText = [
                'position:fixed',
                'left:-9999px',
                'top:0',
                'width:1px',
                'height:100lvh',
                'visibility:hidden',
                'pointer-events:none',
            ].join(';');
            document.body.appendChild(probe);
            const height = probe.getBoundingClientRect().height;
            probe.remove();
            return Number.isFinite(height) && height > 0 ? height : document.documentElement.clientHeight;
        };
        // iOS Safari changes window.innerHeight whenever its bottom toolbar collapses.
        // Size the mobile hero from the large viewport up front, then keep that reference
        // for vertical-only browser chrome resizes. The scene therefore starts at the
        // scale it would have after the toolbar collapses, without growing mid-scroll.
        let mobileLayoutViewportHeight = readLargeViewportHeight();

        const readRootPixelValue = (property, fallback) => {
            const value = Number.parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue(property)
            );
            return Number.isFinite(value) ? value : fallback;
        };

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
            shipRunLayer: document.getElementById('ship-run-layer'),
            shipRunCanvas: document.getElementById('ship-run-canvas'),
            shipRunVideo: document.getElementById('ship-run-video'),
            shipRunWhiteout: document.getElementById('ship-run-whiteout'),
            concept: document.getElementById('concept'),
            conceptIntro: document.querySelector('.concept__inner'),
            conceptVideoScroll: document.querySelector('.concept__video-scroll'),
            conceptVideoFrame: document.querySelector('.concept__video-frame'),
            loader: document.getElementById('loader'),
            loaderSurface: document.querySelector('.loader-surface'),
            loaderProgress: document.querySelector('.loader-progress'),
            loaderProgressFill: document.querySelector('.loader-progress__fill'),
            loaderProgressValue: document.querySelector('.loader-progress__value'),
            siteHeader: document.getElementById('site-header'),
            siteScrollbar: document.getElementById('site-scrollbar'),
            siteScrollbarThumb: document.querySelector('.site-scrollbar__thumb'),
        };
        KEYS.forEach(k => {
            el[k] = document.getElementById('a-' + k);
            el[k + 'Float'] = el[k].querySelector('.floaty');
            el[k + 'Inner'] = el[k].querySelector('.inner');
        });
        el.loaderIcons = Object.fromEntries(ASSET_ICON_KEYS.map(k => [
            k,
            document.querySelector(`[data-loader-icon="${k}"]`),
        ]));

        // One <img> per runner, so each can be revealed on its own beat.
        el.runners = RUNNERS.map(r => {
            const img = document.createElement('img');
            img.src = `images/${r.id}.webp`;
            img.alt = '';
            img.decoding = 'sync';
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
        let scrollbarRevealTimer = null;
        let scrollbarDrag = null;
        const shipRunState = { time: 0 };
        let shipRunTargetTime = 0;
        let shipRunSyncRAF = null;
        let shipRunRenderRAF = null;
        let shipRunWatchRAF = null;
        let shipRunWatchLastTime = -1;
        let shipRunWatchStallFrames = 0;
        let shipRunProgressStartedAt = 0;
        let shipRunProgressBaseTime = 0;
        let shipRunScrollLockY = 0;
        let shipRunScrollLocked = false;
        let shipRunHasCompleted = false;
        let shipRunHeroRestored = false;
        let completedHeroTimelineBuilt = false;
        let shipRunConceptRevealTimer = null;
        let shipRunStaticScene = [];
        let syncShipLookToTimeline = () => {};

        function createShipRunRenderer() {
            const gl = el.shipRunCanvas.getContext('webgl', {
                alpha: true,
                premultipliedAlpha: false,
                antialias: false,
            });
            if (!gl) return () => {};

            const compile = (type, source) => {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    throw new Error(gl.getShaderInfoLog(shader));
                }
                return shader;
            };
            const program = gl.createProgram();
            gl.attachShader(program, compile(gl.VERTEX_SHADER, `
                attribute vec2 a_position;
                varying vec2 v_uv;
                void main() {
                    v_uv = vec2((a_position.x + 1.0) * 0.5, (1.0 - a_position.y) * 0.5);
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }
            `));
            gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
                precision mediump float;
                varying vec2 v_uv;
                uniform sampler2D u_packed;
                void main() {
                    // The left half stores color; the right half stores its alpha matte.
                    vec2 colorUv = vec2(v_uv.x * 0.5, v_uv.y);
                    vec2 alphaUv = vec2(0.5 + v_uv.x * 0.5, v_uv.y);
                    vec3 color = texture2D(u_packed, colorUv).rgb;
                    float alpha = texture2D(u_packed, alphaUv).r;
                    gl_FragColor = vec4(color, alpha);
                }
            `));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program));
            }
            gl.useProgram(program);

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1, 1, -1, -1, 1,
                -1, 1, 1, -1, 1, 1,
            ]), gl.STATIC_DRAW);
            const position = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

            const makeTexture = (unit, uniform) => {
                const texture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.uniform1i(gl.getUniformLocation(program, uniform), unit);
                return texture;
            };
            const packedTexture = makeTexture(0, 'u_packed');

            return () => {
                if (el.shipRunVideo.readyState < 2 || el.shipRunVideo.seeking) return;
                gl.viewport(0, 0, el.shipRunCanvas.width, el.shipRunCanvas.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, packedTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, el.shipRunVideo);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            };
        }

        const drawShipRunFrame = createShipRunRenderer();
        function requestShipRunRender() {
            if (shipRunRenderRAF) return;
            shipRunRenderRAF = requestAnimationFrame(() => {
                shipRunRenderRAF = null;
                drawShipRunFrame();
                if (!el.shipRunVideo.paused) requestShipRunRender();
            });
        }

        el.shipRunVideo.pause();
        el.shipRunVideo.addEventListener('loadeddata', requestShipRunRender);
        el.shipRunVideo.addEventListener('seeked', requestShipRunRender);
        el.shipRunVideo.addEventListener('timeupdate', requestShipRunRender);
        el.shipRunVideo.addEventListener('timeupdate', updateShipRunPlaybackProgress);
        el.shipRunVideo.addEventListener('ended', completeShipRunScrub);
        el.shipRunVideo.addEventListener('loadedmetadata', () => {
            // A reload can restore the browser midway down the page. Prime the video
            // from the timeline state instead of flashing its first frame there.
            shipRunTargetTime = shipRunState.time;
            el.shipRunVideo.currentTime = clamp(
                shipRunTargetTime,
                0,
                Math.max(0, el.shipRunVideo.duration - 0.001)
            );
        }, { once: true });

        let shipRunScrubState = 'idle';

        function getShipRunDuration() {
            if (Number.isFinite(el.shipRunVideo.duration)) {
                return el.shipRunVideo.duration;
            }
            return SHIP_RUN.duration;
        }

        function setShipRunPlaybackRate() {
            el.shipRunVideo.defaultPlaybackRate = SHIP_RUN.playbackRate;
            el.shipRunVideo.playbackRate = SHIP_RUN.playbackRate;
        }

        function isShipRunScrollLocked() {
            return shipRunScrollLocked && shipRunScrubState === 'playing';
        }

        function lockShipRunScroll() {
            shipRunScrollLockY = window.scrollY;
            shipRunScrollLocked = true;
        }

        function unlockShipRunScroll() {
            shipRunScrollLocked = false;
        }

        function keepShipRunScrollLocked() {
            if (!isShipRunScrollLocked()) return;
            if (Math.abs(window.scrollY - shipRunScrollLockY) > 1) {
                window.scrollTo(0, shipRunScrollLockY);
            }
        }

        function preventShipRunScroll(event) {
            if (!isShipRunScrollLocked()) return;
            event.preventDefault();
        }

        function preventShipRunKeyScroll(event) {
            if (!isShipRunScrollLocked()) return;
            const scrollKeys = [
                'ArrowDown',
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'End',
                'Home',
                'PageDown',
                'PageUp',
                ' ',
            ];
            if (scrollKeys.includes(event.key)) {
                event.preventDefault();
            }
        }

        function stopShipRunWatchdog() {
            if (shipRunWatchRAF) cancelAnimationFrame(shipRunWatchRAF);
            shipRunWatchRAF = null;
            shipRunWatchLastTime = -1;
            shipRunWatchStallFrames = 0;
            shipRunProgressStartedAt = 0;
            shipRunProgressBaseTime = 0;
        }

        function startShipRunWatchdog() {
            stopShipRunWatchdog();
            shipRunProgressStartedAt = performance.now();
            shipRunProgressBaseTime = el.shipRunVideo.currentTime || 0;

            const tick = () => {
                shipRunWatchRAF = null;
                if (shipRunScrubState !== 'playing') return;

                const duration = getShipRunDuration();
                const currentTime = el.shipRunVideo.currentTime || 0;
                const elapsedTime = (performance.now() - shipRunProgressStartedAt) / 1000;
                const progressTime = clamp(
                    Math.max(currentTime, shipRunProgressBaseTime + elapsedTime * SHIP_RUN.playbackRate),
                    0,
                    duration
                );

                updateShipRunPlaybackProgress(progressTime);

                if (duration > 0 && currentTime >= duration - 1 / SHIP_RUN.fps) {
                    completeShipRunScrub();
                    return;
                }

                const isStalled = !el.shipRunVideo.paused
                    && !el.shipRunVideo.ended
                    && el.shipRunVideo.readyState >= 2
                    && Math.abs(currentTime - shipRunWatchLastTime) < 0.002;

                shipRunWatchStallFrames = isStalled ? shipRunWatchStallFrames + 1 : 0;
                shipRunWatchLastTime = currentTime;

                if (shipRunWatchStallFrames > 45) {
                    shipRunScrubState = 'scrubbing';
                    shipRunState.time = currentTime / SHIP_RUN.playbackRate;
                    syncShipRunToScroll();
                    return;
                }

                shipRunWatchRAF = requestAnimationFrame(tick);
            };

            shipRunWatchRAF = requestAnimationFrame(tick);
        }

        function syncShipRunToScroll() {
            if (shipRunScrubState === 'playing') {
                updateShipRunPlaybackProgress();
                return;
            }

            shipRunTargetTime = clamp(
                shipRunState.time * SHIP_RUN.playbackRate,
                0,
                Math.max(0, getShipRunDuration() - 0.001)
            );
            if (shipRunSyncRAF) return;

            shipRunSyncRAF = requestAnimationFrame(() => {
                shipRunSyncRAF = null;
                const threshold = 0.5 / SHIP_RUN.fps;
                if (el.shipRunVideo.readyState >= 1) {
                    const target = clamp(
                        shipRunTargetTime,
                        0,
                        Math.max(0, el.shipRunVideo.duration - 0.001)
                    );
                    if (Math.abs(el.shipRunVideo.currentTime - target) > threshold) {
                        el.shipRunVideo.currentTime = target;
                    }
                }
                requestShipRunRender();
            });

            const whiteoutStart = getShipRunDuration() - SHIP_RUN.whiteoutDuration;
            gsap.set(el.shipRunWhiteout, {
                opacity: clamp(
                    (shipRunTargetTime - whiteoutStart) / SHIP_RUN.whiteoutDuration,
                    0,
                    1
                ),
            });

            if (shipRunScrubState === 'scrubbing'
                && shipRunTargetTime >= getShipRunDuration() - 1 / SHIP_RUN.fps) {
                completeShipRunScrub();
            }
        }

        function updateShipRunPlaybackProgress(progressTime = null) {
            if (shipRunScrubState !== 'playing') return;
            const duration = getShipRunDuration();
            if (duration <= 0) return;
            const currentTime = clamp(
                progressTime ?? el.shipRunVideo.currentTime,
                0,
                duration
            );
            const whiteoutStart = duration - SHIP_RUN.whiteoutDuration;
            gsap.set(el.shipRunWhiteout, {
                opacity: clamp(
                    (currentTime - whiteoutStart) / SHIP_RUN.whiteoutDuration,
                    0,
                    1
                ),
            });
            publishHeroRunProgress('progress', currentTime / duration);
        }

        function playShipRunVideo(video) {
            setShipRunPlaybackRate();
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    // ถ้า browser ไม่ยอม autoplay แม้จะ muted ให้กลับไปใช้ scroll scrub เดิม
                    // เพื่อให้ sequence ยังทำงานต่อได้แทนที่จะค้างภาพว่าง
                    if (shipRunScrubState !== 'playing') return;
                    shipRunScrubState = 'scrubbing';
                    syncShipRunToScroll();
                });
            }
        }

        function maintainCompletedHeroScene() {
            if (!shipRunHeroRestored) return;
            gsap.set(el.shipRunLayer, { opacity: 0 });
            gsap.set(el.shipRunWhiteout, { opacity: 0 });
            if (!scrollTL || scrollTL.time() >= SHIP_RUN.startAt - 0.001) {
                gsap.set(shipRunStaticScene, { opacity: 1 });
            }
        }

        function setCompletedShipLook() {
            el.ship.style.filter = [
                'blur(0px)',
                `brightness(${SHIP_LIGHT.brightnessTo})`,
                `saturate(${SHIP_LIGHT.saturationTo})`,
                `drop-shadow(0 14px 20px rgba(42, 62, 102, ${SHIP_LIGHT.shadowAlphaTo}))`,
            ].join(' ');
        }

        function activateCompletedHeroTimeline() {
            if (completedHeroTimelineBuilt) return;
            completedHeroTimelineBuilt = true;
            buildScroll();
            ScrollTrigger.refresh();
            window.scrollTo(0, el.concept.offsetTop);
            requestSiteScrollbarUpdate();
        }

        function restoreCompletedHeroScene() {
            if (!shipRunHasCompleted) return;
            if (shipRunConceptRevealTimer) clearTimeout(shipRunConceptRevealTimer);
            shipRunConceptRevealTimer = null;
            stopShipRunWatchdog();
            unlockShipRunScroll();
            shipRunScrubState = 'complete';
            shipRunHeroRestored = true;
            el.shipRunVideo.pause();
            setShipRunPlaybackRate();
            if (el.shipRunVideo.readyState >= 1) el.shipRunVideo.currentTime = 0;
            gsap.killTweensOf(el.shipRunWhiteout);
            el.concept.classList.add('is-revealed');
            maintainCompletedHeroScene();
            requestShipRunRender();
            updateHeroRunProgress();
        }

        function resetShipRunScrub() {
            if (shipRunHasCompleted) {
                restoreCompletedHeroScene();
                return;
            }
            if (shipRunConceptRevealTimer) clearTimeout(shipRunConceptRevealTimer);
            shipRunConceptRevealTimer = null;
            stopShipRunWatchdog();
            unlockShipRunScroll();
            shipRunScrubState = 'idle';
            shipRunState.time = 0;
            shipRunTargetTime = 0;
            el.shipRunVideo.pause();
            setShipRunPlaybackRate();
            if (el.shipRunVideo.readyState >= 1) el.shipRunVideo.currentTime = 0;
            gsap.set(el.shipRunWhiteout, { opacity: 0 });
            gsap.set(el.shipRunLayer, { opacity: 0 });
            gsap.set(shipRunStaticScene, { opacity: 1 });
            el.concept.classList.remove('is-awaiting-entry', 'is-revealed');
            requestShipRunRender();
            updateHeroRunProgress();
        }

        function completeShipRunScrub() {
            if (shipRunScrubState !== 'scrubbing' && shipRunScrubState !== 'playing') return;
            stopShipRunWatchdog();
            unlockShipRunScroll();
            shipRunScrubState = 'complete';
            shipRunHasCompleted = true;
            shipRunHeroRestored = false;
            el.shipRunVideo.pause();
            gsap.set(el.shipRunWhiteout, { opacity: 1 });
            updateHeroRunProgress();

            requestAnimationFrame(() => {
                activateCompletedHeroTimeline();
                shipRunConceptRevealTimer = setTimeout(() => {
                    shipRunConceptRevealTimer = null;
                    el.concept.classList.add('is-revealed');
                }, SHIP_RUN.conceptRevealDelay);
            });
        }

        function startShipRunScrub() {
            if (STATIC_FRAME) return;
            if (shipRunHasCompleted) {
                restoreCompletedHeroScene();
                return;
            }
            if (shipRunScrubState === 'scrubbing' || shipRunScrubState === 'playing') return;
            stopShipRunWatchdog();
            shipRunScrubState = 'playing';
            shipRunHeroRestored = false;
            lockShipRunScroll();
            shipRunState.time = 0;
            shipRunTargetTime = 0;
            el.concept.classList.add('is-awaiting-entry');
            el.concept.classList.remove('is-revealed');
            gsap.set(el.shipRunWhiteout, { opacity: 0 });
            gsap.set(el.shipRunLayer, { opacity: 1 });
            gsap.set(shipRunStaticScene, { opacity: 0 });

            el.shipRunVideo.pause();
            if (el.shipRunVideo.readyState >= 1) el.shipRunVideo.currentTime = 0;
            playShipRunVideo(el.shipRunVideo);
            startShipRunWatchdog();
            requestShipRunRender();
            updateHeroRunProgress();
        }

        window.addEventListener('scroll', () => {
            keepShipRunScrollLocked();
            if (shipRunHasCompleted
                && !shipRunHeroRestored
                && window.scrollY < el.concept.offsetTop - 2) {
                restoreCompletedHeroScene();
            }
        }, { passive: true });
        window.addEventListener('wheel', preventShipRunScroll, { passive: false });
        window.addEventListener('touchmove', preventShipRunScroll, { passive: false });
        window.addEventListener('keydown', preventShipRunKeyScroll);

        function updateSiteScrollbar() {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
            const trackHeight = el.siteScrollbar.clientHeight;
            const thumbHeight = maxScroll > 0
                ? Math.max(32, trackHeight * document.documentElement.clientHeight / document.documentElement.scrollHeight)
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

        function revealSiteScrollbar() {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
            if (document.body.classList.contains('is-loading') || maxScroll <= 0) return;

            el.siteScrollbar.classList.add('is-visible');
            clearTimeout(scrollbarRevealTimer);
            scrollbarRevealTimer = setTimeout(() => {
                if (!scrollbarDrag) {
                    el.siteScrollbar.classList.remove('is-visible');
                }
            }, 1100);
        }

        function handleSiteScrollbarScroll() {
            revealSiteScrollbar();
            requestSiteScrollbarUpdate();
            updateHeroRunProgress();
        }

        function scrollFromScrollbarPointer(clientY, startScroll, startPointerY) {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
            const thumbHeight = parseFloat(getComputedStyle(el.siteScrollbar).getPropertyValue('--thumb-height')) || 32;
            const travel = Math.max(1, el.siteScrollbar.clientHeight - thumbHeight);
            window.scrollTo(0, clamp(startScroll + (clientY - startPointerY) * maxScroll / travel, 0, maxScroll));
        }

        el.siteScrollbarThumb.addEventListener('pointerdown', event => {
            event.preventDefault();
            scrollbarDrag = { pointerY: event.clientY, scrollY: window.scrollY };
            revealSiteScrollbar();
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
            revealSiteScrollbar();
            if (el.siteScrollbarThumb.hasPointerCapture(event.pointerId)) {
                el.siteScrollbarThumb.releasePointerCapture(event.pointerId);
            }
        };
        el.siteScrollbarThumb.addEventListener('pointerup', stopScrollbarDrag);
        el.siteScrollbarThumb.addEventListener('pointercancel', stopScrollbarDrag);

        el.siteScrollbar.addEventListener('pointerdown', event => {
            if (event.target === el.siteScrollbarThumb) return;
            revealSiteScrollbar();
            const track = el.siteScrollbar.getBoundingClientRect();
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
            const thumbHeight = parseFloat(getComputedStyle(el.siteScrollbar).getPropertyValue('--thumb-height')) || 32;
            const travel = Math.max(1, track.height - thumbHeight);
            const progress = clamp((event.clientY - track.top - thumbHeight / 2) / travel, 0, 1);
            window.scrollTo({ top: progress * maxScroll, behavior: 'smooth' });
        });

        el.siteScrollbar.addEventListener('keydown', event => {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
            const keyTargets = {
                ArrowUp: window.scrollY - 64,
                ArrowDown: window.scrollY + 64,
                PageUp: window.scrollY - document.documentElement.clientHeight * 0.8,
                PageDown: window.scrollY + document.documentElement.clientHeight * 0.8,
                Home: 0,
                End: maxScroll,
            };
            if (!(event.key in keyTargets)) return;
            event.preventDefault();
            window.scrollTo(0, clamp(keyTargets[event.key], 0, maxScroll));
        });

        window.addEventListener('scroll', handleSiteScrollbarScroll, { passive: true });

        /* ?frame=0.55 renders one still frame of the scroll timeline instead of wiring
           it to the scrollbar: no ScrollTrigger, no pin, document exactly one viewport.
           Handy for checking a beat, and for screenshotting in tools that can't scroll. */
        const FRAME = new URLSearchParams(location.search).get('frame');
        const STATIC_FRAME = FRAME !== null;

        /* ---------------------------------------------------------
           layout(): position everything for BOTH frames, in pixels.
           --------------------------------------------------------- */
        function layout() {
            const mobileStatic = isMobileStatic();
            const vw = document.documentElement.clientWidth;
            const vh = mobileStatic ? mobileLayoutViewportHeight : document.documentElement.clientHeight;
            const staticTopInset = mobileStatic
                ? readRootPixelValue('--hero-static-top-inset', 48)
                : 0;
            const staticBottomGap = mobileStatic
                ? readRootPixelValue('--hero-static-bottom-gap', 32)
                : 0;
            const staticStageMaxVW = mobileStatic
                ? readRootPixelValue('--hero-static-stage-max-vw', 1.8)
                : 0.98;

            // Mobile uses a wider, cropped KV canvas so the complete ship/stair composition
            // has enough vertical room to read as a long-form scene instead of a desktop
            // poster squeezed into one viewport.
            const SW = mobileStatic
                ? Math.min(vh * stageHeightVH(vw / vh) * KV_RATIO, vw * staticStageMaxVW)
                : Math.min(vh * stageHeightVH(vw / vh) * KV_RATIO, vw * 0.98);
            const SH = SW / KV_RATIO;
            const stageLeft = (vw - SW) / 2;

            el.stage.style.cssText =
                `position:absolute;width:${SW}px;height:${SH}px;left:${stageLeft}px;top:${staticTopInset}px;will-change:transform;`;

            // How far the camera travels in beat 2.
            const PAN = Math.max(0, SH - vh) * 0.98;

            // Background keeps the KV proportion but must cover the viewport in BOTH
            // axes — on a tall/narrow screen, matching width alone leaves a gap below.
            const mobileBackgroundHeight = SH + staticTopInset;
            const bgW = mobileStatic
                ? Math.max(vw, SW, mobileBackgroundHeight * KV_RATIO)
                : Math.max(vw, SW, vh * KV_RATIO);
            const bgH = mobileStatic ? mobileBackgroundHeight : bgW / KV_RATIO;
            el.bg.style.width = bgW + 'px';
            el.bg.style.height = bgH + 'px';
            el.bg.style.left = ((vw - bgW) / 2) + 'px';
            el.bg.style.top = '0px';
            const PANBG = Math.min(PAN * (bgH / SH), Math.max(0, bgH - vh));

            // Scroll length = the pinned view + beat 1 + however far beat 2 actually moves,
            // so a short camera move never leaves dead scroll behind it.
            // Lowering only the extra pinned distance makes each wheel/touch scroll move
            // the hero timeline further without changing the first viewport composition.
            const desktopScrollExtra = (vh * 4.1 + PAN * 1.4) / HERO_SCROLL_ACCELERATION;
            const scrollerHeight = mobileStatic
                ? bgH
                : vh + desktopScrollExtra;
            const heroScrollDistance = Math.max(1, scrollerHeight - vh);
            document.getElementById('scroller').style.height = STATIC_FRAME ? vh + 'px' : scrollerHeight + 'px';
            el.stagewrap.style.height = mobileStatic ? `${scrollerHeight}px` : `${vh}px`;
            const ui = document.getElementById('ui');
            const titleUiGap = clamp(vh * TITLE_UI_GAP.preferredVh, TITLE_UI_GAP.min, TITLE_UI_GAP.max);
            const uiBottomReserve = mobileStatic ? staticBottomGap : UI_BOTTOM_RESERVE;
            const uiHeight = ui?.offsetHeight || 0;
            const uiMaxTop = Math.max(0, vh - uiHeight - uiBottomReserve);
            const titleMaxHeightByUi = Math.max(
                0,
                2 * (uiMaxTop - titleUiGap - (vh * POSTER.title.cy / 100))
            );
            if (!mobileStatic) {
                ui.style.zIndex = '25';
            }
            if (STATIC_FRAME) {
                document.getElementById('concept').style.display = 'none';
                document.documentElement.style.overflow = 'hidden';
            }

            // The wall overlay lives inside #stage (so it can sit above the ship) but has
            // to register pixel-for-pixel with #bg, which is a sibling. Same size, and its
            // offset is the background's box expressed in stage-local coordinates.
            el.walls.style.width = bgW + 'px';
            el.walls.style.height = bgH + 'px';
            el.walls.style.left = ((vw - bgW) / 2 - stageLeft) + 'px';
            el.walls.style.top = `${-staticTopInset}px`;

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
                let wA = clamp(vw * po.w / 100, po.min, po.max);
                // The title is wide and width-driven, so on a short viewport it grows tall
                // enough to collide with the CTA/date block below it. Cap its poster height
                // to a share of the viewport so both keep their own room.
                if (!isAssetIcon && hB > 0) {
                    const titleMaxHeight = titleMaxHeightByUi > 0
                        ? Math.min(vh * TITLE_MAX_VH, titleMaxHeightByUi)
                        : vh * TITLE_MAX_VH;
                    wA = Math.min(wA, titleMaxHeight * (wB / hB));
                }
                const posterCy = po.cy
                    + (isAssetIcon ? posterIconShiftY(vw) : 0)
                    + (!isAssetIcon && mobileStatic ? mobileHeaderClearanceShift(vw) : 0);
                assets[k] = {
                    dx: (vw * po.cx / 100) - (stageLeft + xB),
                    dy: (vh * posterCy / 100) - yB,
                    scale: wA / wB,
                    rotA: po.rot,
                    rotB: kv.rot,
                };
            });

            if (!mobileStatic && ui) {
                const titleAsset = assets.title;
                const titleNode = el.title;
                const titleHeight = titleNode.offsetHeight * titleAsset.scale;
                const titleBottom = (vh * POSTER.title.cy / 100) + titleHeight / 2;
                const uiMinTop = titleBottom + titleUiGap;
                const uiPreferredTop = Math.min(vh * 0.55, vh - 368);
                const uiTop = uiMaxTop >= uiMinTop
                    ? clamp(uiPreferredTop, uiMinTop, uiMaxTop)
                    : uiMaxTop;
                ui.style.top = `${uiTop}px`;
            }

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
                vw, vh, SW, SH, PAN, PANBG, bgW, bgH, stageLeft, assets, shipStartX, shipStartY,
                wallTravel, wallSealScale, wallCloseAt, staticTopInset, staticBottomGap,
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

            shipRunState.time = 0;
            shipRunTargetTime = 0;
            if (shipRunSyncRAF) cancelAnimationFrame(shipRunSyncRAF);
            shipRunSyncRAF = null;
            resetShipRunScrub();

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

            shipRunStaticScene = [
                el.ship,
                el.stairs,
                el.pshadow,
                ...el.runners,
            ];

            scrollTL = gsap.timeline({
                defaults: { ease: 'none' },
                paused: STATIC_FRAME,
                onUpdate: () => {
                    syncWalls();
                    syncShipLookToTimeline();
                    maintainCompletedHeroScene();
                    updateHeroRunProgress();
                },
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

            // The title's poster-frame padding-left (set in CSS, outside the transform
            // above) eases out to 0 on the same window as the title's own migration, so it
            // reads as one movement instead of the padding just vanishing at the KV slot.
            scrollTL.fromTo(el.title.querySelector('img'),
                { paddingLeft: 24 },
                { paddingLeft: 0, duration: 0.45, ease: 'power2.inOut' },
                0.10
            );

            // During the entrance the wall masks both the ship and UI, while the ship is
            // already above the UI. Once the ship clears the opening, both return above
            // the walls with the ship still in front. This preserves the physical reveal
            // and lets the visible hull continuously pass over the event information.
            scrollTL
                .set(el.ship, { zIndex: 10 }, 0)
                .set(el.walls, { zIndex: 20 }, 0)
                .set('#ui', { zIndex: 25 }, 0)
                .set('#ui', { zIndex: 5 }, 0.12)
                .set(el.ship, { zIndex: 30 }, 0.34)
                .set('#ui', { zIndex: 25 }, 0.34)
                // Once the ship clears the opening, retire the wall plane before any
                // asset changes depth relative to the ship. Leaving the walls at 20
                // until wallCloseAt made assets snap behind them at 0.34/0.41.
                .set(el.walls, { zIndex: 4 }, 0.34);

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
            syncShipLookToTimeline = () => {
                if (!scrollTL) return;
                const rawProgress = clamp((scrollTL.time() - 0.14) / 0.30, 0, 1);
                const easedProgress = 1 - Math.pow(1 - rawProgress, 2);
                shipFx.blur = SHIP_IN.blur * (1 - easedProgress);
                shipFx.brightness = SHIP_LIGHT.brightnessFrom
                    + (SHIP_LIGHT.brightnessTo - SHIP_LIGHT.brightnessFrom) * easedProgress;
                shipFx.saturation = SHIP_LIGHT.saturationFrom
                    + (SHIP_LIGHT.saturationTo - SHIP_LIGHT.saturationFrom) * easedProgress;
                shipFx.shadowAlpha = SHIP_LIGHT.shadowAlphaFrom
                    + (SHIP_LIGHT.shadowAlphaTo - SHIP_LIGHT.shadowAlphaFrom) * easedProgress;
                paintShip();
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
                // No fade: the ship (z-index 30, vs #ui's 25) physically covers this block as
                // it arrives. This just snaps it off once fully covered - imperceptible on
                // its own — so it can't reappear once the camera pans away from this spot.
                .set('#ui', { opacity: 0 }, 0.50);

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

            // Cover the viewport without distorting the source. Keep the composition
            // bottom-aligned so the stairs and runners retain their original position;
            // narrow viewports crop the excess equally from the left and right.
            const videoEnter = {};
            videoEnter.height = Math.max(M.vh, M.vw / SHIP_RUN.canvasRatio);
            videoEnter.width = videoEnter.height * SHIP_RUN.canvasRatio;
            videoEnter.left = (M.vw - videoEnter.width) / 2;

            // Map the existing continuation range directly onto the video duration. Both
            // sources stay paused; scroll position selects their matching color/alpha frame.
            if (!completedHeroTimelineBuilt) {
                scrollTL
                    .set(el.shipRunLayer, {
                        left: videoEnter.left,
                        top: 'auto',
                        bottom: 0,
                        width: videoEnter.width,
                        height: videoEnter.height,
                        opacity: 1,
                    }, SHIP_RUN.startAt)
                    .set(shipRunStaticScene, { opacity: 0 }, SHIP_RUN.startAt)
                    .fromTo(shipRunState, {
                        time: 0,
                    }, {
                        time: SHIP_RUN.duration,
                        duration: SHIP_RUN.scrollDuration,
                        ease: 'none',
                        onStart: startShipRunScrub,
                        onUpdate: syncShipRunToScroll,
                        onComplete: updateShipRunPlaybackProgress,
                        onReverseComplete: resetShipRunScrub,
                    }, SHIP_RUN.startAt);
            }

            syncWalls();
            if (STATIC_FRAME) {
                scrollTL.progress(clamp(parseFloat(FRAME) || 0, 0, 1)).pause();
            } else {
                const restoreTimelineFromCurrentScroll = () => {
                    const trigger = scrollTL.scrollTrigger;
                    if (window.scrollY >= el.concept.offsetTop - M.vh * 0.5) {
                        shipRunHasCompleted = true;
                        shipRunScrubState = 'complete';
                        shipRunHeroRestored = false;
                        gsap.set([el.shipRunLayer, el.shipRunWhiteout], { opacity: 0 });
                        el.concept.classList.add('is-awaiting-entry', 'is-revealed');
                        requestAnimationFrame(activateCompletedHeroTimeline);
                        updateHeroRunProgress();
                        return;
                    }

                    const scrollRange = Math.max(1, trigger.end - trigger.start);
                    let restoredProgress = clamp(
                        (window.scrollY - trigger.start) / scrollRange,
                        0,
                        1
                    );
                    let restoredTime = restoredProgress * scrollTL.duration();

                    ScrollTrigger.update();
                    trigger.getTween()?.progress(1);
                    scrollTL.progress(restoredProgress, false);
                    syncShipLookToTimeline();
                    if (!shipRunHasCompleted && restoredTime < SHIP_RUN.startAt) {
                        gsap.set([el.shipRunLayer, el.shipRunWhiteout], { opacity: 0 });
                    } else if (!shipRunHasCompleted) {
                        startShipRunScrub();
                        syncShipRunToScroll();
                    }
                    requestSiteScrollbarUpdate();
                    updateHeroRunProgress();
                };

                requestAnimationFrame(() => {
                    restoreTimelineFromCurrentScroll();
                    setTimeout(restoreTimelineFromCurrentScroll, 80);
                });
            }
        }

        function setupMobileStaticHero() {
            document.body.classList.add('is-mobile-static');
            if (scrollTL) {
                scrollTL.scrollTrigger?.kill();
                scrollTL.kill();
                scrollTL = null;
            }

            if (shipRunSyncRAF) cancelAnimationFrame(shipRunSyncRAF);
            shipRunSyncRAF = null;
            stopShipRunWatchdog();
            unlockShipRunScroll();
            el.shipRunVideo.pause();
            gsap.set([el.shipRunLayer, el.shipRunWhiteout], { opacity: 0 });
            gsap.set([el.bg, el.walls], { y: 0 });
            gsap.set(el.stage, { clearProps: 'transform' });
            el.stage.style.willChange = 'auto';
            gsap.set(el.walls, { zIndex: 4, x: 0, scaleX: 1 });
            gsap.set(el.ship, {
                clearProps: 'transform',
                opacity: 1,
                zIndex: 31,
                // Complex filters make iOS Safari cache the ship as a low-resolution GPU
                // texture before the large-viewport layout settles. Mobile does not run
                // the ship entrance, so keep the original bitmap unfiltered and sharp.
                filter: 'none',
            });
            gsap.set([el.stairs, el.pshadow, ...el.runners], {
                clearProps: 'transform',
                opacity: 1,
            });

            KEYS.forEach(k => {
                gsap.set(el[k], {
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotation: KV[k].rot,
                });
            });
            gsap.set(el.title.querySelector('img'), { paddingLeft: 0 });
            const ui = document.getElementById('ui');
            ui.style.zIndex = '120';
            const uiHeight = ui.offsetHeight || 220;
            const maxTop = Math.max(0, M.SH - uiHeight - M.staticBottomGap);
            const shortLandscape = M.vw > M.vh && M.vh <= 575;

            if (shortLandscape) {
                // In landscape the requested relationship is to the bottom of the KV stage,
                // not to the viewport. Bottom anchoring keeps that gap stable even when the
                // CTA, fonts or Safari viewport height finish loading at different times.
                ui.style.top = 'auto';
                ui.style.bottom = '32px';
            } else {
                ui.style.bottom = '';
                const minTop = Math.min(maxTop, M.SH * 0.48);
                ui.style.top = `${clamp(M.SH * mobileUiStaticTopRatio(M.vw), minTop, maxTop)}px`;
            }
            el.concept.classList.remove('is-awaiting-entry', 'is-revealed');
            updateHeroRunProgress();
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
                gsap.set(el.siteHeader, { clearProps: 'opacity,transform' });
                startIdle();
                requestSiteScrollbarUpdate();
            };

            // Reloading mid-page and accessibility/static modes skip decorative motion.
            if (window.scrollY > 10 || reduced || STATIC_FRAME) {
                finishImmediately();
                return;
            }

            // Base pace (at LOADING_SPEED 1) for one icon-cycle lap: entrance offset + a spacing
            // per icon + the last icon's fade-in + a short settle tail before the walls open.
            // Scales with LOADER_ORDER's length, so trimming icons shortens the loader on its own.
            const baseLoadingDuration = 0.16 + (LOADER_ORDER.length - 1) * 0.48 + 0.24 + 0.4;
            const loadingDuration = baseLoadingDuration / LOADING_SPEED;
            const exitAt = loadingDuration;
            const loaderIcons = ASSET_ICON_KEYS.map(k => el.loaderIcons[k]);
            const progress = { value: 0 };
            const assetScatterOrigins = {};
            const sceneRevealPause = 0.12;
            const assetScatterStartOffset = 0.10;
            const assetScatterStagger = 0.045;
            const assetScatterDuration = 1.12;
            const assetScatterEndOffset = assetScatterStartOffset
                + (ASSET_ICON_KEYS.length - 1) * assetScatterStagger
                + assetScatterDuration;
            const sceneRevealAt = exitAt + sceneRevealPause;
            const wallIntroStartOffset = 0.46;
            const wallIntroDuration = assetScatterEndOffset - wallIntroStartOffset + 0.08;

            gsap.set(el.siteHeader, { opacity: 0, y: -16 });
            gsap.set('.asset .inner', { opacity: 0 });
            gsap.set('#ui', { opacity: 0, y: 16 });
            gsap.set(loaderIcons, {
                left: M.vw / 2,
                top: M.vh / 2,
                xPercent: -50,
                yPercent: -50,
                x: 0,
                y: 0,
                scale: 0.78,
                rotation: 0,
                opacity: 0,
            });

            ASSET_ICON_KEYS.forEach(k => {
                const icon = el.loaderIcons[k];
                const target = el[k].getBoundingClientRect();
                const baseWidth = Math.max(1, Number.parseFloat(el[k].style.width));
                const parentScale = isMobileStatic() ? 1 : M.assets[k].scale;
                const renderedWidth = Math.max(1, baseWidth * parentScale);
                const parentRotation = isMobileStatic() ? KV[k].rot : M.assets[k].rotA;
                const angle = parentRotation * Math.PI / 180;
                const dx = M.vw / 2 - (target.left + target.width / 2);
                const dy = M.vh / 2 - (target.top + target.height / 2);

                // Convert the viewport-space offset back into the asset's local axes.
                // The real asset can then take over from the loader at the exact same
                // centre point while retaining its own z-index relative to the ship.
                assetScatterOrigins[k] = {
                    x: (Math.cos(angle) * dx + Math.sin(angle) * dy) / parentScale,
                    y: (-Math.sin(angle) * dx + Math.cos(angle) * dy) / parentScale,
                    scale: Math.max(1, icon.offsetWidth) / renderedWidth,
                    rotation: -parentRotation,
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
                    gsap.set(el.siteHeader, { clearProps: 'opacity,transform' });
                    ScrollTrigger.refresh();
                    startIdle();
                    requestSiteScrollbarUpdate();
                },
            });

            tl.fromTo(el.loaderProgressFill,
                { scaleX: 0 },
                { scaleX: 1, duration: loadingDuration - 0.12 / LOADING_SPEED, ease: 'none' }, 0.06 / LOADING_SPEED)
                .to(progress, {
                    value: 100,
                    duration: loadingDuration - 0.12 / LOADING_SPEED,
                    ease: 'none',
                    onUpdate: () => {
                        const value = Math.round(progress.value);
                        el.loaderProgressValue.textContent = `${String(value).padStart(2, '0')}%`;
                        el.loaderProgress.setAttribute('aria-valuenow', String(value));
                    },
                }, 0.06 / LOADING_SPEED);

            LOADER_ORDER.forEach((k, i) => {
                const icon = el.loaderIcons[k];
                const at = (0.16 + i * 0.48) / LOADING_SPEED;
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

            tl.to(el.loaderProgress, { opacity: 0, y: 8, duration: 0.22 / LOADING_SPEED }, exitAt - 0.12 / LOADING_SPEED);

            // Hand the centre icon over to the real hero assets before scattering. Using
            // the actual nodes here keeps every icon in its intended layer relative to the
            // ship; loader copies would all sit in the loader's topmost stacking context.
            ASSET_ICON_KEYS.forEach(k => {
                const isSeed = k === 'triangle';
                tl.set(el.loaderIcons[k], {
                    x: 0,
                    y: 0,
                    scale: isSeed ? 1 : 0.5,
                    rotation: 0,
                }, exitAt);
                tl.set(el[k + 'Inner'], {
                    ...assetScatterOrigins[k],
                    scale: assetScatterOrigins[k].scale * (isSeed ? 1 : 0.5),
                    opacity: 0,
                    transformOrigin: '50% 50%',
                    force3D: true,
                }, exitAt);
            });
            // Crossfade the loader's final triangle into the real hero node. Keeping
            // their combined opacity near one avoids the brief brightness pulse that
            // previously read as a hitch before the assets started moving.
            tl.to(loaderIcons, { opacity: 0, duration: 0.16, ease: 'none' }, exitAt + 0.02);
            tl.to(el.triangleInner, { opacity: 1, duration: 0.16, ease: 'none' }, exitAt + 0.02);

            // Freeze the mist on its current frame before the reveal. The canvas can
            // still fade visually without competing with the walls and assets for GPU time.
            tl.call(() => window.dispatchEvent(new Event('loader:mist-stop')), null, exitAt)
                .to(el.loaderSurface, { opacity: 0, duration: 0.78, ease: 'power2.out' }, sceneRevealAt)
                .to(el.wallIntroLeft, { scaleX: 1, duration: wallIntroDuration, ease: 'power3.inOut' }, sceneRevealAt + wallIntroStartOffset)
                .to(el.wallIntroRight, { scaleX: 1, duration: wallIntroDuration, ease: 'power3.inOut' }, sceneRevealAt + wallIntroStartOffset + 0.025)
                .fromTo(el.titleInner,
                    { opacity: 0, y: -20, scale: 0.96 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: 'power3.out' },
                    sceneRevealAt + 0.38
                )
                .to(el.siteHeader, { opacity: 1, y: 0, duration: 0.56 }, sceneRevealAt + 0.52)
                .to('#ui', { opacity: 1, y: 0, duration: 0.62 }, sceneRevealAt + 0.70);

            tl.set(el.loaderSurface, { display: 'none' }, sceneRevealAt + 0.78);

            ASSET_ICON_KEYS.forEach((k, i) => {
                const at = sceneRevealAt + assetScatterStartOffset + i * assetScatterStagger;

                tl.to(el[k + 'Inner'], {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotation: 0,
                    force3D: true,
                    duration: assetScatterDuration,
                    ease: 'power3.inOut',
                }, at);
            });

            tl.set('.asset .inner', { opacity: 1 }, sceneRevealAt + 1.62)
                .set(loaderIcons, { opacity: 0 }, sceneRevealAt + 1.62)
                .to(el.loader, { opacity: 0, duration: 0.18, ease: 'none' }, sceneRevealAt + 1.62);
        }

        /* ---------- idle float (on .floaty) ---------- */
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const saveData = navigator.connection?.saveData === true;
        let idleStarted = false;
        let idleTweens = [];
        let sceneIsVisible = true;
        let skyObserver = null;
        let conceptVideoMotion = null;

        function setupConceptVideoMotion() {
            if (conceptVideoMotion) {
                if (typeof conceptVideoMotion === 'function') {
                    conceptVideoMotion();
                } else {
                    conceptVideoMotion.scrollTrigger?.kill();
                    conceptVideoMotion.kill?.();
                }
                conceptVideoMotion = null;
            }

            if (STATIC_FRAME || reduced) {
                gsap.set(el.conceptVideoFrame, { rotateX: 0, scale: 1, y: 0 });
                return;
            }

            let frameRequested = false;

            const update = () => {
                frameRequested = false;

                const box = el.conceptVideoScroll.getBoundingClientRect();
                const startLine = M.vh * 0.92;
                const endLine = M.vh * 0.48;
                const progress = clamp((startLine - box.top) / Math.max(1, startLine - endLine), 0, 1);
                const isMobile = document.documentElement.clientWidth <= 768;
                const fromRotateX = isMobile ? 12 : 20;
                const fromScale = isMobile ? 0.94 : 0.90;
                const fromY = isMobile ? 56 : 96;

                gsap.set(el.conceptVideoFrame, {
                    rotateX: fromRotateX * (1 - progress),
                    scale: fromScale + (1 - fromScale) * progress,
                    y: fromY * (1 - progress),
                    force3D: true,
                });
            };

            const requestUpdate = () => {
                if (frameRequested) return;
                frameRequested = true;
                requestAnimationFrame(update);
            };

            update();
            window.addEventListener('scroll', requestUpdate, { passive: true });
            window.addEventListener('resize', requestUpdate);
            conceptVideoMotion = () => {
                window.removeEventListener('scroll', requestUpdate);
                window.removeEventListener('resize', requestUpdate);
                if (frameRequested) {
                    frameRequested = false;
                }
            };
        }

        function setupSkyMotion() {
            const video = el.skyVideo;
            if (!video || video.tagName !== 'VIDEO') {
                if (el.bg) el.bg.classList.add('is-video-ready');
                return;
            }
            const mediaMotionAllowed = !reduced && !saveData && !STATIC_FRAME;
            const markVideoReady = () => {
                el.bg.classList.add('is-video-ready');
            };

            const playVideo = () => {
                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.paused) {
                    markVideoReady();
                }

                const playPromise = video.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise
                        .then(markVideoReady)
                        .catch(() => el.bg.classList.remove('is-video-ready'));
                }
            };

            const syncSceneActivity = () => {
                const active = sceneIsVisible && !document.hidden;
                idleTweens.forEach(tween => tween.paused(!active));

                if (!mediaMotionAllowed) return;
                if (active) {
                    playVideo();
                } else {
                    video.pause();
                }
            };

            if (!mediaMotionAllowed) {
                video.pause();
                el.bg.classList.remove('is-video-ready');
            } else {
                video.playbackRate = 0.72;
                video.addEventListener('playing', markVideoReady);
                video.addEventListener('error', () => {
                    el.bg.classList.remove('is-video-ready');
                });

                playVideo();
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
            if (isMobileStatic()) {
                setupMobileStaticHero();
                playIntro();
                setupConceptVideoMotion();
                requestSiteScrollbarUpdate();
                updateHeroRunProgress();
                return;
            }

            document.body.classList.remove('is-mobile-static');
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
            setupConceptVideoMotion();
            requestSiteScrollbarUpdate();
            updateHeroRunProgress();

        }

        if (document.readyState === 'complete') boot();
        else window.addEventListener('load', boot);

        let rAF = null;
        let viewportWidth = document.documentElement.clientWidth;
        let viewportHeight = document.documentElement.clientHeight;
        window.addEventListener('resize', () => {
            const nextWidth = document.documentElement.clientWidth;
            const nextHeight = document.documentElement.clientHeight;
            if (nextWidth === viewportWidth && nextHeight === viewportHeight) return;
            const widthChanged = nextWidth !== viewportWidth;
            viewportWidth = nextWidth;
            viewportHeight = nextHeight;

            // Collapsing/expanding Safari chrome is a height-only resize. Rebuilding the
            // mobile scene here caused the ship, people and asset icons to grow mid-scroll.
            if (isMobileStatic() && !widthChanged) {
                requestSiteScrollbarUpdate();
                updateHeroRunProgress();
                return;
            }

            if (rAF) cancelAnimationFrame(rAF);
            rAF = requestAnimationFrame(() => {
                // A real width change (orientation or responsive breakpoint) gets a fresh
                // large-viewport baseline after Safari has applied the new orientation.
                if (widthChanged) mobileLayoutViewportHeight = readLargeViewportHeight();

                // Killing the pin can restore the height captured when ScrollTrigger was
                // created, so do it before layout writes the new static hero dimensions.
                if (isMobileStatic() && scrollTL) {
                    scrollTL.scrollTrigger?.kill();
                    scrollTL.kill();
                    scrollTL = null;
                }
                layout();
                if (isMobileStatic()) {
                    setupMobileStaticHero();
                } else {
                    document.body.classList.remove('is-mobile-static');
                    buildScroll();
                }
                setupConceptVideoMotion();
                ScrollTrigger.refresh();
                requestSiteScrollbarUpdate();
                updateHeroRunProgress();
            });
        });

        /* ---------- press K to diff against the original KV ---------- */
        document.addEventListener('keydown', e => {
            if (e.key.toLowerCase() !== 'k') return;
            const ref = document.getElementById('kvref');
            if (!ref.style.backgroundImage) ref.style.backgroundImage = "url('images/kv-ref.webp')";
            ref.style.opacity = ref.style.opacity === '1' ? '0' : '1';
        });
    

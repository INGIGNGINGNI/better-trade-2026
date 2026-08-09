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
            title: { cx: 50.0, cy: 35.0, w: 50.0, rot: 0, min: 300, max: 1000 },
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
        const TITLE_MAX_VH = 0.34;
        // The settled video sits 48px below the description. Its entrance translation
        // subtracts this same distance so adding layout space does not push the moving
        // frame farther away before it reaches the final position.
        const CONCEPT_VIDEO_GAP = 48;

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
            playbackRate: 1.6,
            whiteoutDuration: 0.42,
            conceptRevealDelay: 720,
            /* ship-new-3 is a 16:9 composition centred and bottom-aligned. */
            canvasRatio: 2560 / 1440,
            contentHeightShare: 0.7333,
            // The portrait asset this sequence was originally aligned to: its aspect and
            // content share are the reference the entry size is reproduced from.
            legacyCanvasRatio: 1248 / 1664,
            legacyContentHeightShare: 0.7344,
        };

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
        const mobileStaticQuery = window.matchMedia('(max-width: 991px)');
        const isMobileStatic = () => mobileStaticQuery.matches && !STATIC_FRAME;

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
            shipRunAlpha: document.getElementById('ship-run-alpha'),
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
            img.className = 'person';
            img.dataset.id = r.id;
            el.stage.appendChild(img);
            return img;
        });

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const canSeekShipRunAlpha = () => {
            const ranges = el.shipRunAlpha.seekable;
            return ranges.length > 0 && ranges.end(ranges.length - 1) > 0.05;
        };
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
                uniform sampler2D u_color;
                uniform sampler2D u_alpha;
                void main() {
                    vec3 color = texture2D(u_color, v_uv).rgb;
                    float alpha = texture2D(u_alpha, v_uv).r;
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
            const colorTexture = makeTexture(0, 'u_color');
            const alphaTexture = makeTexture(1, 'u_alpha');

            return () => {
                if (el.shipRunVideo.readyState < 2 || el.shipRunAlpha.readyState < 2) return;
                if (canSeekShipRunAlpha()
                    && Math.abs(el.shipRunVideo.currentTime - el.shipRunAlpha.currentTime) > 1 / SHIP_RUN.fps) {
                    if (!el.shipRunAlpha.seeking) {
                        el.shipRunAlpha.currentTime = clamp(
                            el.shipRunVideo.currentTime,
                            0,
                            Math.max(0, el.shipRunAlpha.duration - 0.001)
                        );
                    }
                    return;
                }
                if (el.shipRunAlpha.seeking) return;
                gl.viewport(0, 0, el.shipRunCanvas.width, el.shipRunCanvas.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, colorTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, el.shipRunVideo);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, alphaTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, el.shipRunAlpha);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            };
        }

        const drawShipRunFrame = createShipRunRenderer();
        function requestShipRunRender() {
            if (shipRunRenderRAF) return;
            shipRunRenderRAF = requestAnimationFrame(() => {
                shipRunRenderRAF = null;
                drawShipRunFrame();
                if (!el.shipRunVideo.paused || !el.shipRunAlpha.paused) requestShipRunRender();
            });
        }

        function alignShipRunAlpha() {
            if (el.shipRunVideo.readyState < 1 || el.shipRunAlpha.readyState < 1) return;
            const duration = Math.min(el.shipRunVideo.duration, el.shipRunAlpha.duration);
            const target = clamp(el.shipRunVideo.currentTime, 0, Math.max(0, duration - 0.001));
            if (canSeekShipRunAlpha()
                && Math.abs(el.shipRunAlpha.currentTime - target) > 1 / SHIP_RUN.fps
                && !el.shipRunAlpha.seeking) {
                el.shipRunAlpha.currentTime = target;
            }
            requestShipRunRender();
        }

        el.shipRunVideo.pause();
        el.shipRunAlpha.pause();
        [el.shipRunVideo, el.shipRunAlpha].forEach(video => {
            video.addEventListener('loadeddata', requestShipRunRender);
            video.addEventListener('seeked', requestShipRunRender);
        });
        el.shipRunVideo.addEventListener('seeked', alignShipRunAlpha);
        el.shipRunVideo.addEventListener('timeupdate', alignShipRunAlpha);
        el.shipRunAlpha.addEventListener('loadeddata', alignShipRunAlpha);
        el.shipRunVideo.addEventListener('loadedmetadata', () => {
            // A reload can restore the browser midway down the page. Prime the video
            // from the timeline state instead of flashing its first frame there.
            shipRunTargetTime = shipRunState.time;
            el.shipRunVideo.currentTime = clamp(
                shipRunTargetTime,
                0,
                Math.max(0, el.shipRunVideo.duration - 0.001)
            );
            if (el.shipRunAlpha.readyState >= 1 && canSeekShipRunAlpha()) {
                el.shipRunAlpha.currentTime = el.shipRunVideo.currentTime;
            }
        }, { once: true });
        el.shipRunAlpha.addEventListener('loadedmetadata', () => {
            if (canSeekShipRunAlpha()) {
                el.shipRunAlpha.currentTime = clamp(
                    el.shipRunVideo.readyState >= 1
                        ? el.shipRunVideo.currentTime
                        : shipRunTargetTime,
                    0,
                    Math.max(0, el.shipRunAlpha.duration - 0.001)
                );
            }
        }, { once: true });

        let shipRunAutoplayState = 'idle';
        let shipRunWhiteoutRAF = null;
        const blockedScrollKeys = new Set([
            'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ',
        ]);

        const blockShipRunScroll = event => {
            if (shipRunAutoplayState !== 'playing') return;
            if (event.type !== 'keydown' || blockedScrollKeys.has(event.key)) {
                event.preventDefault();
            }
        };
        window.addEventListener('wheel', blockShipRunScroll, { passive: false });
        window.addEventListener('touchmove', blockShipRunScroll, { passive: false });
        window.addEventListener('keydown', blockShipRunScroll, { passive: false });

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
            if (shipRunWhiteoutRAF) cancelAnimationFrame(shipRunWhiteoutRAF);
            shipRunWhiteoutRAF = null;
            shipRunAutoplayState = 'complete';
            shipRunHeroRestored = true;
            el.shipRunVideo.pause();
            el.shipRunAlpha.pause();
            if (el.shipRunVideo.readyState >= 1) el.shipRunVideo.currentTime = 0;
            if (el.shipRunAlpha.readyState >= 1) el.shipRunAlpha.currentTime = 0;
            gsap.killTweensOf(el.shipRunWhiteout);
            el.concept.classList.add('is-revealed');
            maintainCompletedHeroScene();
            requestShipRunRender();
        }

        function resetShipRunAutoplay() {
            if (shipRunHasCompleted) {
                restoreCompletedHeroScene();
                return;
            }
            if (shipRunWhiteoutRAF) cancelAnimationFrame(shipRunWhiteoutRAF);
            shipRunWhiteoutRAF = null;
            if (shipRunConceptRevealTimer) clearTimeout(shipRunConceptRevealTimer);
            shipRunConceptRevealTimer = null;
            shipRunAutoplayState = 'idle';
            el.shipRunVideo.pause();
            el.shipRunAlpha.pause();
            if (el.shipRunVideo.readyState >= 1) el.shipRunVideo.currentTime = 0;
            if (el.shipRunAlpha.readyState >= 1) el.shipRunAlpha.currentTime = 0;
            gsap.set(el.shipRunWhiteout, { opacity: 0 });
            gsap.set(el.shipRunLayer, { opacity: 0 });
            gsap.set(shipRunStaticScene, { opacity: 1 });
            el.concept.classList.remove('is-awaiting-entry', 'is-revealed');
            requestShipRunRender();
        }

        function completeShipRunAutoplay() {
            if (shipRunAutoplayState !== 'playing') return;
            shipRunAutoplayState = 'complete';
            shipRunHasCompleted = true;
            shipRunHeroRestored = false;
            if (shipRunWhiteoutRAF) cancelAnimationFrame(shipRunWhiteoutRAF);
            shipRunWhiteoutRAF = null;
            // shipRunHasCompleted already releases the gate; drop its idle watchdog too.
            if (shipRunGateWatchdog) clearTimeout(shipRunGateWatchdog);
            shipRunGateWatchdog = null;
            gsap.set(el.shipRunWhiteout, { opacity: 1 });

            requestAnimationFrame(() => {
                activateCompletedHeroTimeline();
                shipRunConceptRevealTimer = setTimeout(() => {
                    shipRunConceptRevealTimer = null;
                    el.concept.classList.add('is-revealed');
                }, SHIP_RUN.conceptRevealDelay);
            });
        }

        function monitorShipRunAutoplay() {
            if (shipRunAutoplayState !== 'playing') return;
            const duration = Number.isFinite(el.shipRunVideo.duration)
                ? el.shipRunVideo.duration
                : SHIP_RUN.duration;
            const whiteoutStart = duration - SHIP_RUN.whiteoutDuration;
            const whiteoutProgress = clamp(
                (el.shipRunVideo.currentTime - whiteoutStart) / SHIP_RUN.whiteoutDuration,
                0,
                1
            );
            gsap.set(el.shipRunWhiteout, { opacity: whiteoutProgress });

            if (el.shipRunVideo.ended || el.shipRunVideo.currentTime >= duration - 0.025) {
                completeShipRunAutoplay();
                return;
            }
            shipRunWhiteoutRAF = requestAnimationFrame(monitorShipRunAutoplay);
        }

        function startShipRunAutoplay() {
            if (STATIC_FRAME) return;
            if (shipRunHasCompleted) {
                restoreCompletedHeroScene();
                return;
            }
            if (shipRunAutoplayState !== 'idle') return;
            shipRunAutoplayState = 'playing';
            shipRunHeroRestored = false;
            el.concept.classList.add('is-awaiting-entry');
            el.concept.classList.remove('is-revealed');
            gsap.set(el.shipRunWhiteout, { opacity: 0 });
            gsap.set(el.shipRunLayer, { opacity: 1 });
            gsap.set(shipRunStaticScene, { opacity: 0 });

            el.shipRunVideo.pause();
            el.shipRunAlpha.pause();
            el.shipRunVideo.currentTime = 0;
            el.shipRunAlpha.currentTime = 0;
            el.shipRunVideo.playbackRate = SHIP_RUN.playbackRate;
            el.shipRunAlpha.playbackRate = SHIP_RUN.playbackRate;
            requestShipRunRender();

            Promise.all([
                el.shipRunAlpha.play(),
                el.shipRunVideo.play(),
            ]).then(() => {
                shipRunWhiteoutRAF = requestAnimationFrame(monitorShipRunAutoplay);
            }).catch(() => {
                // Playback is not happening, so the gate must stop holding the scroll.
                openShipRunGate();
                resetShipRunAutoplay();
            });
        }

        el.shipRunVideo.addEventListener('ended', completeShipRunAutoplay);
        window.addEventListener('scroll', () => {
            if (shipRunHasCompleted
                && !shipRunHeroRestored
                && window.scrollY < el.concept.offsetTop - 2) {
                restoreCompletedHeroScene();
            }
        }, { passive: true });

        /* Scroll position of the gate tween, i.e. where the run is meant to take over.
           The timeline maps linearly onto the trigger's scroll range, so a time converts
           straight into a scrollY. */
        function shipRunGateScrollY() {
            const trigger = scrollTL?.scrollTrigger;
            const duration = scrollTL?.duration();
            if (!trigger || !duration) return null;
            return trigger.start
                + (trigger.end - trigger.start) * (SHIP_RUN.startAt / duration);
        }

        /* The timeline is scrubbed with a 0.8s lag, so the gate's onStart — which starts
           the video — fires well after the scroll position crossed it. An uninterrupted
           scroll spends that window running past the pin end, releasing the pin straight
           into #concept and skipping the run entirely. blockShipRunScroll can't cover it:
           it only arms once playback is 'playing', by which point the scroll has already
           moved, and preventDefault cannot undo scrolling that happened.
           Clamping at the gate closes the window — the timeline catches up to startAt,
           onStart plays the video, and the page holds here until it completes.
           shipRunGateOpen is the escape hatch: if playback never gets going, the gate has
           to let go, or the page would sit at this scroll position for good. */
        let shipRunGateOpen = false;
        let shipRunGateWatchdog = null;

        function openShipRunGate() {
            shipRunGateOpen = true;
            if (shipRunGateWatchdog) clearTimeout(shipRunGateWatchdog);
            shipRunGateWatchdog = null;
        }

        window.addEventListener('scroll', () => {
            if (shipRunHasCompleted || shipRunGateOpen) return;
            const gateY = shipRunGateScrollY();
            if (gateY === null || window.scrollY <= gateY + 1) return;
            window.scrollTo(0, gateY);
            // Never hold the scroll hostage: if the run has not finished well after the
            // clip's own runtime, something stopped it and the page has to move on.
            if (!shipRunGateWatchdog) {
                shipRunGateWatchdog = setTimeout(
                    openShipRunGate,
                    (SHIP_RUN.duration / SHIP_RUN.playbackRate) * 1000 + 4000
                );
            }
        }, { passive: true });

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

        function revealSiteScrollbar() {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
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
            const vw = window.innerWidth, vh = window.innerHeight;

            // Mobile uses a wider, cropped KV canvas so the complete ship/stair composition
            // has enough vertical room to read as a long-form scene instead of a desktop
            // poster squeezed into one viewport.
            const SW = isMobileStatic()
                ? Math.min(vh * stageHeightVH(vw / vh) * KV_RATIO, vw * 1.8)
                : Math.min(vh * stageHeightVH(vw / vh) * KV_RATIO, vw * 0.98);
            const SH = SW / KV_RATIO;
            const stageLeft = (vw - SW) / 2;

            el.stage.style.cssText =
                `position:absolute;width:${SW}px;height:${SH}px;left:${stageLeft}px;top:0;will-change:transform;`;

            // How far the camera travels in beat 2.
            const PAN = Math.max(0, SH - vh) * 0.98;

            // Background keeps the KV proportion but must cover the viewport in BOTH
            // axes — on a tall/narrow screen, matching width alone leaves a gap below.
            const mobileBackgroundHeight = SH + 144;
            const bgW = isMobileStatic()
                ? Math.max(vw, SW, mobileBackgroundHeight * KV_RATIO)
                : Math.max(vw, SW, vh * KV_RATIO);
            const bgH = isMobileStatic() ? mobileBackgroundHeight : bgW / KV_RATIO;
            el.bg.style.width = bgW + 'px';
            el.bg.style.height = bgH + 'px';
            el.bg.style.left = ((vw - bgW) / 2) + 'px';
            el.bg.style.top = '0px';
            const PANBG = Math.min(PAN * (bgH / SH), Math.max(0, bgH - vh));

            // Scroll length = the pinned view + beat 1 + however far beat 2 actually moves,
            // so a short camera move never leaves dead scroll behind it.
            const scrollerHeight = isMobileStatic()
                ? bgH
                : vh + vh * 4.1 + PAN * 1.4;
            const heroScrollDistance = Math.max(1, scrollerHeight - vh);
            document.getElementById('scroller').style.height = STATIC_FRAME ? vh + 'px' : scrollerHeight + 'px';
            el.stagewrap.style.height = isMobileStatic() ? `${scrollerHeight}px` : `${vh}px`;
            if (!isMobileStatic()) {
                const uiTop = Math.min(vh * 0.59, vh - 324);
                document.getElementById('ui').style.top = `${uiTop}px`;
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
                let wA = clamp(vw * po.w / 100, po.min, po.max);
                // The title is wide and width-driven, so on a short viewport it grows tall
                // enough to collide with the CTA/date block below it. Cap its poster height
                // to a share of the viewport so both keep their own room.
                if (!isAssetIcon && hB > 0) {
                    wA = Math.min(wA, vh * TITLE_MAX_VH * (wB / hB));
                }
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
                vw, vh, SW, SH, PAN, PANBG, bgW, bgH, stageLeft, assets, shipStartX, shipStartY,
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

            shipRunState.time = 0;
            shipRunTargetTime = 0;
            if (shipRunSyncRAF) cancelAnimationFrame(shipRunSyncRAF);
            shipRunSyncRAF = null;
            resetShipRunAutoplay();

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

            const shipRunGate = { progress: 0 };

            // Cover the viewport without distorting the source. Keep the composition
            // bottom-aligned so the stairs and runners retain their original position;
            // narrow viewports crop the excess equally from the left and right.
            const videoEnter = {};
            videoEnter.height = Math.max(M.vh, M.vw / SHIP_RUN.canvasRatio);
            videoEnter.width = videoEnter.height * SHIP_RUN.canvasRatio;
            videoEnter.left = (M.vw - videoEnter.width) / 2;

            // A single scroll across the gate starts native playback. The dummy tween
            // preserves the existing trigger position without tying frames to scroll.
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
                    .to(shipRunGate, {
                        progress: 1,
                        duration: SHIP_RUN.scrollDuration,
                        ease: 'none',
                        onStart: startShipRunAutoplay,
                        onReverseComplete: resetShipRunAutoplay,
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
                        shipRunAutoplayState = 'complete';
                        shipRunHeroRestored = false;
                        gsap.set([el.shipRunLayer, el.shipRunWhiteout], { opacity: 0 });
                        el.concept.classList.add('is-awaiting-entry', 'is-revealed');
                        requestAnimationFrame(activateCompletedHeroTimeline);
                        return;
                    }

                    const scrollRange = Math.max(1, trigger.end - trigger.start);
                    let restoredProgress = clamp(
                        (window.scrollY - trigger.start) / scrollRange,
                        0,
                        1
                    );
                    let restoredTime = restoredProgress * scrollTL.duration();

                    // A reload cannot resume native media playback reliably. Land on the
                    // complete static Hero frame and let the next downward gesture trigger
                    // the video from its real first frame instead.
                    if (!shipRunHasCompleted
                        && window.scrollY > 10
                        && restoredTime >= SHIP_RUN.startAt) {
                        restoredTime = SHIP_RUN.startAt - 0.002;
                        restoredProgress = restoredTime / scrollTL.duration();
                        window.scrollTo(0, trigger.start + scrollRange * restoredProgress);
                    }

                    ScrollTrigger.update();
                    trigger.getTween()?.progress(1);
                    scrollTL.progress(restoredProgress, false);
                    syncShipLookToTimeline();
                    if (!shipRunHasCompleted) {
                        gsap.set([el.shipRunLayer, el.shipRunWhiteout], { opacity: 0 });
                    }
                    requestSiteScrollbarUpdate();
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
            if (shipRunWhiteoutRAF) cancelAnimationFrame(shipRunWhiteoutRAF);
            shipRunSyncRAF = null;
            shipRunWhiteoutRAF = null;
            el.shipRunVideo.pause();
            el.shipRunAlpha.pause();
            gsap.set([el.shipRunLayer, el.shipRunWhiteout], { opacity: 0 });
            gsap.set([el.bg, el.walls], { y: 0 });
            gsap.set(el.stage, { clearProps: 'transform' });
            el.stage.style.willChange = 'auto';
            gsap.set(el.walls, { zIndex: 4, x: 0, scaleX: 1 });
            gsap.set(el.ship, {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                zIndex: 75,
                filter: `blur(0px) brightness(${SHIP_LIGHT.brightnessTo}) saturate(${SHIP_LIGHT.saturationTo}) drop-shadow(0 14px 20px rgba(42, 62, 102, ${SHIP_LIGHT.shadowAlphaTo}))`,
            });
            gsap.set([el.stairs, el.pshadow, ...el.runners], {
                x: 0,
                y: 0,
                scale: 1,
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
            document.getElementById('ui').style.top = `${M.SH * 0.83}px`;
            el.concept.classList.remove('is-awaiting-entry', 'is-revealed');
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
            const iconTargets = {};
            const assetScatterStartOffset = 0.10;
            const assetScatterStagger = 0.045;
            const assetScatterDuration = 1.06;
            const assetScatterEndOffset = assetScatterStartOffset
                + (ASSET_ICON_KEYS.length - 1) * assetScatterStagger
                + assetScatterDuration;
            const wallIntroStartOffset = 0.42;
            const wallIntroDuration = assetScatterEndOffset - wallIntroStartOffset;

            gsap.set(el.siteHeader, { opacity: 0, y: -16 });
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

            ASSET_ICON_KEYS.forEach(k => {
                const icon = el.loaderIcons[k];
                const target = el[k].getBoundingClientRect();
                const initialWidth = Math.max(1, icon.offsetWidth);
                const posterWidth = parseFloat(el[k].style.width)
                    * (isMobileStatic() ? 1 : M.assets[k].scale);
                iconTargets[k] = {
                    x: target.left + target.width / 2 - M.vw / 2,
                    y: target.top + target.height / 2 - M.vh / 2,
                    scale: posterWidth / initialWidth,
                    rotation: isMobileStatic() ? KV[k].rot : M.assets[k].rotA,
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

            // Only the triangle — the icon the spinner already settled on — stays visible at
            // center. The other five stay hidden there, ready to appear the instant each one
            // peels off toward its own poster slot, so it reads as one icon splitting into six.
            ASSET_ICON_KEYS.forEach(k => {
                const isSeed = k === 'triangle';
                tl.set(el.loaderIcons[k], {
                    opacity: isSeed ? 1 : 0,
                    x: 0,
                    y: 0,
                    scale: isSeed ? 1 : 0.5,
                    rotation: 0,
                }, exitAt);
            });

            tl.to(el.loaderSurface, { opacity: 0, duration: 0.72, ease: 'power2.out' }, exitAt)
                .to(el.wallIntroLeft, { scaleX: 1, duration: wallIntroDuration, ease: 'power3.inOut' }, exitAt + wallIntroStartOffset)
                .to(el.wallIntroRight, { scaleX: 1, duration: wallIntroDuration, ease: 'power3.inOut' }, exitAt + wallIntroStartOffset)
                .fromTo(el.titleInner,
                    { opacity: 0, y: -20, scale: 0.96 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: 'power3.out' },
                    exitAt + 0.34
                )
                .to(el.siteHeader, { opacity: 1, y: 0, duration: 0.56 }, exitAt + 0.48)
                .to('#ui', { opacity: 1, y: 0, duration: 0.62 }, exitAt + 0.64);

            ASSET_ICON_KEYS.forEach((k, i) => {
                const icon = el.loaderIcons[k];
                const target = iconTargets[k];
                const at = exitAt + assetScatterStartOffset + i * assetScatterStagger;

                tl.set(icon, { zIndex: 20 + i }, at)
                    .to(icon, {
                        opacity: 1,
                        x: target.x,
                        y: target.y,
                        scale: target.scale,
                        rotation: target.rotation,
                        duration: assetScatterDuration,
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
        let conceptVideoMotion = null;

        function setupConceptVideoMotion() {
            if (conceptVideoMotion) {
                conceptVideoMotion.scrollTrigger?.kill();
                conceptVideoMotion.kill();
                conceptVideoMotion = null;
            }

            if (STATIC_FRAME || reduced || isMobileStatic()) {
                gsap.set(el.conceptVideoFrame, { rotateX: 0, scale: 1, y: 0 });
                return;
            }

            conceptVideoMotion = gsap.timeline({
                scrollTrigger: {
                    trigger: el.conceptVideoScroll,
                    start: 'top 92%',
                    end: 'top 18%',
                    scrub: 0.8,
                    invalidateOnRefresh: true,
                }
            }).fromTo(el.conceptVideoFrame, {
                rotateX: () => window.innerWidth <= 768 ? 12 : 20,
                scale: () => window.innerWidth <= 768 ? 0.94 : 0.90,
                y: () => (window.innerWidth <= 768 ? 32 : 24) - CONCEPT_VIDEO_GAP,
                force3D: true,
            }, {
                rotateX: 0,
                scale: 1,
                y: 0,
                duration: 1,
                ease: 'none',
                force3D: true,
            });
        }

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
            if (!ASSET_IDLE_ENABLED || idleStarted || reduced || STATIC_FRAME || isMobileStatic()) return;
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
                if (isMobileStatic()) {
                    setupMobileStaticHero();
                } else {
                    document.body.classList.remove('is-mobile-static');
                    buildScroll();
                }
                setupConceptVideoMotion();
                ScrollTrigger.refresh();
                requestSiteScrollbarUpdate();
            });
        });

        /* ---------- press K to diff against the original KV ---------- */
        document.addEventListener('keydown', e => {
            if (e.key.toLowerCase() !== 'k') return;
            const ref = document.getElementById('kvref');
            if (!ref.style.backgroundImage) ref.style.backgroundImage = "url('images/kv-ref.webp')";
            ref.style.opacity = ref.style.opacity === '1' ? '0' : '1';
        });
    

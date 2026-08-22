/* พื้นหลังหมอกของหน้าจอ loader
   พอร์ตมาจาก React WebGL shader demo ตัวหนึ่ง (fragment shader ล้วน ไม่ผูกกับ React)
   มาเป็น canvas ธรรมดา ตัดส่วน mouse glow ออกทั้งหมดตามที่ขอ ไม่มีการอ่านตำแหน่งเมาส์เลย */
(() => {
    const canvas = document.querySelector('#loader .loader-surface');
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const readNumber = (name, fallback, min, max) => {
        const raw = Number.parseFloat(canvas.dataset[name]);
        return Number.isFinite(raw) ? clamp(raw, min, max) : fallback;
    };
    const hexToRgb = (hex, fallback) => {
        const normalized = String(hex || '').trim().replace(/^#/, '');
        const value = normalized.length === 3
            ? normalized.split('').map(char => char + char).join('')
            : normalized;

        if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;

        return [
            Number.parseInt(value.slice(0, 2), 16) / 255,
            Number.parseInt(value.slice(2, 4), 16) / 255,
            Number.parseInt(value.slice(4, 6), 16) / 255,
        ];
    };

    const config = {
        speed: readNumber('mistSpeed', 1, 0, 3),
        density: readNumber('mistDensity', 1.25, 0.4, 2.4),
        brightness: readNumber('mistBrightness', 1.4, 0.6, 2.2),
        contrast: readNumber('mistContrast', 1.1, 0.7, 1.8),
        base: hexToRgb(canvas.dataset.mistBase, [0.03, 0.03, 0.05]),
        fog: hexToRgb(canvas.dataset.mistFog, [0.18, 0.20, 0.25]),
        accent: hexToRgb(canvas.dataset.mistAccent, [0.3, 0.35, 0.45]),
    };

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_speed;
        uniform float u_density;
        uniform float u_brightness;
        uniform float u_contrast;
        uniform vec3 u_base_color;
        uniform vec3 u_mist_color;
        uniform vec3 u_accent_color;

        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            uv.x *= u_resolution.x / u_resolution.y;

            vec2 q = vec2(0.0);
            q.x = fbm(uv + 0.07 * u_time * u_speed);
            q.y = fbm(uv + vec2(1.0, 1.0));

            vec2 r = vec2(0.0);
            r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time * u_speed);
            r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time * u_speed);

            float f = fbm(uv + r);
            float mist = smoothstep(0.12, 0.86, f * u_density);
            float accent = clamp(dot(q, r) * 0.5 * u_density, 0.0, 1.0);

            vec3 color = mix(u_base_color, u_mist_color, mist);
            color = mix(color, u_accent_color, accent);

            color = pow(color, vec3(u_contrast)) * u_brightness;
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const speedLoc = gl.getUniformLocation(program, 'u_speed');
    const densityLoc = gl.getUniformLocation(program, 'u_density');
    const brightnessLoc = gl.getUniformLocation(program, 'u_brightness');
    const contrastLoc = gl.getUniformLocation(program, 'u_contrast');
    const baseColorLoc = gl.getUniformLocation(program, 'u_base_color');
    const mistColorLoc = gl.getUniformLocation(program, 'u_mist_color');
    const accentColorLoc = gl.getUniformLocation(program, 'u_accent_color');

    let isRunning = true;
    const stopRendering = () => {
        isRunning = false;
    };

    window.addEventListener('loader:mist-stop', stopRendering, { once: true });

    const render = (time) => {
        /* loader ถูก .remove() ออกจาก DOM ทันทีที่ intro จบ (ดู hero-v2-scroll-motion.js)
           ต้องเช็ค isConnected ทุกเฟรมไม่งั้น rAF จะวนค้างไปเรื่อย ๆ ทั้งที่ canvas หลุดจากหน้าไปแล้ว */
        if (!isRunning || !canvas.isConnected) return;

        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.uniform1f(timeLoc, time * 0.001);
        gl.uniform2f(resLoc, canvas.width, canvas.height);
        gl.uniform1f(speedLoc, config.speed);
        gl.uniform1f(densityLoc, config.density);
        gl.uniform1f(brightnessLoc, config.brightness);
        gl.uniform1f(contrastLoc, config.contrast);
        gl.uniform3f(baseColorLoc, config.base[0], config.base[1], config.base[2]);
        gl.uniform3f(mistColorLoc, config.fog[0], config.fog[1], config.fog[2]);
        gl.uniform3f(accentColorLoc, config.accent[0], config.accent[1], config.accent[2]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
})();

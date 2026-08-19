/* พื้นหลังหมอกของหน้าจอ loader
   พอร์ตมาจาก React WebGL shader demo ตัวหนึ่ง (fragment shader ล้วน ไม่ผูกกับ React)
   มาเป็น canvas ธรรมดา ตัดส่วน mouse glow ออกทั้งหมดตามที่ขอ ไม่มีการอ่านตำแหน่งเมาส์เลย */
(() => {
    const canvas = document.querySelector('#loader .loader-surface');
    if (!(canvas instanceof HTMLCanvasElement)) return;

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
            q.x = fbm(uv + 0.07 * u_time);
            q.y = fbm(uv + vec2(1.0, 1.0));

            vec2 r = vec2(0.0);
            r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
            r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

            float f = fbm(uv + r);

            vec3 baseColor = vec3(0.03, 0.03, 0.05);
            vec3 mistColor = vec3(0.18, 0.20, 0.25);
            vec3 accentColor = vec3(0.3, 0.35, 0.45);

            vec3 color = mix(baseColor, mistColor, f);
            color = mix(color, accentColor, dot(q, r) * 0.5);

            color = pow(color, vec3(1.1)) * 1.4;
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

    const render = (time) => {
        /* loader ถูก .remove() ออกจาก DOM ทันทีที่ intro จบ (ดู hero-v2-scroll-motion.js)
           ต้องเช็ค isConnected ทุกเฟรมไม่งั้น rAF จะวนค้างไปเรื่อย ๆ ทั้งที่ canvas หลุดจากหน้าไปแล้ว */
        if (!canvas.isConnected) return;

        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.uniform1f(timeLoc, time * 0.001);
        gl.uniform2f(resLoc, canvas.width, canvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
})();

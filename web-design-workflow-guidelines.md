# Web Design Workflow Guidelines

เอกสารนี้ใช้เป็นกรอบการทำงานสำหรับออกแบบและพัฒนาเว็บไซต์หรือ component ให้มีโครงสร้างไฟล์, naming, UI system, motion และ asset management ที่สม่ำเสมอทั้งโปรเจกต์

## 1. Project Structure

ทุกหน้าเว็บต้องมีไฟล์หลักเป็น `.html` และแยก asset ออกจากกันตามประเภทไฟล์เสมอ

```text
project-root/
  index.html
  about.html
  css/
    main.css
    style.css
  js/
    navigation-menu.js
    hero-motion.js
    form-validation.js
  images/
    hero-banner.webp
    product-card.webp
  video/
    hero-background.mp4
  fonts/
    brand-font.woff2
  vendor/
    bootstrap/
      css/
        bootstrap.min.css
      js/
        bootstrap.bundle.min.js
```

ข้อกำหนด:

- ห้ามเขียน `<style>` หรือ `<script>` ภายในไฟล์ `.html`
- ทุก style ต้องอยู่ในไฟล์ `.css`
- ทุก JavaScript ต้องอยู่ในไฟล์ `.js`
- ไฟล์ third-party ทั้งหมดต้องอยู่ใน `/vendor`
- รูปภาพทั้งหมดต้องอยู่ใน `/images`
- วิดีโอทั้งหมดต้องอยู่ใน `/video`
- ฟอนต์ทั้งหมดต้องอยู่ใน `/fonts`

## 2. File Naming

ตั้งชื่อไฟล์ให้สื่อสารหน้าที่ของไฟล์นั้นอย่างชัดเจน และใช้ `-` แทน `_` เสมอ

ตัวอย่างที่ถูกต้อง:

```text
hero-banner.webp
section-intro.css
hero-motion.js
product-card-hover.mp4
```

ตัวอย่างที่ห้ามใช้:

```text
hero_banner.webp
sectionIntro.css
new-file-final-v2.png
```

หลักการตั้งชื่อ:

- ใช้ตัวพิมพ์เล็กทั้งหมด
- ใช้คำที่อธิบายเนื้อหา ไม่ใช้ชื่อกว้างเกินไป เช่น `image-1.webp`
- ถ้าเป็น asset เฉพาะ section ให้ใส่ชื่อ section นำหน้า เช่น `hero-background.webp`
- ถ้าเป็น state หรือ variation ให้ใส่ต่อท้าย เช่น `button-primary-hover.webp`

## 3. Bootstrap 5

ใช้ Bootstrap 5 เวอร์ชันล่าสุดที่ผ่านการตรวจสอบแล้วในวันที่เริ่มโปรเจกต์หรือวันที่อัปเดต dependency

ข้อกำหนด:

- ห้ามโหลด Bootstrap ผ่าน CDN เด็ดขาด
- ต้องดาวน์โหลด Bootstrap มาเก็บไว้ใน `/vendor/bootstrap`
- ใช้ `bootstrap.min.css` และ `bootstrap.bundle.min.js` จาก local file เท่านั้น
- ถ้ามีการอัปเดต Bootstrap ต้องตรวจสอบ breaking changes และ component ที่ได้รับผลกระทบก่อน commit งาน

ตัวอย่างการ link:

```html
<link rel="stylesheet" href="vendor/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/style.css">

<script src="vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="js/navigation-menu.js"></script>
```

## 4. CSS Files

ใช้ไฟล์ CSS หลัก 2 ไฟล์เสมอ

```text
css/
  main.css
  style.css
```

หน้าที่ของแต่ละไฟล์:

- `main.css` เป็นไฟล์กลางสำหรับเก็บ `:root` variables ทั้งหมดของโปรเจกต์, design tokens, reusable values, font face, base reset, utility และ reusable component/class ที่ใช้ซ้ำได้ เช่น button, card, title, box, badge, form control
- `style.css` เก็บ CSS class ของ section ต่างๆ ในไฟล์ HTML เท่านั้น โดยแต่ละ class ใช้เฉพาะ section ของตัวเอง ไม่มีการ reuse ข้าม section และห้ามประกาศ `:root` variables ในไฟล์นี้

ข้อกำหนด:

- CSS ต้องเขียนแบบ nested เท่านั้น
- ห้ามเขียนค่า magic number ตรงๆ ใน class
- ทุกค่าที่ใช้ซ้ำ เช่น font size, spacing, color, border radius, transition, container size ต้องดึงจากตัวแปรใน `main.css`
- ถ้าต้องเพิ่มค่าใหม่ ให้เพิ่มเป็น token ใน `:root` ของ `main.css` ก่อนใช้งาน
- `:root` variables ต้องรวมไว้ใน `main.css` เพียงไฟล์เดียว ห้ามกระจาย `:root` ไปไว้ใน `style.css` หรือไฟล์ CSS อื่น
- ค่าตัวแปรใน `:root` ที่เป็นตัวเลขเชิงขนาดหรือระยะ เช่น font size, spacing, sizing, border radius, border width, container width ต้องใช้หน่วย `px` เท่านั้น
- ห้ามใช้ `rem`, `em`, `vh`, `vw`, `%` หรือหน่วยอื่นกับตัวแปรตัวเลขเชิงขนาดหรือระยะใน `:root`
- token ที่ไม่ใช่ค่าขนาด เช่น duration ให้ใช้หน่วยที่ถูกต้องตามหน้าที่ของค่านั้น เช่น `ms` สำหรับเวลา และ easing ให้ใช้ `cubic-bezier(...)`
- reusable component/class ต้องเขียนไว้ใน `main.css` เท่านั้น
- section-specific class ต้องเขียนไว้ใน `style.css` เท่านั้น และห้ามนำไป reuse ข้าม section

### Design Token Architecture

จัด token ใน `:root` เป็นชั้นเสมอ เพื่อให้สามารถนำระบบกลางไปใช้กับโปรเจกต์อื่นได้ง่าย และลดการผูกค่ากับหน้าใดหน้าหนึ่ง

ลำดับชั้น token:

1. `Primitive Tokens` คือค่าดิบกลาง เช่น สี, spacing, radius, font size, shadow, motion ห้ามตั้งชื่อผูกกับ section หรือ campaign
2. `Semantic Tokens` คือค่าที่บอกหน้าที่การใช้งาน เช่น text, surface, border, accent โดยอ้างกลับไปยัง primitive
3. `System Tokens` คือ token สำหรับระบบ UI ที่ reuse ได้ เช่น section typography, layout, component size, rule, card, button
4. `Project Alias Tokens` คือ token เฉพาะโปรเจกต์ เช่น `--bt-*` เพื่อให้ CSS เดิมหรือ brand-specific UI ใช้งานได้ โดยต้องอ้างกลับไปยัง token ชั้นก่อนหน้าให้มากที่สุด

หลัก naming:

- Primitive ใช้ชื่อกลาง เช่น `--color-neutral-900`, `--space-12`, `--radius-2`, `--font-size-16`
- Semantic ใช้ชื่อจากหน้าที่ เช่น `--color-text-primary`, `--color-surface-page`, `--color-border-subtle`
- สีที่ใช้แทนสถานะหรือหมวดเนื้อหา ต้องอยู่ใน Semantic เช่น `--color-state-success`, `--color-access-conference`, `--color-topic-capital`
- System ใช้ชื่อระดับระบบ เช่น `--section-title-size`, `--button-height-md`, `--card-radius`
- Project alias ใช้ prefix โปรเจกต์หรือ section เช่น `--bt-ticket-conference`, `--bt-agenda-time-width`, `--bt-footer-panel-bg`
- ห้ามตั้งชื่อ token ตามตำแหน่งเฉพาะหน้า เช่น `--ticket-card-left-gap` ใน `:root` ยกเว้นเป็น project alias ที่จำเป็นจริง

ตัวอย่าง `main.css`:

```css
:root {
  /* Primitive Tokens */
  --color-neutral-0: #ffffff;
  --color-neutral-900: #111318;
  --space-4: 16px;
  --space-6: 24px;
  --space-12: 48px;
  --radius-2: 8px;
  --font-size-16: 16px;
  --font-size-24: 24px;
  --duration-base: 240ms;
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);

  /* Semantic Tokens */
  --color-text-primary: var(--color-neutral-900);
  --color-surface-page: var(--color-neutral-0);
  --color-state-success: var(--color-green-600);
  --color-topic-capital: var(--color-state-success);

  /* System Tokens */
  --section-title-size: var(--font-size-24);
  --button-height-md: var(--space-12);
  --card-radius: var(--radius-2);

  /* Project Alias Tokens */
  --bt-color-ink: var(--color-text-primary);
  --bt-ticket-title-size: var(--section-title-size);
}

.button {
  min-height: var(--button-height-md);
  padding-inline: var(--space-4);
  border-radius: var(--card-radius);
  font-size: var(--font-size-16);
}
```

ตัวอย่าง `style.css`:

```css
.hero-section {
  padding-block: var(--space-32);

  .hero-section__title {
    font-size: var(--font-size-24);
    margin-bottom: var(--space-16);
  }
}
```

## 5. 8-Point System

ใช้ระบบ 8 เป็นฐานสำหรับ spacing, sizing, border radius, gap, padding, margin และ layout measurement

ค่าที่ใช้ได้:

```text
0, 4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 96, 120
```

ข้อกำหนด:

- ค่า spacing หลักต้องเป็นจำนวนที่หารด้วย 8 ลงตัว
- ใช้ `4px` ได้เฉพาะ micro spacing เช่น icon alignment หรือ border optical adjustment
- ห้ามใช้ค่ากระจัดกระจาย เช่น `13px`, `19px`, `27px`
- ทุกค่าต้องอ้างอิงผ่าน CSS variable เช่น `var(--space-24)` ห้ามเขียน `24px` ตรงๆ ใน class
- ตัวแปรตัวเลขใน `:root` ต้องประกาศเป็น `px` เช่น `--space-24: 24px;` และนำไปใช้ผ่าน `var(--space-24)`

## 6. Container System

container หลักให้อ้างอิงขนาดจาก Bootstrap 5 เป็นค่าเริ่มต้น

ใช้ `.container`, `.container-sm`, `.container-md`, `.container-lg`, `.container-xl`, `.container-xxl` ตาม breakpoint ของ Bootstrap 5

การสร้าง section ใหม่ต้องใช้ layout system ของ Bootstrap เป็นโครงหลักเสมอ เช่น `.container`, `.row`, `.col-*` และ gutter ของ Bootstrap เพื่อให้ layout สม่ำเสมอทั้งโปรเจกต์

ข้อกำหนดสำหรับ section ใหม่:

- ต้องมี Bootstrap container ครอบ content หลัก ยกเว้นกรณีเป็น full-width visual ที่ได้รับอนุมัติเป็นข้อยกเว้น
- ต้องใช้ `.row` และ `.col-*` เมื่อต้องจัด column หรือ responsive layout
- ต้องใช้ gutter ของ Bootstrap เป็นค่าเริ่มต้น และห้ามกำหนด gutter เองโดยไม่มีเหตุผลด้าน layout ชัดเจน
- ห้ามกำหนด `max-width` เองแทน Bootstrap container นอกจากมี requirement เฉพาะและระบุเป็นข้อยกเว้น
- ทุกการเพิ่มหรือแก้ไข layout ต้องออกแบบ responsive ตั้งแต่แรก และต้องกำหนด behavior สำหรับ breakpoint สำคัญ เช่น desktop, tablet และ mobile

สามารถ custom container ได้เฉพาะกรณีที่ layout มีปัญหาจาก container หลัก เช่น:

- art direction ของ hero ต้องกว้างกว่าขนาด Bootstrap
- dashboard หรือ data layout ต้องใช้พื้นที่เต็มจอ
- section มี visual background ที่ต้อง full width แต่ content ยังต้อง constrained

หลักการ custom:

- ตั้งชื่อ class ให้เฉพาะเจาะจงกับ section
- ไม่ override `.container` ตรงๆ
- ใช้ token จาก `main.css` ทุกครั้ง

ตัวอย่าง:

```css
.hero-section {
  .hero-section__container {
    width: min(100% - var(--space-32), var(--container-hero-max));
    margin-inline: auto;
  }
}
```

## 7. Section-Scoped CSS

class และ CSS ต้องแยกเฉพาะ section ของตัวเอง ห้ามใช้ข้าม section เพื่อให้ง่ายต่อการแก้ไขและลด side effects

รูปแบบแนะนำ:

```text
section-name
section-name__element
section-name__element--modifier
```

ตัวอย่าง:

```html
<section class="hero-section">
  <div class="hero-section__container">
    <h1 class="hero-section__title">Better Trade 2026</h1>
  </div>
</section>
```

```css
.hero-section {
  .hero-section__container {
    padding-inline: var(--space-16);
  }

  .hero-section__title {
    font-size: var(--font-size-24);
  }
}
```

ข้อห้าม:

- ห้ามใช้ class กลางแบบไม่จำเป็น เช่น `.title`, `.box`, `.content`, `.image`
- ห้ามนำ class ของ section หนึ่งไปใช้ในอีก section
- ห้ามแก้ style ด้วย selector กว้าง เช่น `section h2`, `.container img`, `div > p`

## 8. JavaScript Structure

หนึ่งไฟล์ JavaScript ต้องรับผิดชอบเพียงหนึ่งงาน หรือกลุ่มงานที่เกี่ยวข้องกันโดยตรงเท่านั้น

ตัวอย่าง:

```text
js/
  navigation-menu.js
  hero-motion.js
  accordion.js
  form-validation.js
  video-controller.js
```

ข้อกำหนด:

- ห้ามรวมทุก feature ไว้ในไฟล์เดียว เช่น `main.js` ถ้ามีหลายหน้าที่ไม่เกี่ยวข้องกัน
- ชื่อไฟล์ต้องบอก behavior ชัดเจน
- ถ้า script ใช้เฉพาะหน้า ให้ link เฉพาะหน้านั้น
- ถ้า script ใช้เฉพาะ section ให้ผูกกับ class ของ section นั้นเท่านั้น
- ต้องตรวจสอบ element ก่อน bind event เสมอ เพื่อป้องกัน error ในหน้าที่ไม่มี element นั้น

ตัวอย่าง:

```js
const heroSection = document.querySelector('.hero-section');

if (heroSection) {
  const heroVideo = heroSection.querySelector('.hero-section__video');

  if (heroVideo) {
    heroVideo.play();
  }
}
```

## 9. Motion Guidelines

motion ต้องช่วยให้ผู้ใช้เข้าใจลำดับ, สถานะ หรือ interaction ของหน้าเว็บ ไม่ใช่ใส่เพื่อความหวือหวาอย่างเดียว

ข้อกำหนด:

- ใช้ duration จาก token เท่านั้น
- ใช้ easing จาก token เท่านั้น
- animation ต้องไม่ทำให้ layout shift
- hover หรือ interaction ต้องมี response ที่ชัดเจนแต่ไม่รบกวน
- เคารพ `prefers-reduced-motion`

ตัวอย่าง:

```css
.feature-card {
  transition:
    transform var(--duration-base) var(--ease-standard),
    opacity var(--duration-base) var(--ease-standard);

  &:hover {
    transform: translateY(calc(var(--space-4) * -1));
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: var(--duration-reduced);
    animation-iteration-count: var(--animation-iteration-reduced);
    scroll-behavior: auto;
    transition-duration: var(--duration-reduced);
  }
}
```

## 10. Asset Management

เมื่อมีการแก้ไข, เปลี่ยน section, ลบ component หรือเปลี่ยน media ต้องตรวจสอบ asset ที่เกี่ยวข้องทุกครั้ง

Checklist:

- ตรวจสอบว่า image, video, font, vendor file ใดไม่ได้ใช้งานแล้ว
- ลบ asset ที่ไม่ได้ใช้งานจาก section ที่ถูกลบหรือแก้ไข
- ห้ามเก็บไฟล์ทดลอง, ไฟล์ final หลายเวอร์ชัน หรือไฟล์ backup ไว้ในโปรเจกต์จริง
- ห้ามใช้ชื่อไฟล์เช่น `final`, `new`, `copy`, `test`, `backup` โดยไม่มีบริบท
- ถ้า asset ใช้หลาย section ต้องย้ายไปอยู่ในตำแหน่งกลางและตั้งชื่อให้ชัดเจน

ก่อนจบงานทุกครั้งให้ค้นหา reference ของ asset:

```text
ค้นหาใน .html, .css, .js ว่ายังมีการเรียกใช้ asset นั้นอยู่หรือไม่
```

## 11. HTML Rules

ข้อกำหนด:

- ใช้ semantic HTML ตามหน้าที่ของเนื้อหา
- link CSS ใน `<head>`
- link JavaScript ก่อนปิด `</body>` ยกเว้นกรณีจำเป็นจริงๆ
- ห้าม inline style
- ห้าม inline script
- ห้ามใช้ CDN
- ทุก image ต้องมี `alt` ที่เหมาะสม
- video ต้องกำหนด fallback หรือ poster เมื่อจำเป็น

ลำดับการ link CSS:

```html
<link rel="stylesheet" href="vendor/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/style.css">
```

ลำดับการ link JS:

```html
<script src="vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="js/feature-name.js"></script>
```

## 12. Quality Checklist

ก่อนส่งมอบงานทุกครั้งต้องตรวจสอบ:

- โครงสร้างไฟล์ตรงตามมาตรฐาน
- section ใหม่ใช้ Bootstrap layout system เช่น `.container`, `.row`, `.col-*` และ gutter ตาม Bootstrap
- ไม่มี CDN
- ไม่มี `<style>` ใน HTML
- ไม่มี `<script>` inline ใน HTML
- ใช้ Bootstrap 5 local file
- ใช้ `main.css` สำหรับ token, reusable values และ reusable component/class เช่น button, card, title, box
- ใช้ `style.css` สำหรับ section-specific class เท่านั้น
- `:root` variables ทั้งหมดอยู่ใน `main.css` เพียงไฟล์เดียว
- ตัวแปรใน `:root` ที่เป็นค่าขนาดหรือระยะใช้หน่วย `px`
- CSS เขียนแบบ nested
- ทุกค่า spacing, sizing, radius, font size ใช้ token
- class แยกเฉพาะ section ไม่ใช้ข้าม section
- JS แยกตามหน้าที่
- asset ที่ไม่ได้ใช้งานถูกลบออกแล้ว
- layout responsive ทุก breakpoint สำคัญ และมีการกำหนด behavior ชัดเจนเมื่อมีการเพิ่มหรือแก้ไข UI
- text ไม่ล้น container
- motion ไม่ทำให้ layout shift
- รองรับ `prefers-reduced-motion`

## 13. Definition of Done

งานถือว่าเสร็จเมื่อ:

- หน้าเว็บหรือ component ทำงานได้ตาม requirement
- UI มี spacing, sizing และ visual rhythm ตาม 8-point system
- โครงสร้างไฟล์สะอาดและสื่อสารได้
- ไม่มี dependency ที่โหลดผ่าน CDN
- ไม่มี asset ที่ไม่ได้ใช้งานจาก scope งานล่าสุด
- ไม่มี inline style หรือ inline script
- CSS และ JS แยกหน้าที่ชัดเจน
- ใช้ Bootstrap layout system ถูกต้องสำหรับ section ใหม่ และไม่สร้าง container/gutter เองโดยไม่มีข้อยกเว้น
- ผ่านการตรวจ responsive และ interaction แล้ว

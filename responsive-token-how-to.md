# Responsive Token How To

เอกสารนี้อธิบายวิธีเขียน CSS token แบบใหม่ของโปรเจค Better Trade 2026 เพื่อให้ responsive แก้ง่าย อ่านง่าย และนำ pattern ไปใช้กับโปรเจคอื่นได้

## หลักการหลัก

class ควรเรียกใช้ token ชื่อเดิมเสมอ ส่วน breakpoint ให้เปลี่ยน “ค่าของ token” แทนการเปลี่ยน token ที่ property โดยตรง

### ก่อนปรับ

```css
.class-name {
    font-size: var(--section-title-size);
}

@media (max-width: 1199px) {
    .class-name {
        font-size: var(--section-heading-size);
    }
}
```

ปัญหาคือ class เดียวกันใช้ token คนละตัวในแต่ละ breakpoint ทำให้แก้ภายหลังยากและต้องตามอ่านหลายจุด

### หลังปรับ

```css
.section-name {
    --bt-section-name-title-size: var(--section-title-size);
}

.section-name__title {
    font-size: var(--bt-section-name-title-size);
}

@media (max-width: 1199px) {
    .section-name {
        --bt-section-name-title-size: var(--section-heading-size);
    }
}
```

ข้อดีคือ `.section-name__title` ไม่ต้องรู้ว่าจอไหนใช้ขนาดเท่าไร หน้าที่ของ class คือ “ใช้ token” ส่วนหน้าที่ของ breakpoint คือ “เปลี่ยนค่า token”

## โครงสร้างการตั้งชื่อ

ใช้รูปแบบนี้เป็นหลัก:

```css
--bt-[section]-[element]-[property]
```

ตัวอย่าง:

```css
--bt-ticket-title-size
--bt-ticket-title-line-height
--bt-ticket-price-size
--bt-expectation-stat-size
--bt-floor-plan-title-size
```

ถ้าเป็น component ที่ reuse ได้ ให้ใช้ชื่อ component แทน section:

```css
--bt-section-title-size
--bt-section-title-line-height
--bt-section-subtext-size
```

## วิธีเลือก scope

ใช้ section scope เมื่อค่าใช้เฉพาะ section นั้น เช่น `.ticket`, `.expectation`, `.floor-plan`

```css
.ticket {
    --bt-ticket-title-size: var(--section-title-size);
}
```

ใช้ component scope เมื่อ class ถูก reuse หลาย section เช่น `.bt-section-title`

```css
.bt-section-title {
    --bt-section-title-size: var(--section-title-size);
    font-size: var(--bt-section-title-size);
}
```

หลีกเลี่ยงการเปลี่ยน token ระดับ `:root` ใน media query ถ้า token นั้นถูกใช้หลาย section เพราะจะกระทบทั้งเว็บพร้อมกัน

## Responsive Pattern

ให้ breakpoint ตั้งค่า token ที่ parent หรือ class scope เดิม

```css
.floor-plan {
    --bt-floor-plan-title-size: var(--section-title-size);
    --bt-floor-plan-title-line-height: var(--section-title-line-height);

    .floor-plan__title {
        font-size: var(--bt-floor-plan-title-size);
        line-height: var(--bt-floor-plan-title-line-height);
    }

    @media (max-width: 767px) {
        --bt-floor-plan-title-size: var(--section-heading-size);
        --bt-floor-plan-title-line-height: var(--section-heading-line-height);
    }
}
```

## กฎสำหรับค่าใหม่

- ถ้าเป็นค่าตัวเลขใน token ให้ใช้หน่วย `px`
- ถ้าเป็น spacing, sizing, radius ให้ใช้ system 8 หรือ token ที่มาจาก system 8
- หลีกเลี่ยง raw value ใน class เช่น `32px`, `40px`, `16px`
- ถ้าจำเป็นต้องใช้ค่าเฉพาะ ให้สร้าง primitive token หรือ section alias ก่อน
- ห้ามเปลี่ยนชื่อ token ใน property เดิมข้าม breakpoint ให้เปลี่ยนค่าของ alias token แทน

## ตัวอย่างการแก้เมื่อเจอ raw value

### ก่อนปรับ

```css
@media (max-width: 1199px) {
    .ticket__price strong {
        font-size: 32px;
    }
}
```

### หลังปรับ

```css
.ticket {
    --bt-ticket-price-size: var(--section-heading-size);

    .ticket__price strong {
        font-size: var(--bt-ticket-price-size);
    }

    @media (max-width: 1199px) {
        --bt-ticket-price-size: var(--font-size-32);
    }
}
```

## ข้อยกเว้น

ส่วน hero และ motion ที่ผูกกับ scroll timing เป็น legacy exception ของโปรเจคนี้ ห้าม refactor รวมกับงาน token ปกติ เพราะมีความเสี่ยงต่อ loader, CTA, sticky header, video และจังหวะเปลี่ยนฉาก

ถ้าจะ refactor hero ให้ทำเป็นงานแยก มี visual QA ก่อนและหลังทุก breakpoint

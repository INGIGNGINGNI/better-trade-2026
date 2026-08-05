  import { createLiquidMetalButton } from "./liquid-metal-button.js";

  const toast = document.getElementById("toast");
  let toastTimer;

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.visible = "true";
    toastTimer = setTimeout(() => { toast.dataset.visible = "false"; }, 2200);
  }

  const primary = createLiquidMetalButton({
    label: "ลงทะเบียนเข้าร่วมงาน",
    height: 48,
    paddingX: 34,
    fontSize: 15,
    fontWeight: 700,
    onClick: () => showToast("เปิดขั้นตอนลงทะเบียนแล้ว")
  });
  document.getElementById("primary-button-slot").appendChild(primary.el);

  document.querySelectorAll("[data-view-value]").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.dataset.view = button.dataset.viewValue;
      document.querySelectorAll("[data-view-value]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
    });
  });

  document.querySelectorAll("[data-toast]").forEach((button) => {
    button.addEventListener("click", () => showToast(button.dataset.toast));
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      try { await navigator.clipboard.writeText(value); } catch (error) { /* Clipboard can be unavailable on file URLs. */ }
      showToast(`${value} copied`);
    });
  });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      activateTab(tabs[next]);
      tabs[next].focus();
    });
  });

  function activateTab(activeTab) {
    tabs.forEach((tab) => {
      const selected = tab === activeTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
    });
  }

  let sortDirections = { price: -1, change: -1 };
  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      const direction = sortDirections[key];
      const body = document.getElementById("market-rows");
      const rows = [...body.rows].sort((a, b) => (Number(a.dataset[key]) - Number(b.dataset[key])) * direction);
      rows.forEach((row) => body.appendChild(row));
      sortDirections[key] *= -1;
      showToast(`เรียงตาม ${key} แล้ว`);
    });
  });

  document.getElementById("refresh-data").addEventListener("click", () => showToast("ข้อมูลตัวอย่างเป็นปัจจุบันแล้ว"));

  document.getElementById("profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("บันทึกข้อมูลลง Playbook แล้ว");
  });

  const dialog = document.getElementById("chapter-dialog");
  document.getElementById("open-dialog").addEventListener("click", () => dialog.showModal());
  document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
  document.querySelector("[data-dialog-cancel]").addEventListener("click", () => dialog.close());
  document.querySelector("[data-dialog-confirm]").addEventListener("click", () => {
    dialog.close();
    showToast("เริ่มสร้าง Playbook แล้ว");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const navLinks = [...document.querySelectorAll(".topnav a")];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.setAttribute("aria-current", String(link.getAttribute("href") === `#${entry.target.id}`));
      });
    });
  }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
  sections.forEach((section) => observer.observe(section));

(() => {
  document.documentElement.classList.add("js");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#navigation");
  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  nav
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
  });
  if (
    "IntersectionObserver" in window &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.25 },
    );
    document
      .querySelectorAll(".capability")
      .forEach((el) => observer.observe(el));
  }
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".projects.is-carousel").forEach((track) => {
    // Copia de las tarjetas para que el bucle no tenga final
    [...track.children].forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("data-clone", "");
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1; // clicable, pero fuera del tabulador
      track.append(clone);
    });
    const speed = reduceMotion ? 0 : 40; // px por segundo
    let pos = 0;
    let lastSet = 0;
    let held = false;
    let last = performance.now();
    const period = () => {
      const original = [...track.children].find(
        (c) => !c.hidden && !c.hasAttribute("data-clone"),
      );
      const clone = [...track.children].find(
        (c) => !c.hidden && c.hasAttribute("data-clone"),
      );
      if (!original || !clone) return 0;
      const visible = [...track.children].filter(
        (c) => !c.hidden && !c.hasAttribute("data-clone"),
      ).length;
      const perView = Math.round(track.clientWidth / original.offsetWidth);
      track.classList.toggle("is-static", visible <= perView);
      return track.classList.contains("is-static")
        ? 0
        : clone.offsetLeft - original.offsetLeft;
    };
    const tick = (now) => {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      if (Math.abs(track.scrollLeft - lastSet) > 1) pos = track.scrollLeft;
      const loop = period();
      if (loop) {
        if (!held) pos += speed * dt;
        pos = ((pos % loop) + loop) % loop;
      } else {
        pos = 0;
      }
      track.scrollLeft = pos;
      lastSet = track.scrollLeft;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Arrastrar con el ratón como en táctil
    let startX = 0;
    let startPos = 0;
    let moved = false;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      held = true;
      moved = false;
      startX = e.clientX;
      startPos = pos;
      track.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", (e) => {
      if (!held || e.pointerType !== "mouse") return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      pos = startPos - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!held) return;
      held = false;
      track.classList.remove("is-dragging");
    });
    track.addEventListener("click", (e) => {
      if (moved) {
        e.preventDefault();
        moved = false;
      }
    }, true);
    track.addEventListener("dragstart", (e) => e.preventDefault());
    track.addEventListener("touchstart", () => (held = true), { passive: true });
    track.addEventListener("touchend", () => (held = false), { passive: true });
    // La rueda vertical también lo desplaza
    track.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        pos += e.deltaY;
      },
      { passive: false },
    );
  });
  const filters = document.querySelector(".work-filters");
  if (filters) {
    const cards = [...document.querySelectorAll(".editorial-work .project")];
    const status = document.createElement("p");
    status.className = "sr-only";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    filters.after(status);
    let selectedFilter = "all";
    const updateFilter = () => {
      let visible = 0;
      cards.forEach((card) => {
        const show =
          selectedFilter === "all" ||
          card.dataset.categories.split(" ").includes(selectedFilter);
        card.hidden = !show;
        if (show && !card.hasAttribute("data-clone")) visible++;
      });
      cards[0].parentElement.scrollLeft = 0;
      filters.querySelectorAll("button").forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === selectedFilter),
        );
      });
      status.textContent =
        document.documentElement.lang === "en"
          ? `${visible} project${visible === 1 ? "" : "s"} shown`
          : `${visible} proyecto${visible === 1 ? "" : "s"} visible${visible === 1 ? "" : "s"}`;
    };
    filters.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        selectedFilter = button.dataset.filter;
        updateFilter();
      });
    });
    new MutationObserver(updateFilter).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
  }
})();

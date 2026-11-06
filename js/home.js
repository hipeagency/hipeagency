// HOME — escenas fijas guiadas por el scroll.
// Cada sección .ch.pin mide --len pantallas; su progreso 0→1 se publica como --p
// y los elementos con data-at / data-until se encienden en ese tramo.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) {
    return Math.min(b === undefined ? 1 : b, Math.max(a || 0, v));
  };

  // Menú móvil
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".menu-toggle");
  var closeMenu = function () {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  };
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
  });

  // Entradas sueltas fuera de las escenas fijas
  var ioEls = document.querySelectorAll(".io");
  if (!reduce && "IntersectionObserver" in window) {
    ioEls.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("on");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    ioEls.forEach(function (el) { io.observe(el); });
  }

  var hudNum = document.getElementById("hudNum");
  var hudChap = document.getElementById("hudChap");
  var hudClaim = document.getElementById("hudClaim");
  var navLinks = [].slice.call(document.querySelectorAll(".nav-links a"));
  var chs = [].slice.call(document.querySelectorAll(".ch"));

  function setTone(tone) {
    if (root.dataset.tone !== tone) root.dataset.tone = tone;
  }

  function setHud(c) {
    var d = c.dataset;
    if (c === chs[chs.length - 1]) root.dataset.last = "";
    else delete root.dataset.last;
    var lang = root.lang === "en" ? "en" : "es";
    var label = d["label" + (lang === "en" ? "En" : "Es")] || "";
    if (hudNum.textContent !== d.num) hudNum.textContent = d.num;
    if (hudChap.textContent !== label) hudChap.textContent = label;
    if (hudClaim.textContent !== d.claim) hudClaim.textContent = d.claim;
    navLinks.forEach(function (a) {
      a.classList.toggle("cur", !!c.id && a.getAttribute("href") === "#" + c.id);
    });
  }

  if (reduce) {
    // Sin escenas fijas: el HUD sigue la sección visible y nada más
    var cur = chs[0];
    setHud(cur);
    if ("IntersectionObserver" in window) {
      var hudIo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            cur = e.target;
            setHud(cur);
            setTone(cur.classList.contains("dark") ? "dark" : "light");
          }
        });
      }, { rootMargin: "-50% 0px -50% 0px" });
      chs.forEach(function (c) { hudIo.observe(c); });
    }
    new MutationObserver(function () { setHud(cur); })
      .observe(root, { attributes: true, attributeFilter: ["lang"] });
    return;
  }

  root.classList.add("js");

  var bar = document.querySelector(".bar i");
  var capIdx = [].slice.call(document.querySelectorAll("[data-cap]"));
  var capStack = document.querySelector(".cap-stack");
  var M = [], vh = innerHeight, dirty = true;

  function sizeWork(c) {
    // El tramo horizontal dura lo que mide la pista: ~1px de scroll por 1px de desplazamiento
    var track = c.querySelector(".track");
    var view = track.parentNode.getBoundingClientRect().width;
    var max = Math.max(0, track.scrollWidth - view);
    c.style.setProperty("--len", (1 + (max / vh) / 0.84 + 0.25).toFixed(3));
  }

  function measure() {
    vh = innerHeight;
    // Altura de la pila de capacidades = la capacidad más alta (evita cortes en móvil)
    if (capStack) {
      var h = 0;
      capStack.querySelectorAll(".cap").forEach(function (cap) {
        h = Math.max(h, cap.offsetHeight);
      });
      capStack.style.setProperty("--cap-h", h + "px");
    }
    chs.forEach(function (c) {
      if (c.querySelector(".track")) sizeWork(c);
    });
    M = chs.map(function (c) {
      var r = c.getBoundingClientRect();
      return {
        c: c,
        top: r.top + scrollY,
        h: c.offsetHeight,
        pin: c.classList.contains("pin"),
        rv: [].slice.call(c.querySelectorAll("[data-at]")),
        track: c.querySelector(".track"),
        caps: c.classList.contains("caps"),
        last: -1
      };
    });
    dirty = true;
  }

  function progressOf(m, y) {
    var span = m.pin ? Math.max(1, m.h - vh) : Math.max(1, m.h);
    return clamp((y - m.top) / span);
  }

  function update() {
    var y = scrollY, docH = Math.max(1, root.scrollHeight - vh), cur = null, top = null;
    bar.style.transform = "scaleX(" + clamp(y / docH).toFixed(4) + ")";
    for (var k = 0; k < M.length; k++) {
      var m = M[k], p = progressOf(m, y);
      if (y + vh * 0.5 >= m.top) cur = m;
      if (y + 40 >= m.top) top = m;
      if (m.last === p) continue;
      m.last = p;
      m.c.style.setProperty("--p", p.toFixed(4));
      for (var j = 0; j < m.rv.length; j++) {
        var el = m.rv[j], at = +el.dataset.at, un = el.dataset.until ? +el.dataset.until : 9;
        el.classList.toggle("on", p >= at && p < un);
      }
      if (m.caps) {
        var ci = Math.min(capIdx.length - 1, Math.floor(p * capIdx.length));
        capIdx.forEach(function (s, i) { s.classList.toggle("on", i === ci); });
      }
      if (m.track) {
        var view = m.track.parentNode.getBoundingClientRect().width;
        var max = Math.max(0, m.track.scrollWidth - view);
        m.track.style.transform = "translate3d(" + (-max * clamp((p - 0.08) / 0.84)).toFixed(1) + "px,0,0)";
      }
    }
    if (cur) setHud(cur.c);
    if (top) {
      // En el hero, cuando el punto rojo ya cubre la pantalla, el tono pasa a oscuro
      var red = top.c.classList.contains("hero") && progressOf(top, y) > 0.3;
      setTone(red || top.c.classList.contains("dark") ? "dark" : "light");
    }
  }

  function tick() {
    if (dirty) { update(); dirty = false; }
    requestAnimationFrame(tick);
  }

  // Tabulando por los proyectos: lleva el scroll hasta la tarjeta enfocada
  document.querySelectorAll(".track").forEach(function (track) {
    track.addEventListener("focusin", function (e) {
      var card = e.target.closest(".case");
      var m = M.filter(function (x) { return x.track === track; })[0];
      if (!card || !m) return;
      var view = track.parentNode.getBoundingClientRect().width;
      var max = Math.max(1, track.scrollWidth - view);
      var want = clamp((card.offsetLeft - (view - card.offsetWidth) / 2) / max);
      var p = 0.08 + want * 0.84;
      track.parentNode.scrollLeft = 0;
      scrollTo({ top: m.top + p * Math.max(1, m.h - vh), behavior: "auto" });
    });
  });

  addEventListener("scroll", function () { dirty = true; }, { passive: true });
  var rt;
  addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(measure, 120);
  });
  new MutationObserver(function () { measure(); })
    .observe(root, { attributes: true, attributeFilter: ["lang"] });
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  addEventListener("load", measure);
  requestAnimationFrame(tick);
})();

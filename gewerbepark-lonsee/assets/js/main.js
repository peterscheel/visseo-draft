/* Gewerbepark Lonsee – kleine Helfer ohne externe Bibliotheken */
(function () {
  "use strict";

  /* Mobiles Menü */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Kleine Meldung unten */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  /* Adresse kopieren */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { toast("Adresse kopiert: " + text); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { toast(text); });
      } else {
        toast(text);
      }
    });
  });

  /* Mieter-Filter */
  var chips = document.querySelectorAll("[data-filter]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      document.querySelectorAll(".tenant").forEach(function (t) {
        t.hidden = !(f === "alle" || t.getAttribute("data-gp") === f);
      });
    });
  });

  /* Mieter-Finder */
  var finder = document.querySelector("[data-finder]");
  if (finder) {
    var spots = finder.querySelectorAll(".spot");
    var legend = document.querySelectorAll(".legend button");
    var pop = finder.querySelector(".pop");
    var img = finder.querySelector(".finder-img");

    function show(i) {
      var s = spots[i];
      if (!s) return;
      spots.forEach(function (x, k) { x.classList.toggle("on", k === i); x.setAttribute("aria-expanded", k === i ? "true" : "false"); });
      legend.forEach(function (x, k) { x.classList.toggle("on", k === i); });
      var d = s.dataset;
      pop.innerHTML =
        (d.logo ? '<img src="' + d.logo + '" alt="">' : "") +
        "<b>" + d.name + "</b><small>" + d.desc + "</small>" +
        (d.url ? '<a class="link" href="' + d.url + '" target="_blank" rel="noopener">Zur Website →</a>' : "");
      pop.hidden = false;
      // Position: unter dem Punkt, innerhalb des Bildes halten
      var w = img.clientWidth, h = img.clientHeight;
      var x = s.offsetLeft, y = s.offsetTop;
      var pw = pop.offsetWidth, ph = pop.offsetHeight;
      var left = x + 30 + pw <= w - 8 ? x + 30 : x - 30 - pw;
      left = Math.min(Math.max(8, left), w - pw - 8);
      var top = Math.min(Math.max(8, y - ph / 2), h - ph - 8);
      pop.style.left = (img.offsetLeft + left) + "px";
      pop.style.top = (img.offsetTop + top) + "px";
    }
    spots.forEach(function (s, i) {
      s.addEventListener("mouseenter", function () { show(i); });
      s.addEventListener("focus", function () { show(i); });
      s.addEventListener("click", function () { show(i); });
    });
    legend.forEach(function (b, i) {
      b.addEventListener("mouseenter", function () { show(i); });
      b.addEventListener("click", function () { show(i); });
    });
    window.addEventListener("resize", function () {
      var on = finder.querySelector(".spot.on");
      if (on) show(Array.prototype.indexOf.call(spots, on));
    });
    show(2);
    var fimg = img.querySelector("img");
    if (fimg && !fimg.complete) fimg.addEventListener("load", function () {
      var on = finder.querySelector(".spot.on");
      show(on ? Array.prototype.indexOf.call(spots, on) : 2);
    });
  }

  /* Formulare (Kontakt + Flächen-Alarm) → Cloudflare Pages Function /api/kontakt */
  function sendForm(form, msgEl, okText) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msgEl.hidden = true;
      var missing = [];
      form.querySelectorAll("[required]").forEach(function (el) {
        var wrap = el.closest(".f");
        var bad = el.type === "checkbox" ? !el.checked : !el.value.trim();
        if (el.type === "email" && el.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value)) bad = true;
        if (wrap) wrap.classList.toggle("err", bad);
        if (bad) missing.push(el.getAttribute("data-label") || el.name);
      });
      if (missing.length) {
        msgEl.className = "form-msg bad";
        msgEl.textContent = "Bitte ergänzen Sie: " + missing.join(", ") + ".";
        msgEl.hidden = false;
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      var btn = form.querySelector("[type=submit]");
      if (btn) { btn.disabled = true; btn.dataset.t = btn.innerHTML; btn.textContent = "Wird gesendet …"; }
      fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.j && res.j.ok) {
            form.reset();
            msgEl.className = "form-msg ok";
            msgEl.textContent = okText;
          } else {
            msgEl.className = "form-msg bad";
            msgEl.textContent = (res.j && res.j.error) || "Die Nachricht konnte nicht gesendet werden. Bitte rufen Sie uns an: 0174 323 29 49.";
          }
          msgEl.hidden = false;
        })
        .catch(function () {
          msgEl.className = "form-msg bad";
          msgEl.textContent = "Keine Verbindung zum Server. Bitte rufen Sie uns an: 0174 323 29 49.";
          msgEl.hidden = false;
        })
        .finally(function () { if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.t; } });
    });
  }
  var kf = document.getElementById("kontaktformular");
  if (kf) sendForm(kf, document.getElementById("kontakt-msg"), "Vielen Dank! Ihre Nachricht ist bei Gerrit Korner angekommen. Wir melden uns so schnell wie möglich.");
  var af = document.getElementById("alarmformular");
  if (af) sendForm(af, document.getElementById("alarm-msg"), "Eingetragen. Wir melden uns, sobald eine Fläche frei wird.");

  /* Bestätigung nach Formular ohne JavaScript (?gesendet=1) */
  if (/[?&]gesendet=1/.test(location.search)) {
    var m = document.getElementById("kontakt-msg");
    if (m) { m.className = "form-msg ok"; m.textContent = "Vielen Dank! Ihre Nachricht ist angekommen."; m.hidden = false; }
  }


  /* Aktuelles: Reiter Nachrichten / Chronik (#chronik öffnet die Chronik) */
  var tabs = document.querySelectorAll('.tabs [role="tab"]');
  function openTab(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var id = t.getAttribute("aria-controls");
      openTab(id);
      history.replaceState(null, "", id === "panel-chronik" ? "#chronik" : location.pathname);
    });
  });
  if (tabs.length && location.hash === "#chronik") openTab("panel-chronik");

  /* Nachrichten aus assets/data/nachrichten.json */
  var MON = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  var MON_K = ["JAN","FEB","MÄR","APR","MAI","JUN","JUL","AUG","SEP","OKT","NOV","DEZ"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function parseDate(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function fmt(d) { return d ? d.getDate() + ". " + MON[d.getMonth()] + " " + d.getFullYear() : ""; }
  var list = document.querySelector("[data-news-list]");
  var latest = document.querySelector("[data-news-latest]");
  if (list || latest) {
    fetch("assets/data/nachrichten.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (items) {
        items = (items || []).filter(function (n) { return n && n.titel; })
          .sort(function (a, b) { return (b.datum || "").localeCompare(a.datum || ""); });
        if (latest && items[0]) {
          var d0 = parseDate(items[0].datum);
          latest.href = "aktuelles.html#n-" + items[0].datum;
          latest.querySelector(".date").innerHTML = d0 ? MON_K[d0.getMonth()] + "<br> " + d0.getFullYear() : "NEU";
          latest.querySelector("b").textContent = items[0].titel;
        }
        if (!list) return;
        if (!items.length) { list.innerHTML = '<p class="sub">Aktuell gibt es keine Nachrichten.</p>'; return; }
        var now = new Date();
        list.innerHTML = items.map(function (n) {
          var d = parseDate(n.datum);
          var isNew = d && (now - d) < 1000 * 60 * 60 * 24 * 45;
          var img = n.bild ? '<div class="pimg"><img src="' + esc(n.bild) + '" alt="" loading="lazy"' + (/\.png$/i.test(n.bild) ? ' class="plan"' : "") + "></div>" : "";
          var paras = String(n.text || "").split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
          return '<article class="post' + (img ? "" : " noimg") + (isNew ? " new" : "") + '" id="n-' + esc(n.datum) + '">' + img +
            '<div class="pbody"><div class="meta"><time datetime="' + esc(n.datum) + '">' + fmt(d) + "</time>" +
            (n.standort ? '<span class="status' + (/1/.test(n.standort) ? " s1" : /2/.test(n.standort) ? " s2" : /3/.test(n.standort) ? " s3" : "") + '">' + esc(n.standort) + "</span>" : "") + "</div>" +
            "<h2>" + esc(n.titel) + '</h2><div class="ptext">' + paras + "</div>" +
            (n.link ? '<a class="link" href="' + esc(n.link) + '">' + esc(n.linktext || "Mehr erfahren") + " →</a>" : "") +
            "</div></article>";
        }).join("");
        if (location.hash.indexOf("#n-") === 0) {
          var el = document.getElementById(location.hash.slice(1));
          if (el) el.scrollIntoView();
        }
      })
      .catch(function () { if (list) list.innerHTML = '<p class="sub">Die Nachrichten konnten nicht geladen werden.</p>'; });
  }

  /* Kopfzeile: Linie beim Scrollen */
  var hd = document.querySelector(".site-header");
  if (hd) { var onS = function () { hd.classList.toggle("scrolled", window.scrollY > 8); }; window.addEventListener("scroll", onS, { passive: true }); onS(); }


  /* Mieter ohne Website: Kontakt-Dialog */
  var dlg = document.getElementById("tenant-dlg");
  if (dlg) {
    var inner = dlg.querySelector(".tdlg-in");
    document.querySelectorAll("[data-contact]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = document.getElementById(b.getAttribute("data-contact"));
        inner.innerHTML = ""; inner.appendChild(t.content.cloneNode(true));
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      });
    });
    dlg.querySelector(".tdlg-x").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    var hmap = { "#kontakt-rts": "c-rts", "#kontakt-ee": "c-ee" };
    if (hmap[location.hash]) {
      var tb = document.querySelector('[data-contact="' + hmap[location.hash] + '"]');
      if (tb) { tb.scrollIntoView({ block: "center" }); tb.click(); }
    }
  }

  /* Gebäude: Zeichnung ↔ Foto */
  document.querySelectorAll(".cl-art").forEach(function (b) {
    var art = b;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { art.classList.add("play"); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(art);
    } else art.classList.add("play");
    b.addEventListener("click", function (ev) {
      var r = b.getBoundingClientRect();
      var x = ev.clientX ? ev.clientX - r.left : r.width / 2, y = ev.clientY ? ev.clientY - r.top : r.height / 2;
      b.style.setProperty("--cx", x + "px"); b.style.setProperty("--cy", y + "px");
      var on = b.classList.toggle("real");
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", on ? "Zurück zur Zeichnung" : "Foto des Gewerbepark 1 anzeigen");
    });
  });

  /* Google Maps erst nach Klick laden */
  var gm = document.querySelector("[data-gmap]");
  if (gm) {
    var tabs = document.querySelectorAll(".gmap-tabs [data-q]"), cur = tabs[0];
    var src = function (t) { return "https://maps.google.com/maps?q=" + encodeURIComponent(t.dataset.q) + "&z=" + (t.dataset.z || 15) + "&hl=de&output=embed"; };
    var load = function () {
      var f = gm.querySelector("iframe");
      if (!f) { f = document.createElement("iframe"); f.title = "Google Maps: Gewerbepark Lonsee"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; f.allowFullscreen = true; gm.innerHTML = ""; gm.appendChild(f); gm.classList.add("on"); }
      f.src = src(cur);
    };
    gm.querySelector("[data-gmap-load]").addEventListener("click", load);
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        cur = t; tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); });
        if (gm.classList.contains("on")) load();
      });
    });
  }

  /* ===== Bewegung: Einblenden beim Scrollen, Wort-Animation, Zähler, Bilder ===== */
  var root = document.documentElement;
  if (root.classList.contains("anim") && "IntersectionObserver" in window) {
    var main = document.querySelector("main") || document.body;
    var done = function (el) {
      el.addEventListener("transitionend", function te(e) {
        if (e.target !== el) return;
        el.classList.remove("rv", "in"); el.style.removeProperty("--d");
        el.removeEventListener("transitionend", te);
      });
    };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        el.classList.add("in");
        if (el.classList.contains("rv")) done(el);
        if (el.hasAttribute("data-count")) count(el);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });

    /* Überschriften Wort für Wort */
    main.querySelectorAll("h1, h2").forEach(function (h) {
      if (h.closest(".pop, .tdlg, template, .marquee")) return;
      var k = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
            parts.forEach(function (t) {
              if (!t) return;
              if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
              var o = document.createElement("span"), i = document.createElement("span");
              o.className = "sw"; i.textContent = t; i.style.setProperty("--k", k++); o.appendChild(i); frag.appendChild(o);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== "BR" && n.tagName !== "svg") walk(n);
        });
      })(h);
      h.classList.add("split"); io.observe(h);
    });

    /* Blöcke weich einblenden, Gruppen gestaffelt */
    var sel = [".kicker", ".sub", ".hx-lead", ".btn-row", ".g3-badge", ".hx-art", ".cl-art", ".stats > div", ".card3", ".legend li", ".tenant", ".g3-grid > *", ".rows > a", ".post", ".route li", ".f-card", ".k-form", ".k-side > *", ".alarm", ".wa-row", ".tl li", ".gmap-tabs", ".sn-fig", ".sn-facts li", ".detail .txt > *", ".figs > div", ".chips", ".band-head h1 + *"];
    main.querySelectorAll(sel.join(",")).forEach(function (el) {
      if (el.closest(".pop, .tdlg, .split, .rv")) return;
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty("--d", (Math.min(sib, 7) * 0.07) + "s");
      el.classList.add("rv"); io.observe(el);
    });

    /* Fotos: Vorhang auf */
    main.querySelectorAll(".hx-img, .finder-img, .detail .media, .gmap").forEach(function (el) {
      el.classList.add("rv-img"); io.observe(el);
    });

    /* Zahlen hochzählen */
    function count(el) {
      var raw = el.getAttribute("data-count"), m = raw.match(/^([\d.]+)(.*)$/);
      if (!m) return;
      var target = parseInt(m[1].replace(/\./g, ""), 10), rest = m[2], t0 = null, dur = 1600;
      var fmt = function (v) { return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(target * e)) + rest;
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }
    main.querySelectorAll(".stats b, .g3-facts b, .figs b, .sn-facts b").forEach(function (b) {
      if (!/^[\d.]+/.test(b.textContent.trim())) return;
      b.setAttribute("data-count", b.textContent.trim()); io.observe(b);
    });

    /* Foto oben: leichte Parallaxe */
    var par = document.querySelector(".hx-img img");
    if (par) {
      var tick = false;
      var upd = function () {
        var r = par.parentNode.getBoundingClientRect(), vh = innerHeight;
        if (r.bottom > 0 && r.top < vh) par.style.transform = "translateY(" + ((r.top + r.height / 2 - vh / 2) * -0.08).toFixed(1) + "px) scale(1.12)";
        tick = false;
      };
      addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
    }

    /* Standortkarten: leichte 3D-Neigung */
    if (matchMedia("(hover: hover)").matches) document.querySelectorAll(".card3").forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = "perspective(900px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 6).toFixed(2) + "deg) translateY(-6px)";
      });
      c.addEventListener("mouseleave", function () { c.style.transform = ""; });
    });

    /* Fortschrittsleiste oben */
    var bar = document.createElement("div"); bar.className = "progress"; document.body.appendChild(bar);
    var pu = function () { var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")"; };
    addEventListener("scroll", pu, { passive: true }); pu();
  }

  /* Laufband: Leucht-Ebene in Logoform */
  document.querySelectorAll(".marquee li a img").forEach(function (img) {
    var w = document.createElement("span"); w.className = "lgw";
    img.parentNode.insertBefore(w, img); w.appendChild(img);
    var gw = document.createElement("span"); gw.className = "glw";
    var g = document.createElement("span"); g.className = "glow";
    g.style.setProperty("--m", "url('" + img.src.replace("/logos/hell/", "/logos/glow/") + "')");
    gw.appendChild(g); w.appendChild(gw);
  });

  /* Jahr im Footer */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

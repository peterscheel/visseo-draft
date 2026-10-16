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
      var left = Math.min(Math.max(8, x - 24), w - pw - 8);
      var top = y + 30;
      if (top + ph > h - 8) top = y - ph - 30;
      pop.style.left = left + "px";
      pop.style.top = Math.max(8, top) + "px";
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

  /* Jahr im Footer */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

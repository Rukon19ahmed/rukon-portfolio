/* Shared helpers for index.html and work.html. Plain JavaScript, no libraries. */
(function () {
  'use strict';

  var P = (window.Portfolio = {});
  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  P.reduceMotion = function () { return reduceMotionQuery.matches; };
  P.canHover = function () { return hoverQuery.matches; };
  P.isFile = location.protocol === 'file:';

  P.$ = function (sel, root) { return (root || document).querySelector(sel); };
  P.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Escape text before putting it into HTML. */
  P.esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* A value counts as "filled" when it is a non-empty string. */
  P.has = function (value) { return typeof value === 'string' && value.trim() !== ''; };

  /* Strip [square brackets] from placeholder values used inside links (e.g. emails). */
  P.clean = function (value) { return String(value || '').replace(/^\[|\]$/g, '').trim(); };

  P.tools = function (tools) {
    if (Array.isArray(tools)) return tools.join(' · ');
    return tools || '';
  };

  P.loadJSON = function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(url + ' returned ' + res.status);
      return res.json();
    });
  };

  P.fileNotice = function () {
    return '<div class="notice"><p><strong>Open this site through a local server.</strong></p>' +
      '<p class="muted" style="margin-top:8px">Browsers block loading <code>data/*.json</code> from a file. ' +
      'In this folder run <code>python -m http.server 8000</code>, then open ' +
      '<code>http://localhost:8000</code>.</p></div>';
  };

  /* ---------- Fill text and links from data/site.json ---------- */
  P.applySite = function (site) {
    if (!site) return;

    P.$$('[data-bind]').forEach(function (el) {
      var value = site[el.getAttribute('data-bind')];
      if (P.has(value)) el.textContent = value;
    });

    var email = P.clean(site.email);
    P.$$('[data-email]').forEach(function (el) {
      if (!email) { el.hidden = true; return; }
      el.href = 'mailto:' + email;
      if (el.getAttribute('data-email') === 'text') el.textContent = email;
    });
    P.$$('[data-email-text]').forEach(function (el) { el.textContent = email; });

    var wa = P.clean(site.whatsapp).replace(/[^0-9X]/gi, '');
    P.$$('[data-whatsapp]').forEach(function (el) {
      if (!wa) { el.hidden = true; return; }
      var text = site.whatsappMessage ? '?text=' + encodeURIComponent(site.whatsappMessage) : '';
      el.href = 'https://wa.me/' + wa + text;
    });
    P.$$('[data-whatsapp-text]').forEach(function (el) { el.textContent = wa ? '+' + wa : ''; });

    var socials = site.socials || {};
    P.$$('[data-social]').forEach(function (el) {
      var url = P.clean(socials[el.getAttribute('data-social')]);
      var item = el.closest('li') || el;
      if (!url) { item.hidden = true; return; }
      item.hidden = false;
      el.href = url;
      // Show the handle, e.g. https://x.com/name -> @name
      var handleEl = P.$('[data-social-text]', el);
      if (handleEl) handleEl.textContent = '@' + url.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop();
    });

    P.$$('[data-status]').forEach(function (el) {
      var on = site.available !== false;
      el.classList.toggle('is-off', !on);
      var label = P.$('[data-status-text]', el);
      if (label) label.textContent = on ? (site.availableText || 'Available for new projects') : (site.unavailableText || 'Not taking new projects right now');
    });
  };

  P.setYear = function () {
    P.$$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  };

  /* ---------- Light / dark toggle ---------- */
  P.initTheme = function () {
    var root = document.documentElement;
    var btn = P.$('.theme-toggle');
    var meta = P.$('meta[name="theme-color"]');

    function apply(theme) {
      root.setAttribute('data-theme', theme);
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
      if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }

    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode: choice just isn't remembered */ }
    });
  };

  /* ---------- Mobile menu ---------- */
  P.initNav = function () {
    P.initTheme();
    var nav = P.$('.nav');
    var toggle = P.$('.nav-toggle');
    if (!nav || !toggle) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
    }

    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    P.$$('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', function () { setOpen(false); });
  };

  /* ---------- Fade / slide up on scroll ---------- */
  var revealObserver = null;
  P.reveal = function (root) {
    var items = P.$$('.reveal:not(.is-visible)', root);
    if (!('IntersectionObserver' in window) || P.reduceMotion()) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    items.forEach(function (el) { revealObserver.observe(el); });
  };

  /* ---------- Lightbox player ---------- */
  P.lightbox = (function () {
    var dialog, video, title, lastFocus;

    function init() {
      dialog = P.$('.lightbox');
      if (!dialog) return;
      video = P.$('.lightbox-video', dialog);
      title = P.$('.lightbox-title', dialog);

      P.$('.lightbox-close', dialog).addEventListener('click', close);

      // Click outside the video closes it.
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog || e.target.classList.contains('lightbox-inner')) close();
      });

      // Esc fires "cancel" then "close"; clean up on every close.
      dialog.addEventListener('close', cleanup);
    }

    function open(item) {
      if (!dialog) init();
      if (!dialog || !item || !item.file) return;
      lastFocus = document.activeElement;
      dialog.classList.toggle('is-vertical', !!item.vertical);
      title.textContent = item.title || '';
      video.poster = item.poster || '';
      video.src = item.file;
      video.setAttribute('aria-label', (item.title || 'Video') + ' player');
      document.body.classList.add('is-locked');
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () { /* autoplay with sound can be blocked; controls stay visible */ });
      P.$('.lightbox-close', dialog).focus();
    }

    function close() {
      if (!dialog) return;
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else { dialog.removeAttribute('open'); cleanup(); }
    }

    function cleanup() {
      video.pause();
      video.removeAttribute('src');
      video.load();
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    return { init: init, open: open, close: close };
  })();

  /* ---------- Sticky "Work with me" button on phones ---------- */
  P.initMobileCTA = function (startAfterEl, hideAtEl) {
    var cta = P.$('.mobile-cta');
    if (!cta || !('IntersectionObserver' in window)) return;
    var pastStart = !startAfterEl;
    var atEnd = false;

    function update() { cta.classList.toggle('is-shown', pastStart && !atEnd); }

    if (startAfterEl) {
      new IntersectionObserver(function (entries) {
        pastStart = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
        update();
      }).observe(startAfterEl);
    }
    if (hideAtEl) {
      new IntersectionObserver(function (entries) {
        atEnd = entries[0].isIntersecting;
        update();
      }, { threshold: 0.15 }).observe(hideAtEl);
    }
    update();
  };

  /* ---------- Shared icons ---------- */
  P.icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>'
  };
})();

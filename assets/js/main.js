/* Home page: renders everything from data/site.json, data/videos.json and data/testimonials.json */
(function () {
  'use strict';

  var P = window.Portfolio;
  var $ = P.$, $$ = P.$$, esc = P.esc, has = P.has;
  var videos = [];

  P.initNav();
  P.setYear();
  P.lightbox.init();
  initHero();
  P.reveal();
  P.initMobileCTA($('.hero'), $('#contact'));

  // One click handler for every "play" button on the page.
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-play]');
    if (!trigger) return;
    var id = trigger.getAttribute('data-play');
    var item = id === 'showreel'
      ? { file: 'videos/showreel.mp4', poster: 'posters/showreel.webp', title: 'Showreel' }
      : videos.filter(function (v) { return v.id === id; })[0];
    if (item) P.lightbox.open(item);
  });

  if (P.isFile) {
    $('#grid').innerHTML = P.fileNotice();
    return;
  }

  Promise.all([
    P.loadJSON('data/site.json').catch(warn),
    P.loadJSON('data/videos.json').catch(warn),
    P.loadJSON('data/testimonials.json').catch(function () { return []; })
  ]).then(function (results) {
    var site = results[0];
    videos = (Array.isArray(results[1]) ? results[1] : []).filter(function (v) { return !v.hidden; });

    if (site) {
      P.applySite(site);
      renderProof(site);
      renderServices(site.services);
      renderAbout(site);
    }
    renderFeatured(videos);
    renderWork(videos);
    renderTestimonials(results[2]);
    P.reveal();
  });

  function warn(err) {
    console.warn('[portfolio] Could not load data:', err.message);
    return null;
  }

  /* ---------- Hero showreel ---------- */
  function initHero() {
    var video = $('.hero-video');
    var toggle = $('.hero-toggle');
    if (!video || !toggle) return;
    var userPaused = false;

    function setPaused(paused) {
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    }

    if (P.reduceMotion()) {
      video.removeAttribute('autoplay');
      video.pause();
      userPaused = true;
      setPaused(true);
    }

    toggle.addEventListener('click', function () {
      if (video.paused) { userPaused = false; video.play(); setPaused(false); }
      else { userPaused = true; video.pause(); setPaused(true); }
    });

    // Hide the pause button if the showreel file is missing.
    var source = $('source', video);
    if (source) source.addEventListener('error', function () { toggle.hidden = true; });

    // Save battery: pause when the hero is off screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { if (!userPaused) video.play().catch(function () {}); }
        else video.pause();
      }).observe(video);
    }
  }

  /* ---------- Featured tiles ---------- */
  function renderFeatured(list) {
    var featured = list.filter(function (v) { return v.featured; }).slice(0, 3);
    $('#featured').innerHTML = featured.map(function (v, i) {
      var dark = i % 2 === 0;
      var tagline = has(v.tagline) ? v.tagline : v.description;
      return '' +
        '<section class="tile ' + (dark ? 'tile--black on-dark' : 'tile--grey') + ' feature' + (v.vertical ? ' feature--vertical' : '') + '" aria-labelledby="f-' + esc(v.id) + '">' +
          '<div class="wrap reveal">' +
            '<p class="eyebrow">' + esc(v.category) + '</p>' +
            '<h2 class="headline" id="f-' + esc(v.id) + '">' + esc(v.title) + '</h2>' +
            (has(tagline) ? '<p class="tagline">' + esc(tagline) + '</p>' : '') +
            '<p class="ctas">' +
              '<button class="link" type="button" data-play="' + esc(v.id) + '">Watch film ›</button>' +
              '<a class="link" href="work.html?id=' + encodeURIComponent(v.id) + '">Learn more ›</a>' +
            '</p>' +
          '</div>' +
          '<div class="feature-media reveal">' +
            '<button class="frame" type="button" data-play="' + esc(v.id) + '" aria-label="Play ' + esc(v.title) + '">' +
              '<img src="' + esc(v.poster) + '" alt="Still from ' + esc(v.title) + '" loading="lazy" decoding="async"' + (v.vertical ? ' width="1080" height="1920"' : ' width="1920" height="1080"') + '>' +
              '<span class="play-badge" aria-hidden="true">' + P.icons.play + '</span>' +
            '</button>' +
          '</div>' +
        '</section>';
    }).join('');
  }

  /* ---------- Work grid + filters ---------- */
  function renderWork(list) {
    var grid = $('#grid');
    var filters = $('#filters');

    if (!list.length) {
      grid.innerHTML = '<p class="muted" style="grid-column:1/-1;text-align:center">No projects yet. Add one to data/videos.json.</p>';
      return;
    }

    // Categories in the order they first appear.
    var cats = [];
    list.forEach(function (v) { if (v.category && cats.indexOf(v.category) === -1) cats.push(v.category); });

    if (cats.length > 1) {
      filters.innerHTML = ['All'].concat(cats).map(function (c, i) {
        return '<button class="pill" type="button" data-filter="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + '</button>';
      }).join('');
      filters.hidden = false;
      filters.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-filter]');
        if (!btn) return;
        var cat = btn.getAttribute('data-filter');
        $$('.pill', filters).forEach(function (p) { p.setAttribute('aria-pressed', String(p === btn)); });
        var shown = 0;
        $$('.card', grid).forEach(function (card) {
          var match = cat === 'All' || card.getAttribute('data-category') === cat;
          card.hidden = !match;
          if (match) shown++;
        });
        $('#filter-status').textContent = 'Showing ' + shown + (shown === 1 ? ' project' : ' projects');
      });
    }

    grid.innerHTML = list.map(cardHTML).join('');
    if (P.canHover() && !P.reduceMotion()) $$('.card', grid).forEach(attachPreview);
  }

  function cardHTML(v) {
    return '' +
      '<article class="card reveal' + (v.vertical ? ' card--vertical' : '') + '" data-category="' + esc(v.category) + '">' +
        '<button class="card-media" type="button" data-play="' + esc(v.id) + '" aria-label="Play ' + esc(v.title) + '">' +
          '<img src="' + esc(v.poster) + '" alt="Still from ' + esc(v.title) + '" loading="lazy" decoding="async" width="' + (v.vertical ? 1080 : 1920) + '" height="' + (v.vertical ? 1920 : 1080) + '">' +
          '<video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-src="' + esc(v.file) + '"></video>' +
          '<span class="card-play" aria-hidden="true">' + P.icons.play + '</span>' +
        '</button>' +
        '<div class="card-body">' +
          '<p class="card-tag">' + esc(v.category) + '</p>' +
          '<h3 class="card-title">' + esc(v.title) + '</h3>' +
          (has(v.description) ? '<p class="card-desc">' + esc(v.description) + '</p>' : '') +
          (P.tools(v.tools) ? '<p class="card-tools">' + esc(P.tools(v.tools)) + '</p>' : '') +
          '<a class="link" href="work.html?id=' + encodeURIComponent(v.id) + '" aria-label="Learn more about ' + esc(v.title) + '">Learn more ›</a>' +
        '</div>' +
      '</article>';
  }

  // Desktop only: play a muted preview on hover. The file only loads on first hover.
  function attachPreview(card) {
    var media = $('.card-media', card);
    var video = $('video', card);
    video.addEventListener('playing', function () { card.classList.add('is-previewing'); });
    media.addEventListener('mouseenter', function () {
      if (!video.getAttribute('src')) video.src = video.getAttribute('data-src');
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });
    media.addEventListener('mouseleave', function () {
      video.pause();
      card.classList.remove('is-previewing');
    });
  }

  /* ---------- Results + collaborations ---------- */
  function renderProof(site) {
    var stats = (site.stats || []).filter(function (s) { return has(s.value) && has(s.label); });
    // Each collaboration can be plain text, or { "role", "name", "url" }.
    var collabs = (site.collaborations || []).map(function (c) {
      return typeof c === 'string' ? { name: c } : (c || {});
    }).filter(function (c) { return has(c.name) && c.name.charAt(0) !== '['; });
    if (!stats.length && !collabs.length) return;

    $('#stats').innerHTML = stats.map(function (s) {
      return '<li><span class="stat-value">' + esc(s.value) + '</span><span class="stat-label">' + esc(s.label) + '</span></li>';
    }).join('');
    $('#stats').hidden = !stats.length;

    $('#collabs-list').innerHTML = collabs.map(function (c) {
      var name = has(c.url)
        ? '<a class="collab-name" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.name) + '</a>'
        : '<span class="collab-name">' + esc(c.name) + '</span>';
      return '<li>' + (has(c.role) ? '<span class="collab-role">' + esc(c.role) + '</span>' : '') + name + '</li>';
    }).join('');
    if (has(site.collaborationsTitle)) $('#collabs-title').textContent = site.collaborationsTitle;
    $('#collabs').hidden = !collabs.length;

    $('#proof').hidden = false;
  }

  /* ---------- Services ---------- */
  function renderServices(services) {
    services = (services || []).filter(function (s) { return has(s.title); });
    if (!services.length) { $('#services').hidden = true; return; }
    $('#services-list').innerHTML = services.map(function (s) {
      return '<li class="service reveal">' +
        '<h3>' + esc(s.title) + '</h3>' +
        (has(s.line) ? '<p>' + esc(s.line) + '</p>' : '') +
        (has(s.startingFrom) ? '<p class="price">Starting from ' + esc(s.startingFrom) + '</p>' : '') +
      '</li>';
    }).join('');
  }

  /* ---------- About ---------- */
  function renderAbout(site) {
    if (has(site.bio)) $('#bio').textContent = site.bio;
    var items = (site.whatIDo || []).filter(function (s) { return has(s.title); });
    $('#do-list').innerHTML = items.map(function (s) {
      return '<li class="do-item"><h3>' + esc(s.title) + '</h3>' + (has(s.line) ? '<p>' + esc(s.line) + '</p>' : '') + '</li>';
    }).join('');

    var kit = (site.toolkit || []).filter(function (k) { return has(k.label) && (k.tools || []).length; });
    if (kit.length) {
      // A tool can be plain text or { "name", "logo", "mono" }. "mono" logos take the text color.
      $('#toolkit').innerHTML = kit.map(function (k) {
        return '<div><dt>' + esc(k.label) + '</dt><dd><ul class="tools">' + k.tools.map(function (t) {
          if (typeof t === 'string') t = { name: t };
          var logo = '';
          if (has(t.logo)) {
            logo = t.mono
              ? '<span class="tool-logo tool-logo--mono" style="-webkit-mask-image:url(\'' + esc(t.logo) + '\');mask-image:url(\'' + esc(t.logo) + '\')" aria-hidden="true"></span>'
              : '<img class="tool-logo" src="' + esc(t.logo) + '" alt="" width="28" height="28" loading="lazy" decoding="async">';
          }
          return '<li class="tool">' + logo + '<span>' + esc(t.name) + '</span></li>';
        }).join('') + '</ul></dd></div>';
      }).join('');
      $('#toolkit').hidden = false;
    }
  }

  /* ---------- Testimonials (only real ones) ---------- */
  function renderTestimonials(list) {
    var real = (Array.isArray(list) ? list : []).filter(function (t) {
      return has(t.quote) && has(t.name) && t.quote.trim().charAt(0) !== '[';
    });
    if (!real.length) return;
    $('#quotes').innerHTML = real.map(function (t) {
      var who = '<strong>' + esc(t.name) + '</strong>' + (has(t.role) ? ', ' + esc(t.role) : '');
      if (has(t.link)) who = '<a href="' + esc(t.link) + '" rel="noopener" target="_blank">' + who + '</a>';
      return '<figure class="quote reveal"><blockquote>“' + esc(t.quote) + '”</blockquote><figcaption>' + who + '</figcaption></figure>';
    }).join('');
    $('#testimonials').hidden = false;
  }
})();

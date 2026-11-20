/* Case study page: work.html?id=your-project-id, built from data/videos.json */
(function () {
  'use strict';

  var P = window.Portfolio;
  var $ = P.$, $$ = P.$$, esc = P.esc, has = P.has;
  var root = $('#case');

  P.initNav();
  P.setYear();
  P.reveal();
  P.initMobileCTA(null, $('#contact'));

  if (P.isFile) {
    root.innerHTML = '<section class="tile tile--white"><div class="wrap">' + P.fileNotice() + '</div></section>';
    return;
  }

  var id = new URLSearchParams(location.search).get('id');

  Promise.all([
    P.loadJSON('data/site.json').catch(function () { return null; }),
    P.loadJSON('data/videos.json').catch(function () { return []; })
  ]).then(function (results) {
    var site = results[0];
    var videos = (Array.isArray(results[1]) ? results[1] : []).filter(function (v) { return !v.hidden; });
    P.applySite(site);

    var index = -1;
    videos.forEach(function (v, i) { if (v.id === id) index = i; });

    if (index === -1) { renderNotFound(); return; }

    var v = videos[index];
    var next = videos.length > 1 ? videos[(index + 1) % videos.length] : null;
    var name = (site && site.name) || 'Md Rukon Kholifa';

    document.title = v.title + ' — ' + name;
    var desc = $('meta[name="description"]');
    if (desc && has(v.description)) desc.setAttribute('content', v.description);

    root.innerHTML = heroHTML(v) + factsHTML(v) + storyHTML(v) + btsHTML(v) + resultsHTML(v) + nextHTML(next);

    // Show a clear message instead of a broken image when a behind-the-scenes file is missing.
    $$('.bts-figure img', root).forEach(function (img) {
      img.addEventListener('error', function () { img.parentNode.classList.add('is-missing'); });
    });

    P.reveal(root);
  });

  function renderNotFound() {
    document.title = 'Project not found';
    root.innerHTML = '<section class="tile tile--white"><div class="wrap">' +
      '<h1 class="headline">Project not found.</h1>' +
      '<p class="tagline">The link may be old, or the project was renamed.</p>' +
      '<p class="ctas"><a class="link" href="index.html#work">See all work ›</a></p>' +
      '</div></section>';
  }

  function heroHTML(v) {
    var tagline = has(v.tagline) ? v.tagline : v.description;
    return '' +
      '<section class="tile tile--white cs-hero">' +
        '<div class="wrap reveal">' +
          '<p class="eyebrow">' + esc(v.category) + (has(v.year) ? ' · ' + esc(v.year) : '') + '</p>' +
          '<h1 class="headline">' + esc(v.title) + '</h1>' +
          (has(tagline) ? '<p class="tagline">' + esc(tagline) + '</p>' : '') +
        '</div>' +
      '</section>' +
      '<div class="tile--white">' +
        '<div class="cs-player reveal' + (v.vertical ? ' is-vertical' : '') + '">' +
          '<video controls playsinline preload="metadata" poster="' + esc(v.poster) + '" aria-label="' + esc(v.title) + '">' +
            '<source src="' + esc(v.file) + '" type="video/mp4">' +
          '</video>' +
        '</div>' +
      '</div>';
  }

  function factsHTML(v) {
    var facts = [
      ['Client', has(v.client) ? v.client : 'Personal project'],
      ['My role', v.role],
      ['Tools', P.tools(v.tools)],
      ['Year', v.year]
    ].filter(function (f) { return has(f[1]); });
    return '' +
      '<section class="tile tile--white" style="padding-top:clamp(48px,7vw,80px)" aria-label="Project details">' +
        '<div class="wrap reveal">' +
          '<dl class="facts">' + facts.map(function (f) {
            return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
          }).join('') + '</dl>' +
        '</div>' +
      '</section>';
  }

  function storyHTML(v) {
    var blocks = '';
    if (has(v.brief)) blocks += '<div class="cs-block reveal"><h2>The brief.</h2><p class="lead">' + esc(v.brief) + '</p></div>';
    if (has(v.idea)) blocks += '<div class="cs-block reveal"><h2>The idea.</h2><p class="lead">' + esc(v.idea) + '</p></div>';

    var steps = (v.process || []).filter(function (s) { return has(s.step); });
    if (steps.length) {
      blocks += '<div class="cs-block reveal"><h2>The process.</h2>' +
        '<p class="lead muted">' + steps.map(function (s) { return esc(s.step); }).join(' → ') + '</p>' +
        '<ol class="steps">' + steps.map(function (s) {
          return '<li><h3>' + esc(s.step) + '</h3>' + (has(s.text) ? '<p>' + esc(s.text) + '</p>' : '') + '</li>';
        }).join('') + '</ol></div>';
    }
    if (!blocks) return '';
    return '<section class="tile tile--white" style="padding-top:0" aria-label="Story"><div class="wrap">' + blocks + '</div></section>';
  }

  function figure(src, label) {
    return '<figure class="bts-figure" data-src="' + esc(src) + '">' +
      '<img src="' + esc(src) + '" alt="' + esc(label || 'Behind the scenes frame') + '" loading="lazy" decoding="async">' +
      (has(label) ? '<span class="bts-label">' + esc(label) + '</span>' : '') +
      '</figure>';
  }

  function btsHTML(v) {
    var bts = v.behindTheScenes || {};
    var items = (bts.items || []).filter(function (it) {
      return (it.type === 'compare' && has(it.before) && has(it.after)) || (it.type === 'prompt' && has(it.prompt));
    });
    if (!items.length) return '';

    return '' +
      '<section class="tile tile--grey" aria-labelledby="bts-title">' +
        '<div class="wrap wrap--wide">' +
          '<div class="section-head reveal">' +
            '<h2 class="headline headline--md" id="bts-title">Behind the scenes.</h2>' +
            (has(bts.intro) ? '<p class="tagline">' + esc(bts.intro) + '</p>' : '') +
          '</div>' +
          '<div class="bts">' + items.map(function (it) {
            if (it.type === 'compare') {
              return '<div class="bts-pair reveal">' +
                figure(it.before, it.beforeLabel || 'Before') +
                figure(it.after, it.afterLabel || 'After') +
                (has(it.caption) ? '<p class="bts-caption">' + esc(it.caption) + '</p>' : '') +
              '</div>';
            }
            return '<div class="bts-prompt reveal">' +
              '<div class="prompt-box"><p class="eyebrow">Prompt</p>' + esc(it.prompt) + '</div>' +
              (has(it.image) ? figure(it.image, 'Result') : '') +
              (has(it.caption) ? '<p class="bts-caption">' + esc(it.caption) + '</p>' : '') +
            '</div>';
          }).join('') + '</div>' +
        '</div>' +
      '</section>';
  }

  function resultsHTML(v) {
    var r = v.results || {};
    var stats = (r.stats || []).filter(function (s) { return has(s.value) && has(s.label); });
    if (!stats.length && !has(r.link)) return '';
    return '' +
      '<section class="tile tile--white cs-results" aria-labelledby="results-title">' +
        '<div class="wrap reveal">' +
          '<h2 class="headline headline--md" id="results-title">Results.</h2>' +
          (stats.length ? '<ul class="stats" style="margin-top:40px">' + stats.map(function (s) {
            return '<li><span class="stat-value">' + esc(s.value) + '</span><span class="stat-label">' + esc(s.label) + '</span></li>';
          }).join('') + '</ul>' : '') +
          (has(r.link) ? '<p class="ctas" style="margin-top:40px"><a class="link" href="' + esc(r.link) + '" target="_blank" rel="noopener">' + esc(r.linkLabel || 'See the original post') + ' ›</a></p>' : '') +
        '</div>' +
      '</section>';
  }

  function nextHTML(next) {
    if (!next) return '';
    return '' +
      '<section class="tile tile--grey" aria-label="Next project">' +
        '<div class="wrap reveal">' +
          '<p class="eyebrow">Next project</p>' +
          '<h2 class="headline headline--md">' + esc(next.title) + '</h2>' +
          '<p class="ctas">' +
            '<a class="link" href="work.html?id=' + encodeURIComponent(next.id) + '">View project ›</a>' +
            '<a class="link" href="index.html#work">All work ›</a>' +
          '</p>' +
        '</div>' +
      '</section>';
  }
})();

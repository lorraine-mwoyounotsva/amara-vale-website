/* Amara Vale Photography */
(function () {
  'use strict';

  /* Always open a page at the top, unless the link points to a section on it */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  function toTop() { if (!location.hash) window.scrollTo(0, 0); }
  toTop();
  window.addEventListener('load', toTop);
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });

  /* Year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Videos: keep looping, respect reduced motion */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('video[data-autoplay]').forEach(function (v) {
    v.muted = true;
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  });

  /* Mobile menu */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    var closeBtn = mobileNav.querySelector('.mn-close');
    function setMenu(open) {
      mobileNav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && closeBtn) closeBtn.focus(); else menuBtn.focus();
    }
    menuBtn.addEventListener('click', function () { setMenu(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mobileNav.classList.contains('open')) setMenu(false); });
  }

  /* Lightbox */
  var gallery = document.querySelector('.gallery');
  if (gallery) {
    var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<img alt=""><button class="lb-btn lb-close" type="button">Close</button>' +
      '<button class="lb-btn lb-prev" type="button">Previous</button>' +
      '<button class="lb-btn lb-next" type="button">Next</button><span class="lb-count"></span>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCount = lb.querySelector('.lb-count'), idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + links.length) % links.length;
      var a = links[idx], im = a.querySelector('img');
      var big = a.getAttribute('data-large');
      lbImg.src = (big && Math.max(window.innerWidth, window.innerHeight) * (window.devicePixelRatio || 1) > 1700) ? big : a.getAttribute('href');
      lbImg.alt = im ? im.alt : '';
      lbCount.textContent = (idx + 1) + ' / ' + links.length;
    }
    function open(i) { lastFocus = document.activeElement; show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(i); }); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* Date picker */
  var dpWrap = document.querySelector('[data-datepicker]');
  if (dpWrap) {
    var display = dpWrap.querySelector('#date-display');
    var hidden = dpWrap.querySelector('#wedding-date');
    var toggle = dpWrap.querySelector('.dp-toggle');
    var panel = dpWrap.querySelector('.dp');
    var titleEl = panel.querySelector('.dp-title');
    var grid = panel.querySelector('.dp-grid');
    var status = panel.querySelector('.dp-status');
    var prevBtn = panel.querySelector('[data-dp="prev"]');
    var nextBtn = panel.querySelector('[data-dp="next"]');
    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var maxView = new Date(today.getFullYear() + 3, today.getMonth(), 1);
    var selected = null;

    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function pretty(d) { return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
    /* Sample booked dates: a repeatable pattern of Saturdays so the calendar looks lived in */
    function isBooked(d) {
      if (d.getDay() !== 6) return false;
      var n = d.getDate() + d.getMonth() * 3 + (d.getFullYear() % 7);
      return n % 3 === 0;
    }

    function render() {
      titleEl.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
      prevBtn.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      nextBtn.disabled = view >= maxView;
      var html = '';
      ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(function (d) { html += '<span class="dp-dow" aria-hidden="true">' + d + '</span>'; });
      var first = view.getDay();
      var len = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var i = 0; i < first; i++) html += '<span></span>';
      for (var day = 1; day <= len; day++) {
        var d = new Date(view.getFullYear(), view.getMonth(), day);
        var past = d < today, booked = isBooked(d) && !past;
        var cls = 'dp-day' + (booked ? ' booked' : '') + (d.getTime() === today.getTime() ? ' today' : '');
        var sel = selected && d.getTime() === selected.getTime();
        var label = pretty(d) + (booked ? ', already booked' : past ? ', unavailable' : ', available');
        html += '<button type="button" class="' + cls + '" data-date="' + iso(d) + '" aria-label="' + label + '" aria-selected="' + (sel ? 'true' : 'false') + '"' + ((past || booked) ? ' disabled' : '') + '>' + day + '</button>';
      }
      grid.innerHTML = html;
    }
    function openDp() {
      if (selected) view = new Date(selected.getFullYear(), selected.getMonth(), 1);
      render(); panel.classList.add('open'); toggle.setAttribute('aria-expanded', 'true');
      var f = grid.querySelector('[aria-selected="true"]') || grid.querySelector('.dp-day:not([disabled])');
      if (f) f.focus();
    }
    function closeDp(refocus) { panel.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); if (refocus) toggle.focus(); }

    toggle.addEventListener('click', function () { panel.classList.contains('open') ? closeDp(true) : openDp(); });
    display.addEventListener('click', openDp);
    display.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); openDp(); } });
    prevBtn.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    nextBtn.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.dp-day'); if (!b || b.disabled) return;
      var p = b.getAttribute('data-date').split('-');
      selected = new Date(+p[0], +p[1] - 1, +p[2]);
      hidden.value = iso(selected);
      display.value = pretty(selected);
      status.textContent = 'Good news, ' + pretty(selected) + ' is open.';
      var field = dpWrap.closest('.field'); if (field) field.classList.remove('invalid');
      render(); closeDp(true);
    });
    grid.addEventListener('keydown', function (e) {
      var b = e.target.closest('.dp-day'); if (!b) return;
      var keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (keys[e.key] === undefined) return;
      e.preventDefault();
      var all = Array.prototype.slice.call(grid.querySelectorAll('.dp-day'));
      var i = all.indexOf(b) + keys[e.key];
      if (all[i]) all[i].focus();
    });
    document.addEventListener('click', function (e) { if (panel.classList.contains('open') && !dpWrap.contains(e.target)) closeDp(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) closeDp(true); });
  }

  /* Enquiry form */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var thanks = document.getElementById('thanks');
    var flexible = document.getElementById('flexible');
    function setErr(name, msg) {
      var f = form.querySelector('[data-field="' + name + '"]'); if (!f) return;
      f.classList.toggle('invalid', !!msg);
      var e = f.querySelector('.err'); if (e) e.textContent = msg || '';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; };
      var ok = true, firstBad = null;
      function check(name, cond, msg) { setErr(name, cond ? '' : msg); if (!cond) { ok = false; if (!firstBad) firstBad = name; } }
      check('names', v('names').length > 1, 'Please tell me your names.');
      check('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')), 'Please add an email address I can reply to.');
      check('date', v('wedding_date') !== '' || (flexible && flexible.checked), 'Choose a date, or tick the box if it is not set yet.');
      check('location', v('location').length > 1, 'Where are you getting married?');
      check('collection', v('collection') !== '', 'Pick the collection you are leaning towards.');
      check('message', v('message').length > 9, 'A few lines about your day would help a lot.');
      if (!ok) {
        var bad = form.querySelector('[data-field="' + firstBad + '"]');
        if (bad) { bad.scrollIntoView({ block: 'center' }); var inp = bad.querySelector('input,select,textarea'); if (inp) inp.focus({ preventScroll: true }); }
        return;
      }
      var rows = [
        ['Names', v('names')], ['Email', v('email')],
        ['Date', v('wedding_date') ? document.getElementById('date-display').value : 'Not set yet'],
        ['Location', v('location')], ['Guests', v('guests') || 'Not sure yet'], ['Collection', v('collection')]
      ];
      var dl = thanks.querySelector('dl');
      dl.innerHTML = rows.map(function (r) {
        var dd = document.createElement('dd'); dd.textContent = r[1];
        return '<dt>' + r[0] + '</dt>' + dd.outerHTML;
      }).join('');
      thanks.querySelector('[data-first]').textContent = v('names').split(/\s*(?:&|and)\s*/i)[0];
      form.hidden = true;
      thanks.classList.add('show');
      thanks.scrollIntoView({ block: 'start' });
      thanks.focus();
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field'); if (f) f.classList.remove('invalid');
    });
  }
})();

/* ==========================================================================
   个人主页交互
   无任何依赖，直接由浏览器加载。
   功能：深浅色切换 / 中英切换 / 移动端菜单 / 滚动出现动画 /
         导航高亮 / 页脚年份
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 隐私模式忽略 */ } }
  };

  /* ------------------------------------------------------------ 深浅色 */
  var themeBtn = document.getElementById('themeToggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0e14' : '#2f6feb');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      store.set('theme', next);
    });
  }

  /* ------------------------------------------------------------ 中英切换 */
  var langBtn = document.getElementById('langToggle');
  var nodes = document.querySelectorAll('[data-zh]');

  function applyLang(lang) {
    var isEn = lang === 'en';

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var text = el.getAttribute(isEn ? 'data-en' : 'data-zh');
      if (text !== null) el.textContent = text;
    }

    root.setAttribute('lang', isEn ? 'en' : 'zh-CN');
    if (langBtn) langBtn.querySelector('.lang-label').textContent = isEn ? '中' : 'EN';
  }

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      var next = root.getAttribute('lang') === 'en' ? 'zh' : 'en';
      applyLang(next);
      store.set('lang', next);
    });
  }

  // 恢复上次的选择（默认中文）
  if (store.get('lang') === 'en') applyLang('en');

  /* -------------------------------------------------------- 移动端菜单 */
  var nav = document.getElementById('nav');
  var navBtn = document.getElementById('navToggle');

  function closeNav() {
    if (!nav || !navBtn) return;
    nav.classList.remove('is-open');
    navBtn.setAttribute('aria-expanded', 'false');
  }

  if (nav && navBtn) {
    navBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav-link')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* -------------------------------------------- 滚动：导航阴影 + 高亮 */
  var header = document.getElementById('siteHeader');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;

      if (header) header.classList.toggle('is-stuck', y > 8);

      // 当前所在区块：取最后一个已滚过顶部的区块
      var active = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= 120) active = sections[i];
      }
      // 滚到底部时高亮最后一个
      if (window.innerHeight + y >= document.body.offsetHeight - 4) {
        active = sections[sections.length - 1];
      }

      for (var j = 0; j < navLinks.length; j++) {
        navLinks[j].classList.toggle(
          'is-active',
          active && navLinks[j].getAttribute('href') === '#' + active.id
        );
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------- 滚动出现动画 */
  // 用滚动轮询而不是 IntersectionObserver：后者在快速拖动滚动条时会漏采样，
  // 被跳过的元素会一直停在 opacity:0，等于内容凭空消失。
  // 这里逐个检查位置，凡是进入过视口的都补上，全部显示后自动停。
  var pending = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var sweepQueued = false;

  function sweep() {
    sweepQueued = false;
    if (!pending.length) return;

    var limit = window.innerHeight * 0.94;
    var still = [];
    for (var i = 0; i < pending.length; i++) {
      // top 为负说明元素已经在视口上方，同样要显示
      if (pending[i].getBoundingClientRect().top < limit) {
        pending[i].classList.add('is-visible');
      } else {
        still.push(pending[i]);
      }
    }
    pending = still;

    if (!pending.length) {
      window.removeEventListener('scroll', onSweep);
      window.removeEventListener('resize', onSweep);
    }
  }

  function onSweep() {
    if (sweepQueued) return;
    sweepQueued = true;
    requestAnimationFrame(sweep);
  }

  window.addEventListener('scroll', onSweep, { passive: true });
  window.addEventListener('resize', onSweep);
  sweep();

  /* ------------------------------------------------------------ 页脚 */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

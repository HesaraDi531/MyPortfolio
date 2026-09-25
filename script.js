/* HESARA / STUDIO EDITION — no framework or build step.
   Canvas contour field, portrait depth, filters, reveals, and accessible controls. */
'use strict';
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionButton = document.querySelector('#motion-toggle');
  const canvas = document.querySelector('#living-field');
  const ctx = canvas.getContext('2d');
  const stage = document.querySelector('#portrait-stage');
  let paused = reducedMotion.matches;
  let width = 0, height = 0, frame = 0, lastTime = 0, phase = 0;
  let pointer = { x: .5, y: .5 }, smoothedPointer = { x: .5, y: .5 };

  function drawField() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    // Soft, moving contour lines form a quiet backdrop rather than a video.
    const count = width < 650 ? 12 : 20;
    for (let line = 0; line < count; line++) {
      ctx.beginPath();
      const base = height * .18 + line * 22;
      for (let x = -20; x <= width + 20; x += 24) {
        const u = x / Math.max(width, 1);
        const wave = Math.sin(u * 5 + phase + line * .045) * 52
          + Math.cos(u * 8 - phase * .6) * 22;
        const bend = Math.sin(u * Math.PI) * (smoothedPointer.y - .5) * 60;
        const y = base + wave + bend + u * height * .38;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(69, 107, 177, ${line % 4 === 0 ? .045 : .024})`;
      ctx.lineWidth = .8;
      ctx.stroke();
    }
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawField();
    updateProgress();
  }
  function animate(time) {
    if (paused || document.hidden) { frame = 0; return; }
    const delta = time - lastTime;
    // Cap work to about 30 FPS and avoid a large jump after tab switching.
    if (delta >= 32) {
      phase += Math.min(delta, 80) * .00012;
      smoothedPointer.x += (pointer.x - smoothedPointer.x) * .035;
      smoothedPointer.y += (pointer.y - smoothedPointer.y) * .035;
      drawField(); lastTime = time;
    }
    frame = requestAnimationFrame(animate);
  }
  function syncMotion() {
    document.documentElement.classList.toggle('motion-paused', paused || document.hidden);
    motionButton.innerHTML = paused ? 'Resume animation <span>▷</span>' : 'Pause animation <span>Ⅱ</span>';
    motionButton.setAttribute('aria-pressed', String(paused));
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    if (paused) resetPortrait();
    if (!paused && !document.hidden && ctx) frame = requestAnimationFrame(animate);
  }
  function resetPortrait() {
    stage.style.setProperty('--tilt-x', '0deg');
    stage.style.setProperty('--tilt-y', '0deg');
  }
  stage.addEventListener('pointermove', event => {
    if (paused || !finePointer.matches) return;
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    stage.style.setProperty('--tilt-x', `${-y * 9}deg`);
    stage.style.setProperty('--tilt-y', `${x * 9}deg`);
  }, { passive: true });
  stage.addEventListener('pointerleave', resetPortrait);
  window.addEventListener('pointermove', event => {
    if (paused || !finePointer.matches) return;
    pointer.x = event.clientX / width; pointer.y = event.clientY / height;
  }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', event => { paused = event.matches; syncMotion(); });
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  function closeMenu() {
    nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
  }
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); }
  });
  window.matchMedia('(min-width:641px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const filters = document.querySelectorAll('[data-filter]');
  const projects = document.querySelectorAll('.project-card');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    projects.forEach(card => {
      const visible = button.dataset.filter === 'all' || card.dataset.category.split(' ').includes(button.dataset.filter);
      card.hidden = !visible;
      if (visible) { count++; card.classList.remove('pending'); }
    });
    document.querySelector('#project-count').textContent = `${String(count).padStart(2, '0')} PROJECTS`;
    document.querySelector('#filter-status').textContent = `Showing ${count} projects`;
    updateProgress();
  }));

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('pending'); reveal.unobserve(entry.target); }
      });
    }, { threshold: .06 });
    if (!paused) document.querySelectorAll('.reveal').forEach(element => {
      element.classList.add('pending'); reveal.observe(element);
    });
    const sections = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        nav.querySelectorAll('a').forEach(link => {
          const active = link.hash === '#' + entry.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    document.querySelectorAll('main section[id]').forEach(section => sections.observe(section));
  }

  const progress = document.querySelector('#reading-progress');
  function updateProgress() {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    const percent = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;
    progress.style.transform = `scaleX(${percent})`;
  }
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { updateProgress(); scrollFrame = 0; });
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(updateProgress).observe(document.querySelector('main'));

  document.querySelector('#copy-email').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText('hesaradilnath531@gmail.com');
      status.textContent = 'Email copied.';
    } catch {
      status.textContent = 'Select and copy the email address shown here.';
    }
  });
  document.querySelector('#year').textContent = new Date().getFullYear();
  resize(); syncMotion();
})();

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

  const localScenes = [...document.querySelectorAll('.section-life')].map(canvas => ({canvas, ctx: canvas.getContext('2d'), visible: true, w: 0, h: 0}));
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => entries.forEach(entry => {
      const scene = localScenes.find(item => item.canvas === entry.target);
      if (scene) scene.visible = entry.isIntersecting;
    }), {rootMargin: '120px'});
    localScenes.forEach(scene => visibility.observe(scene.canvas));
  }
  function sizeScenes() {
    localScenes.forEach(scene => {
      const rect = scene.canvas.getBoundingClientRect();
      scene.w = Math.round(rect.width); scene.h = Math.min(3600, Math.round(rect.height));
      if (scene.canvas.width !== scene.w || scene.canvas.height !== scene.h) {
        scene.canvas.width = scene.w; scene.canvas.height = scene.h;
      }
    });
  }
  function drawScenes() {
    localScenes.forEach(({canvas,ctx,w,h,visible}) => {
      if (!ctx || !visible || !w || !h) return;
      ctx.clearRect(0,0,w,h);
      if (fieldMode === 'quiet') return;
      const dark = canvas.parentElement.id === 'about';
      const color = dark ? '135,177,255' : '39,92,231';
      // Flowing bands run through the whole section rather than only its top.
      for (let row=0; row<Math.ceil(h/200)+2; row++) {
        const base = row*200 - 40;
        for(let band=0;band<3;band++) {
          ctx.beginPath();
          for(let x=-20;x<=w+20;x+=16) {
            const y = base + band*14 + Math.sin(x/w*7 + phase*1.4 + row*.7)*38;
            x===-20 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
          }
          ctx.strokeStyle=`rgba(${color},${dark ? .13 : .13})`;ctx.lineWidth=1;ctx.stroke();
        }
        const px = ((phase*100 + row*177)%(w+60))-30;
        const py = base + Math.sin(px/w*7 + phase*1.4 + row*.7)*38;
        ctx.fillStyle=`rgba(${color},.6)`;ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=`rgba(${color},.07)`;ctx.beginPath();ctx.arc(px,py,14,0,Math.PI*2);ctx.fill();
      }
      // Slowly drifting wireframe rings give every section its own depth.
      for(let n=0;n<3;n++) {
        const cx = w*(n%2 ? .12 : .88)+Math.sin(phase*.6+n)*25;
        const cy = h*(n+1)/4 + Math.cos(phase*.8+n)*30;
        for(let ring=0;ring<3;ring++) {
          ctx.beginPath();ctx.ellipse(cx,cy,65+ring*24,100+ring*20,phase*.12+n,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${color},${dark?.13:.10})`;ctx.stroke();
        }
      }
    });
  }
  let fieldMode = 'circuit';
  function drawField() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (fieldMode === 'quiet') return;
    const gap = width < 650 ? 65 : 82;
    // A sparse circuit board: traces and travelling signals, never over the text.
    ctx.fillStyle = 'rgba(39,92,231,.12)';
    for (let x = 25; x < width; x += gap) {
      for (let y = 20; y < height; y += gap) {
        ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill();
      }
    }
    const lanes = width < 650 ? 5 : 9;
    for (let i = 0; i < lanes; i++) {
      const x = width * (i+.3) / lanes;
      const y = (i*137 + 50) % Math.max(height,1);
      const shift = Math.sin(phase*.3+i)*14;
      const nodes = [[x-100,y+shift],[x+30,y+shift],[x+80,y+50+shift],[x+210,y+50+shift]];
      ctx.beginPath(); nodes.forEach(([px,py],n)=>n?ctx.lineTo(px,py):ctx.moveTo(px,py));
      ctx.strokeStyle = 'rgba(39,92,231,.09)'; ctx.lineWidth=1; ctx.stroke();
      const t = (phase*.35+i*.19)%1;
      const lengths=[130,Math.sqrt(5000),130],total=lengths.reduce((a,b)=>a+b,0);
      let distance=t*total,segment=0;
      while(segment<2 && distance>lengths[segment]) { distance-=lengths[segment]; segment++; }
      const u=distance/lengths[segment],from=nodes[segment],to=nodes[segment+1];
      const px=from[0]+(to[0]-from[0])*u,py=from[1]+(to[1]-from[1])*u;
      ctx.fillStyle='rgba(39,92,231,.35)'; ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(39,92,231,.12)';ctx.beginPath();ctx.arc(nodes[0][0],nodes[0][1],4,0,Math.PI*2);ctx.stroke();
    }
    if (finePointer.matches) {
      const px=smoothedPointer.x*width,py=smoothedPointer.y*height;
      const glow=ctx.createRadialGradient(px,py,0,px,py,200);
      glow.addColorStop(0,'rgba(39,92,231,.035)');glow.addColorStop(1,'rgba(39,92,231,0)');
      ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    }
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawField();
    sizeScenes(); drawScenes();
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
      drawField(); drawScenes(); lastTime = time;
    }
    frame = requestAnimationFrame(animate);
  }
  function syncMotion() {
    document.documentElement.classList.toggle('motion-paused', paused || document.hidden);
    motionButton.innerHTML = paused ? 'Resume animation <span>▷</span>' : 'Pause animation <span>Ⅱ</span>';
    motionButton.setAttribute('aria-pressed', String(paused));
    const botMotion = document.querySelector('#companion-motion');
    botMotion.textContent = paused ? 'Resume motion' : 'Pause motion';
    botMotion.setAttribute('aria-pressed', String(paused));
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

  // Background style is independent of the pause control.
  document.querySelectorAll('[data-field]').forEach(button => {
    button.addEventListener('click', () => {
      fieldMode = button.dataset.field;
      document.querySelectorAll('[data-field]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      drawField(); drawScenes();
    });
  });

  // These are ordinary buttons: Tab to navigate, Enter/Space to select.
  // All panels remain readable when JavaScript is unavailable.
  const disciplines = [...document.querySelectorAll('[data-discipline]')];
  const skillPanels = [...document.querySelectorAll('.skill-panel')];
  function selectDiscipline(index) {
    disciplines.forEach((button,i) => button.setAttribute('aria-pressed', String(i === index)));
    skillPanels.forEach((panel,i) => { panel.hidden = i !== index; });
  }
  disciplines.forEach((button,index) => button.addEventListener('click', () => selectDiscipline(index)));
  document.querySelector('.system-shell').classList.add('system-enhanced');
  selectDiscipline(2);

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

  // A skill-to-project link must work even when a different filter is active.
  document.querySelectorAll('[data-open-project]').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelector('[data-filter="all"]').click();
      const card = document.getElementById(link.dataset.openProject);
      card.classList.remove('pending');
      const details = card.querySelector('details');
      if (details) details.open = true;
    });
  });

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
  if ('ResizeObserver' in window) new ResizeObserver(() => { updateProgress(); sizeScenes(); drawScenes(); }).observe(document.querySelector('main'));
  document.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () => {sizeScenes();drawScenes();}));

  document.querySelector('#copy-email').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText('hesaradilnath531@gmail.com');
      status.textContent = 'Email copied.';
    } catch {
      status.textContent = 'Select and copy the email address shown here.';
    }
  });
  const companion = document.querySelector('#companion');
  const companionTrigger = document.querySelector('#companion-trigger');
  const companionPanel = document.querySelector('#companion-panel');
  function closeCompanion(returnFocus = false) {
    companionPanel.hidden = true;
    companionTrigger.setAttribute('aria-expanded','false');
    if (returnFocus) companionTrigger.focus();
  }
  companionTrigger.addEventListener('click', () => {
    if (companion.classList.contains('minimized')) {
      companion.classList.remove('minimized');
      companionTrigger.setAttribute('aria-label','Open H.DOT companion menu');
      return;
    }
    const open = companionPanel.hidden;
    companionPanel.hidden = !open;
    companionTrigger.setAttribute('aria-expanded',String(open));
    if (open) document.querySelector('#companion-close').focus();
  });
  document.querySelector('#companion-close').addEventListener('click',()=>closeCompanion(true));
  document.querySelector('#companion-minimize').addEventListener('click',()=>{
    closeCompanion();companion.classList.add('minimized');
    companionTrigger.setAttribute('aria-label','Restore H.DOT companion');companionTrigger.focus();
  });
  document.querySelector('#companion-motion').addEventListener('click',()=>{paused=!paused;syncMotion();});
  document.querySelectorAll('.companion-links a').forEach(link=>link.addEventListener('click',()=>closeCompanion()));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!companionPanel.hidden)closeCompanion(true);});
  document.addEventListener('click',event=>{if(!companion.contains(event.target))closeCompanion();});
  window.addEventListener('pointermove',event=>{
    if(paused || !finePointer.matches)return;
    const rect=companionTrigger.getBoundingClientRect();
    companion.style.setProperty('--eye-x',`${Math.max(-3,Math.min(3,(event.clientX-rect.left)/120))}px`);
    companion.style.setProperty('--eye-y',`${Math.max(-2,Math.min(2,(event.clientY-rect.top)/180))}px`);
  },{passive:true});
  if('IntersectionObserver' in window) {
    const messages={home:'Hello! I’m H.DOT. Let’s explore what Hesara builds.',projects:'Eight projects, from library systems to data stories. Pick one to explore.',about:'The human behind the code: curious, analytical, and always learning.',skills:'Choose a discipline to see how Hesara connects tools with real projects.',journey:'New ideas start with learning. Here’s the journey so far.',contact:'Have an idea? This is a good place to start a conversation.'};
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting)document.querySelector('#companion-context').textContent=messages[entry.target.id]||messages.home;
    }),{rootMargin:'-15% 0px -55% 0px'});
    document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));
  }
  document.querySelector('#year').textContent = new Date().getFullYear();
  resize(); syncMotion();
})();

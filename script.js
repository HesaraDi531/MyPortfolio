/**
 * Hesara Dilnath Portfolio Script
 * Interactive functionalities including mouse tracking, typewriter effect,
 * navigation highlight, mobile drawer toggle, and project filter.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorAndMouseLight();
  initTypewriter();
  initMobileNav();
  initScrollHeaderAndActiveNav();
  initProjectFilters();
  setCurrentYear();
});

/* ------------------------------------------------------------
   1. MOUSE LIGHT & CUSTOM CURSOR (DESKTOP)
   ------------------------------------------------------------ */
function initCursorAndMouseLight() {
  const mouseGlow = document.getElementById('mouseGlow');
  const customCursor = document.getElementById('customCursor');

  if (window.innerWidth > 768) {
    window.addEventListener('mousemove', (e) => {
      const x = e.clientX;
      const y = e.clientY;

      if (mouseGlow) {
        mouseGlow.style.setProperty('--mouse-x', `${x}px`);
        mouseGlow.style.setProperty('--mouse-y', `${y}px`);
      }

      if (customCursor) {
        customCursor.style.left = `${x}px`;
        customCursor.style.top = `${y}px`;
      }
    });
  }
}

/* ------------------------------------------------------------
   2. HERO TYPEWRITER EFFECT
   ------------------------------------------------------------ */
function initTypewriter() {
  const target = document.getElementById('typewriter');
  if (!target) return;

  const phrases = [
    'Software Developer',
    'Data Science Student',
    'AI & ML Enthusiast',
    'Full-Stack Developer'
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  const typeSpeed = 80;
  const deleteSpeed = 40;
  const pauseTime = 2000;

  function type() {
    const currentPhrase = phrases[phraseIdx];

    if (isDeleting) {
      target.textContent = currentPhrase.substring(0, charIdx - 1);
      charIdx--;
    } else {
      target.textContent = currentPhrase.substring(0, charIdx + 1);
      charIdx++;
    }

    let delay = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIdx === currentPhrase.length) {
      delay = pauseTime;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      delay = 500;
    }

    setTimeout(type, delay);
  }

  type();
}

/* ------------------------------------------------------------
   3. MOBILE NAVIGATION DRAWER
   ------------------------------------------------------------ */
function initMobileNav() {
  const toggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  const items = document.querySelectorAll('.nav-item');

  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-xmark');
    }
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const icon = toggle.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-xmark');
      }
    });
  });
}

/* ------------------------------------------------------------
   4. ACTIVE NAV & SCROLL OBSERVER
   ------------------------------------------------------------ */
function initScrollHeaderAndActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-item');

  function highlightNav() {
    const scrollY = window.pageYOffset;

    sections.forEach((section) => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navItems.forEach((item) => {
          item.classList.remove('active');
          if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav);
}

/* ------------------------------------------------------------
   5. PROJECT CATEGORY FILTERING
   ------------------------------------------------------------ */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectPanels = document.querySelectorAll('.project-panel');

  if (!filterBtns.length || !projectPanels.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectPanels.forEach((panel) => {
        const categories = panel.getAttribute('data-category');

        if (filterValue === 'all' || (categories && categories.includes(filterValue))) {
          panel.style.display = 'grid';
          setTimeout(() => {
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
          }, 50);
        } else {
          panel.style.opacity = '0';
          panel.style.transform = 'translateY(20px)';
          setTimeout(() => {
            panel.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* ------------------------------------------------------------
   6. AUTOMATIC FOOTER YEAR
   ------------------------------------------------------------ */
function setCurrentYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

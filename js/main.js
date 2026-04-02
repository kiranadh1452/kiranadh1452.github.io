/* ========================================
   THEME SYSTEM
   ======================================== */

(function initTheme() {
  // Theme is set by inline script in <head> to prevent flash.
  // This module handles toggling only.
})();

const ThemeManager = {
  // Cycle: system -> light -> dark -> system
  _order: ['system', 'light', 'dark'],

  current() {
    return localStorage.getItem('theme') || 'system';
  },

  apply(mode) {
    const root = document.documentElement;
    if (mode === 'system') {
      root.removeAttribute('data-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // For icon display, we still need data-theme when on system
      // Remove it so CSS :not([data-theme]) selectors can handle system icon
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
    localStorage.setItem('theme', mode);
    this._updateIcon(mode);
  },

  toggle() {
    const cur = this.current();
    const idx = this._order.indexOf(cur);
    const next = this._order[(idx + 1) % this._order.length];
    this.apply(next);
  },

  _updateIcon(mode) {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.querySelector('.icon-sun').style.display = mode === 'light' ? 'block' : 'none';
    btn.querySelector('.icon-moon').style.display = mode === 'dark' ? 'block' : 'none';
    btn.querySelector('.icon-system').style.display = mode === 'system' ? 'block' : 'none';

    const labels = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };
    btn.setAttribute('aria-label', 'Toggle theme, current: ' + labels[mode]);
  },

  init() {
    const mode = this.current();
    this.apply(mode);

    // Listen for OS changes when in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.current() === 'system') {
        this.apply('system');
      }
    });

    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  }
};

/* ========================================
   SCROLL PROGRESS BAR
   ======================================== */

function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ========================================
   HERO ANIMATION
   ======================================== */

function initHeroAnimation() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Check reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.classList.add('hero--loaded');
    return;
  }

  setTimeout(() => {
    hero.classList.add('hero--loaded');
  }, 200);
}

/* ========================================
   HERO CURSOR EFFECT (Desktop only)
   ======================================== */

function initHeroCursor() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 1024) return;

  const hero = document.querySelector('.hero');
  const overlay = document.querySelector('.hero__cursor');
  if (!hero || !overlay) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    overlay.style.background = 'radial-gradient(200px circle at ' + x + 'px ' + y + 'px, var(--accent-primary), transparent)';
    overlay.style.opacity = '0.08';
  });

  hero.addEventListener('mouseleave', () => {
    overlay.style.opacity = '0';
  });
}

/* ========================================
   SCROLL REVEAL (IntersectionObserver)
   ======================================== */

function initScrollReveal() {
  // Reduced motion: make everything visible
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('reveal--visible');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger siblings
        const el = entry.target;
        const parent = el.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll(':scope > .reveal')) : [el];
        const idx = siblings.indexOf(el);
        const delay = idx * 40;

        el.style.transitionDelay = delay + 'ms';
        el.classList.add('reveal--visible');
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

/* ========================================
   SECTION TRACKING (for commit graph + mobile dots)
   ======================================== */

function initSectionTracking() {
  const sections = document.querySelectorAll('section[id]');
  const mobileDots = document.querySelectorAll('.mobile-progress__dot');
  const graphDots = document.querySelectorAll('.commit-graph__dot');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

  if (sections.length === 0) return;

  const sectionIds = Array.from(sections).map(s => s.id);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const idx = sectionIds.indexOf(id);

        // Update mobile dots
        mobileDots.forEach((dot, i) => {
          dot.classList.toggle('mobile-progress__dot--active', i === idx);
        });

        // Update nav links
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('nav__link--active', href === '#' + id);
        });

        // Update commit graph dots
        updateCommitGraph(idx, sectionIds.length);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '-10% 0px -60% 0px'
  });

  sections.forEach(s => observer.observe(s));
}

/* ========================================
   COMMIT GRAPH (Desktop SVG sidebar)
   ======================================== */

function initCommitGraph() {
  if (window.innerWidth < 1024) return;

  const container = document.querySelector('.commit-graph');
  if (!container) return;

  const sections = document.querySelectorAll('section[id]');
  const numSections = sections.length;
  if (numSections === 0) return;

  // Build SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '40');
  svg.setAttribute('viewBox', '0 0 40 1000');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.height = '100%';
  svg.style.overflow = 'visible';

  const style = getComputedStyle(document.documentElement);

  // Background track line
  const trackLine = document.createElementNS(svgNS, 'line');
  trackLine.setAttribute('x1', '20');
  trackLine.setAttribute('y1', '50');
  trackLine.setAttribute('x2', '20');
  trackLine.setAttribute('y2', '950');
  trackLine.setAttribute('stroke', 'var(--border-subtle)');
  trackLine.setAttribute('stroke-width', '1');
  svg.appendChild(trackLine);

  // Progress fill line
  const progressLine = document.createElementNS(svgNS, 'line');
  progressLine.setAttribute('x1', '20');
  progressLine.setAttribute('y1', '50');
  progressLine.setAttribute('x2', '20');
  progressLine.setAttribute('y2', '50');
  progressLine.setAttribute('stroke', 'var(--accent-primary)');
  progressLine.setAttribute('stroke-width', '2');
  progressLine.setAttribute('id', 'graph-progress');
  svg.appendChild(progressLine);

  // Experience branch paths (between dot 0 and dot 1 area)
  // fork into two lines representing Nepal and US career
  const branchStart = 50 + (1 / (numSections - 1)) * 900 * 0.15;
  const branchEnd = 50 + (1 / (numSections - 1)) * 900 * 0.85;

  const branchLeft = document.createElementNS(svgNS, 'path');
  branchLeft.setAttribute('d', 'M20,' + branchStart + ' C10,' + (branchStart + 30) + ' 8,' + (branchEnd - 30) + ' 20,' + branchEnd);
  branchLeft.setAttribute('stroke', 'var(--border-subtle)');
  branchLeft.setAttribute('stroke-width', '1');
  branchLeft.setAttribute('fill', 'none');
  branchLeft.setAttribute('opacity', '0.5');
  svg.appendChild(branchLeft);

  const branchRight = document.createElementNS(svgNS, 'path');
  branchRight.setAttribute('d', 'M20,' + branchStart + ' C30,' + (branchStart + 30) + ' 32,' + (branchEnd - 30) + ' 20,' + branchEnd);
  branchRight.setAttribute('stroke', 'var(--border-subtle)');
  branchRight.setAttribute('stroke-width', '1');
  branchRight.setAttribute('fill', 'none');
  branchRight.setAttribute('opacity', '0.5');
  svg.appendChild(branchRight);

  // Dots for each section
  const sectionIds = Array.from(sections).map(s => s.id);
  for (let i = 0; i < numSections; i++) {
    const cy = 50 + (i / (numSections - 1)) * 900;
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '20');
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', 'var(--surface-primary)');
    circle.setAttribute('stroke', 'var(--border-subtle)');
    circle.setAttribute('stroke-width', '1.5');
    circle.classList.add('commit-graph__dot');
    circle.dataset.section = sectionIds[i];

    // Click to scroll
    circle.addEventListener('click', () => {
      const target = document.getElementById(sectionIds[i]);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });

    svg.appendChild(circle);
  }

  container.appendChild(svg);
}

function updateCommitGraph(activeIdx, total) {
  const dots = document.querySelectorAll('.commit-graph__dot');
  const progress = document.getElementById('graph-progress');

  dots.forEach((dot, i) => {
    if (i < activeIdx) {
      dot.setAttribute('fill', 'var(--text-tertiary)');
      dot.setAttribute('stroke', 'var(--text-tertiary)');
    } else if (i === activeIdx) {
      dot.setAttribute('fill', 'var(--accent-primary)');
      dot.setAttribute('stroke', 'var(--accent-primary)');
    } else {
      dot.setAttribute('fill', 'var(--surface-primary)');
      dot.setAttribute('stroke', 'var(--border-subtle)');
    }
  });

  if (progress && total > 1) {
    const endY = 50 + (activeIdx / (total - 1)) * 900;
    progress.setAttribute('y2', String(endY));
  }
}

/* ========================================
   SMOOTH SCROLL for NAV LINKS
   ======================================== */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ========================================
   INIT
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  initScrollProgress();
  initHeroAnimation();
  initHeroCursor();
  initScrollReveal();
  initCommitGraph();
  initSectionTracking();
  initSmoothScroll();
});

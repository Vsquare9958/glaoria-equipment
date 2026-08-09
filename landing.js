(function () {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress bar */
  const progressBar = document.getElementById('scrollProgress');
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const scrolled = max > 0 ? h.scrollTop / max : 0;
    progressBar.style.transform = 'scaleX(' + scrolled + ')';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Nav elevation on scroll */
  const nav = document.querySelector('nav');
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 12);
  }
  document.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* Custom cursor (pointer devices only) */
  if (!isTouch && !reduceMotion) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    document.body.classList.add('custom-cursor');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, .card, .tier, .viz-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });
  }

  /* Spotlight glow tracking cursor on cards */
  document.querySelectorAll('.card, .tier, .stat-band').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* Magnetic buttons */
  if (!isTouch) {
    document.querySelectorAll('.nav-cta, .closing-cta, .tier-cta').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.35 + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* Hero visual tilt + reticle */
  const slot = document.getElementById('visualSlot');
  const reticle = document.getElementById('reticle');
  if (slot && !isTouch && !reduceMotion) {
    slot.addEventListener('mousemove', function (e) {
      const r = slot.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const rotY = ((px / r.width) - 0.5) * 10;
      const rotX = ((py / r.height) - 0.5) * -10;
      slot.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
      if (reticle) {
        reticle.style.left = px + 'px';
        reticle.style.top = py + 'px';
      }
    });
    slot.addEventListener('mouseleave', function () { slot.style.transform = ''; });
  }

  /* Scroll reveal */
  const revealSelector = '.card, .tier, .viz-card, .section-head, .stat-band';
  const revealEls = document.querySelectorAll(revealSelector);
  revealEls.forEach(function (el) { el.classList.add('reveal-target'); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const delay = Array.prototype.indexOf.call(entry.target.parentElement.children, entry.target) % 6;
          entry.target.style.transitionDelay = (delay * 70) + 'ms';
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* Number counters */
  function animateCount(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!match) return;
    const prefix = match[1], numStr = match[2], suffix = match[3];
    const hasComma = numStr.indexOf(',') !== -1;
    const target = parseFloat(numStr.replace(/,/g, ''));
    const decimals = (numStr.split('.')[1] || '').length;
    const dur = 1300;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      let val = target * eased;
      let out = decimals ? val.toFixed(decimals) : Math.round(val).toString();
      if (hasComma) {
        out = Number(out).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      }
      el.textContent = prefix + out + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    }
    if (reduceMotion) { el.textContent = raw; return; }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('.count');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* Terminal decode text effect */
  const decodeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function decode(el) {
    const final = el.textContent;
    let frame = 0;
    const totalFrames = final.length * 3;
    function step() {
      let out = '';
      for (let i = 0; i < final.length; i++) {
        if (final[i] === ' ') { out += ' '; continue; }
        out += (i < frame / 3) ? final[i] : decodeChars[Math.floor(Math.random() * decodeChars.length)];
      }
      el.textContent = out;
      frame++;
      if (frame <= totalFrames) requestAnimationFrame(step);
      else el.textContent = final;
    }
    step();
  }
  if (!reduceMotion) {
    document.querySelectorAll('.decode').forEach(function (el) {
      setTimeout(function () { decode(el); }, 250);
    });
    const navLogo = document.getElementById('navLogo');
    if (navLogo) {
      const finalHTML = navLogo.innerHTML;
      const finalText = navLogo.textContent;
      setTimeout(function () {
        let frame = 0;
        const totalFrames = finalText.length * 2;
        (function step() {
          let out = '';
          for (let i = 0; i < finalText.length; i++) {
            out += (i < frame / 2) ? finalText[i] : decodeChars[Math.floor(Math.random() * decodeChars.length)];
          }
          navLogo.textContent = out;
          frame++;
          if (frame <= totalFrames) requestAnimationFrame(step);
          else navLogo.innerHTML = finalHTML;
        })();
      }, 100);
    }
  }

  /* Side dot navigation */
  const sections = document.querySelectorAll('main section[id]');
  const dotNav = document.getElementById('dotNav');
  if (dotNav && sections.length) {
    sections.forEach(function (sec) {
      const dot = document.createElement('a');
      dot.href = '#' + sec.id;
      dot.className = 'dot';
      dot.setAttribute('aria-label', sec.id);
      dotNav.appendChild(dot);
    });
    const dots = dotNav.querySelectorAll('.dot');
    if ('IntersectionObserver' in window) {
      const sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          const idx = Array.prototype.indexOf.call(sections, entry.target);
          if (entry.isIntersecting && idx > -1) {
            dots.forEach(function (d) { d.classList.remove('active'); });
            dots[idx].classList.add('active');
          }
        });
      }, { threshold: 0.5 });
      sections.forEach(function (s) { sio.observe(s); });
    }
  }
})();

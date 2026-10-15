'use strict';
(() => {
  const $ = (s, parent = document) => parent.querySelector(s);
  const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
  const { t } = window.portfolioI18n;
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const chapterElements = $$('.chapter');
  const chapterLinks = $$('.chapter-nav a');
  const header = $('.site-header');
  let motionPaused = reducedMotion.matches;
  let activeChapter = -1;
  let pointer = { x: 0, y: 0 };
  let smoothPointer = { x: 0, y: 0 };
  let toastTimer;

  function toast(message) {
    clearTimeout(toastTimer);
    const element = $('.toast');
    element.textContent = t(message);
    element.classList.add('visible');
    toastTimer = setTimeout(() => element.classList.remove('visible'), 3500);
  }

  // Chapters follow the reading position, so scrolling and explicit navigation agree.
  function updateScroll() {
    const y = window.scrollY;
    const available = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress span').style.width = `${available > 0 ? y / available * 100 : 0}%`;
    header.classList.toggle('scrolled', y > 60);
    let selected = 0;
    const readingLine = Math.min(innerHeight * .45, 340);
    chapterElements.forEach((element, index) => {
      if (element.getBoundingClientRect().top < readingLine) selected = index;
    });
    if (selected !== activeChapter) {
      activeChapter = selected;
      chapterLinks.forEach((link, index) => {
        link.classList.toggle('active', index === selected);
        if (index === selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      $('#chapter-number').textContent = String(selected).padStart(2, '0');
    }
    const heroProgress = Math.min(y / innerHeight, 1);
    root.style.setProperty('--scene-y', `${-heroProgress * 24}px`);
    root.style.setProperty('--scene-scale', String(1.03 + heroProgress * .04));
  }
  let scrollScheduled = false;
  addEventListener('scroll', () => {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(() => { updateScroll(); scrollScheduled = false; });
    }
  }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .13 });
  $$('.chapter:not(.hero)').forEach(element => revealObserver.observe(element));

  const menuButton = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  function closeMenu() {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', t('Abrir menú'));
  }
  menuButton.addEventListener('click', () => {
    const opening = mobileMenu.hidden;
    mobileMenu.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', t(opening ? 'Cerrar menú' : 'Abrir menú'));
  });
  $$('#mobile-menu a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileMenu.hidden) { closeMenu(); menuButton.focus(); }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  // Filters preserve the original order and leave one source of truth for project counts.
  const filterButtons = $$('.project-filters button');
  const projectCards = $$('.project-card');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(item => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    let count = 0;
    projectCards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    updateProjectCount();
  }));
  function updateProjectCount() {
    const real = projectCards.filter(card => !card.hidden && card.dataset.project && card.dataset.example === 'false').length;
    const collections = projectCards.filter(card => !card.hidden && card.dataset.category === 'tools').length;
    const examples = projectCards.filter(card => !card.hidden && card.dataset.project && card.dataset.example !== 'false').length;
    $('.project-counter').textContent = [real ? t(real === 1 ? '{count} proyecto real' : '{count} proyectos reales', {count: real}) : '', collections ? t(collections === 1 ? '{count} colección' : '{count} colecciones', {count: collections}) : '', examples ? t(examples === 1 ? '{count} ejemplo' : '{count} ejemplos', {count: examples}) : ''].filter(Boolean).join(' · ');
  }


  const tabs = $$('.journey-tabs [role=tab]');
  function selectTab(tab, moveFocus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let destination;
      if (event.key === 'ArrowRight') destination = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') destination = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === 'Home') destination = tabs[0];
      if (event.key === 'End') destination = tabs[tabs.length - 1];
      if (destination) { event.preventDefault(); selectTab(destination, true); }
    });
  });

  $('.copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('davidlopezborrego025@gmail.com');
      toast('Email copiado. El siguiente capítulo empieza contigo.');
    } catch {
      toast('No se pudo copiar. Email: davidlopezborrego025@gmail.com');
    }
  });

  // Motion has a dedicated control, also honoring changes to the system preference.
  const motionButton = $('#motion-toggle');
  function setMotion(paused) {
    motionPaused = paused;
    document.body.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', t(paused ? 'Activar efectos de movimiento' : 'Pausar efectos de movimiento'));
    $('use', motionButton).setAttribute('href', paused ? '#i-play' : '#i-pause');
    $('span', motionButton).textContent = t(paused ? 'ACTIVAR ATMÓSFERA' : 'PAUSAR ATMÓSFERA');
    if (paused) { root.style.setProperty('--px', '0'); root.style.setProperty('--py', '0'); }
    drawAtmosphere(0);
    if (dialog.open) renderProject(performance.now());
    document.dispatchEvent(new CustomEvent('portfolio-motion', {detail:{paused}}));
  }
  motionButton.addEventListener('click', () => setMotion(!motionPaused));
  reducedMotion.addEventListener('change', event => setMotion(event.matches));
  addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') pointer = { x: (event.clientX / innerWidth - .5) * 2, y: (event.clientY / innerHeight - .5) * 2 };
  }, { passive: true });

  // A quiet, original ambient score. It is created only after an explicit click.
  let audioContext;
  let audioMaster;
  let soundEnabled = false;
  const soundButton = $('.sound-toggle');
  function createAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Audio no disponible');
    audioContext = new Audio();
    audioMaster = audioContext.createGain();
    audioMaster.gain.value = 0;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 480;
    audioMaster.connect(filter); filter.connect(audioContext.destination);
    [55, 82.4069, 110, 164.8138, 220].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index > 2 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index % 2 ? 4 : -3;
      gain.gain.value = index === 0 ? .26 : .09;
      oscillator.connect(gain); gain.connect(audioMaster); oscillator.start();
    });
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
    const channel = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < channel.length; i++) {
      previous = (previous + (Math.random() * 2 - 1) * .025) / 1.025;
      channel[i] = previous * .4;
    }
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer; noise.loop = true; noise.connect(audioMaster); noise.start();
  }
  soundButton.addEventListener('click', async () => {
    soundButton.disabled = true;
    try {
      if (!audioContext) createAudio();
      await audioContext.resume();
      soundEnabled = !soundEnabled;
      audioMaster.gain.cancelScheduledValues(audioContext.currentTime);
      audioMaster.gain.setTargetAtTime(soundEnabled ? .2 : 0, audioContext.currentTime, .4);
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      soundButton.setAttribute('aria-label', t(soundEnabled ? 'Desactivar sonido ambiental' : 'Activar sonido ambiental'));
      $('.sound-label').textContent = t(soundEnabled ? 'SONIDO ON' : 'SONIDO OFF');
    } catch {
      toast('Tu navegador no permite activar el sonido. Puedes seguir explorando.');
    } finally { soundButton.disabled = false; }
  });
  document.addEventListener('visibilitychange', () => {
    if (audioContext) {
      if (document.hidden) audioContext.suspend().catch(() => {});
      else if (soundEnabled) audioContext.resume().catch(() => {});
    }
  });

  const atmosphericCanvas = $('#atmosphere');
  const atmosphericContext = atmosphericCanvas.getContext('2d');
  const particles = Array.from({ length: 46 }, (_, index) => ({
    x: ((index * 137.508) % 997) / 997,
    y: ((index * 83.32 + 43) % 991) / 991,
    size: .4 + (index % 3) * .35,
    speed: .5 + (index % 5) * .18,
    alpha: .12 + (index % 4) * .08
  }));
  let screenWidth = innerWidth;
  let screenHeight = innerHeight;
  function resizeAtmosphere() {
    screenWidth = innerWidth; screenHeight = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    atmosphericCanvas.width = Math.floor(screenWidth * dpr);
    atmosphericCanvas.height = Math.floor(screenHeight * dpr);
    atmosphericContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAtmosphere(0);
  }
  function drawAtmosphere(time) {
    atmosphericContext.clearRect(0, 0, screenWidth, screenHeight);
    if (motionPaused) return;
    particles.forEach(particle => {
      const x = ((particle.x + time * .000004 * particle.speed) % 1) * screenWidth;
      const y = ((particle.y - time * .0000015 * particle.speed + 10) % 1) * screenHeight;
      atmosphericContext.beginPath();
      atmosphericContext.fillStyle = `rgba(236,199,142,${particle.alpha})`;
      atmosphericContext.arc(x, y, particle.size, 0, Math.PI * 2);
      atmosphericContext.fill();
    });
  }
  addEventListener('resize', resizeAtmosphere, { passive: true });

  const projects = {
    dalogic: {
      title: 'DaLogic', art: 'DaLogic', example: false,
      description: 'Proyecto personal de 2.º de Bachillerato durante mi etapa en el Colegio Claver. Un editor gráfico de circuitos lógicos digitales para diseñar y simular circuitos, obtener tablas de verdad y guardar circuitos integrados reutilizables.',
      tags: ['Proyecto personal', 'Python', 'PySide6', '2.º de Bachillerato']
    },
    umbral: {
      title: 'Umbral', art: 'UMBRAL',
      description: 'Este portafolio es el escenario de este ejemplo: un paisaje cinematográfico, navegación por capítulos y una atmósfera que responde al movimiento. Una forma de convertir la exploración de proyectos en una pequeña aventura.',
      tags: ['HTML · CSS · JavaScript', 'Canvas', 'Diseño adaptable', 'Audio ambiental']
    },
    orbita: {
      title: 'Órbita', art: 'ÓRBITA',
      description: 'Un pequeño laboratorio de movimiento generativo. Cientos de puntos dibujan una esfera en el espacio, mientras varias órbitas se cruzan a su alrededor. Mueve el cursor o toca la escena para cambiar el punto de vista.',
      tags: ['Experimento de ejemplo', 'Canvas 2D', 'Proyección 3D', 'Arte generativo']
    },
    nexo: {
      title: 'Nexo', art: 'NEXO',
      description: 'Una red viva de puntos y conexiones. Las formas cambian con el tiempo y reaccionan al cursor o al tacto. Un ejemplo interactivo del espacio que ocuparán los proyectos reales de GitHub.',
      tags: ['Experimento de ejemplo', 'Canvas 2D', 'Interacción', 'Geometría']
    }
  };
  const dialog = $('#project-dialog');
  const projectCanvas = $('#project-canvas');
  const projectContext = projectCanvas.getContext('2d');
  const environment = new Image();
  environment.src = 'assets/umbral-world-v2.webp';
  let currentProject = 'umbral';
  let dialogOpener;
  let projectWidth = 900;
  let projectHeight = 330;
  let projectPointer = { x: 0, y: 0 };
  function resizeProject() {
    const bounds = projectCanvas.getBoundingClientRect();
    projectWidth = bounds.width; projectHeight = bounds.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    projectCanvas.width = Math.floor(projectWidth * dpr);
    projectCanvas.height = Math.floor(projectHeight * dpr);
    projectContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderProject(performance.now());
  }
  projectCards.filter(card => card.dataset.project).forEach(card => card.addEventListener('click', () => {
    currentProject = card.dataset.project;
    dialogOpener = card;
    updateProjectCopy();
    projectPointer = { x: 0, y: 0 };
    dialog.showModal();
    resizeProject();
  }));
  function updateProjectCopy() {
    const project = projects[currentProject];
    $('#dialog-title').textContent = project.title;
    $('.dialog-visual-title').textContent = project.art;
    $('.dialog-description').textContent = t(project.description);
    $('.dialog-demo').textContent = t(project.example === false ? 'PROYECTO PERSONAL · COLEGIO CLAVER · 2.º BACHILLERATO' : 'EXPERIMENTO DE EJEMPLO');
    $('.dialog-repository').hidden = project.example !== false;
    $('.dialog-bottom > p').textContent = t(project.example === false ? 'Un proyecto durante mi etapa en el Claver.' : 'Experimento de ejemplo del portafolio.');
    $('.dialog-tags').replaceChildren(...project.tags.map(tag => {
      const element = document.createElement('span'); element.textContent = t(tag); return element;
    }));
  }
  function closeProject() { dialog.close(); }
  $('.dialog-close').addEventListener('click', closeProject);
  $('.dialog-return').addEventListener('click', closeProject);
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProject();
  });
  dialog.addEventListener('close', () => { if (dialogOpener) dialogOpener.focus({ preventScroll: true }); });
  projectCanvas.addEventListener('pointermove', event => {
    const rect = projectCanvas.getBoundingClientRect();
    projectPointer = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 };
  }, { passive: true });
  projectCanvas.addEventListener('pointerdown', event => {
    const rect = projectCanvas.getBoundingClientRect();
    projectPointer = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 };
    if (motionPaused) renderProject(0);
  }, { passive: true });
  addEventListener('resize', () => { if (dialog.open) resizeProject(); }, { passive: true });

  function renderProject(time) {
    const ctx = projectContext;
    const w = projectWidth, h = projectHeight;
    if (!w || !h) return;
    const t = motionPaused ? 0 : time * .00018;
    ctx.fillStyle = currentProject === 'nexo' ? '#241e13' : '#131b14';
    ctx.fillRect(0, 0, w, h);
    if (currentProject === 'dalogic') {
      const cx=w*.64, cy=h*.45, unit=Math.min(w*.22,h*.6);
      ctx.strokeStyle='#c5b47e';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(cx-unit,cy-unit*.35);ctx.lineTo(cx-unit*.3,cy-unit*.35);ctx.lineTo(cx-unit*.3,cy-unit*.15);ctx.lineTo(cx,cy-unit*.15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx-unit,cy+unit*.35);ctx.lineTo(cx-unit*.3,cy+unit*.35);ctx.lineTo(cx-unit*.3,cy+unit*.15);ctx.lineTo(cx,cy+unit*.15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx,cy-unit*.35);ctx.lineTo(cx+unit*.25,cy-unit*.35);ctx.arc(cx+unit*.25,cy,unit*.35,-Math.PI/2,Math.PI/2);ctx.lineTo(cx,cy+unit*.35);ctx.closePath();ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx+unit*.6,cy);ctx.lineTo(cx+unit,cy);ctx.stroke();
      ctx.fillStyle='#e5b77d';ctx.beginPath();ctx.arc(cx+unit,cy,5,0,Math.PI*2);ctx.fill();
      ctx.font='11px DM,sans-serif';ctx.fillStyle='#d1d6b9';ctx.fillText('AND',cx+unit*.15,cy+4);
    } else if (currentProject === 'umbral') {
      if (environment.complete && environment.naturalWidth) {
        const scale = Math.max(w / environment.width, h / environment.height) * (1.05 + Math.sin(t * .4) * .015);
        const iw = environment.width * scale, ih = environment.height * scale;
        ctx.drawImage(environment, (w - iw) / 2 + projectPointer.x * 10, (h - ih) / 2 + projectPointer.y * 8, iw, ih);
      }
      const shade = ctx.createLinearGradient(0, h, 0, 0);
      shade.addColorStop(0, '#0b110cdd'); shade.addColorStop(.7, '#0b110c00');
      ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
    } else if (currentProject === 'orbita') {
      const radius = Math.min(h * .38, w * .27);
      const cx = w * .62, cy = h * .45;
      const rotation = t + projectPointer.x * .9;
      for (let i = 0; i < 620; i++) {
        const y = 1 - i / 619 * 2;
        const r = Math.sqrt(1 - y * y);
        const angle = i * 2.399963 + rotation;
        let x = Math.cos(angle) * r;
        let z = Math.sin(angle) * r;
        const tilt = projectPointer.y * .55 + .2;
        const ry = y * Math.cos(tilt) - z * Math.sin(tilt);
        z = y * Math.sin(tilt) + z * Math.cos(tilt);
        const depth = (z + 1) / 2;
        ctx.fillStyle = `rgba(231,212,169,${.14 + depth * .75})`;
        ctx.beginPath();ctx.arc(cx + x * radius, cy + ry * radius, .45 + depth, 0, Math.PI * 2);ctx.fill();
      }
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = `rgba(222,194,138,${.23 + k * .08})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * (1.3 + k * .17), radius * (.23 + k * .11), -.5 + k * .5 + projectPointer.y * .2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const points = [];
      const centerX = w * .6 + projectPointer.x * 35;
      const centerY = h * .46 + projectPointer.y * 25;
      for (let i = 0; i < 80; i++) {
        const a = i * 2.39996 + t * .35;
        const r = Math.sqrt(i / 80) * Math.min(h * .65, w * .38);
        points.push({ x: centerX + Math.cos(a) * r + Math.sin(t * 2 + i) * 9, y: centerY + Math.sin(a) * r * .7 + Math.cos(t * 1.4 + i) * 12 });
      }
      points.forEach((point, i) => {
        for (let j = i + 1; j < points.length; j++) {
          const next = points[j];
          const distance = Math.hypot(point.x - next.x, point.y - next.y);
          if (distance < 66) {
            ctx.strokeStyle = `rgba(230,184,120,${(1 - distance / 66) * .55})`;
            ctx.beginPath();ctx.moveTo(point.x, point.y);ctx.lineTo(next.x, next.y);ctx.stroke();
          }
        }
        ctx.fillStyle = '#e5b77d';ctx.beginPath();ctx.arc(point.x, point.y, 1.6, 0, Math.PI * 2);ctx.fill();
      });
    }
  }

  let lastFrame = 0;
  function animate(time) {
    requestAnimationFrame(animate);
    if (document.hidden || motionPaused || time - lastFrame < 32) return;
    lastFrame = time;
    smoothPointer.x += (pointer.x - smoothPointer.x) * .035;
    smoothPointer.y += (pointer.y - smoothPointer.y) * .035;
    root.style.setProperty('--px', smoothPointer.x.toFixed(4));
    root.style.setProperty('--py', smoothPointer.y.toFixed(4));
    if (activeChapter === 0 || activeChapter === chapterElements.length - 1) drawAtmosphere(time);
    else atmosphericContext.clearRect(0, 0, screenWidth, screenHeight);
    if (dialog.open) renderProject(time);
  }
  document.addEventListener('portfolio-language', () => {
    menuButton.setAttribute('aria-label', t(mobileMenu.hidden ? 'Abrir menú' : 'Cerrar menú'));
    setMotion(motionPaused);
    soundButton.setAttribute('aria-label', t(soundEnabled ? 'Desactivar sonido ambiental' : 'Activar sonido ambiental'));
    $('.sound-label').textContent = t(soundEnabled ? 'SONIDO ON' : 'SONIDO OFF');
    updateProjectCount();
    if (dialog.open) updateProjectCopy();
    $('.toast').classList.remove('visible');
  });
  menuButton.setAttribute('aria-label', t('Abrir menú'));
  soundButton.setAttribute('aria-label', t('Activar sonido ambiental'));
  $('.sound-label').textContent = t('SONIDO OFF');
  updateProjectCount();
  resizeAtmosphere();
  setMotion(motionPaused);
  requestAnimationFrame(animate);
})();

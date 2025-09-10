// Boot after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll (Lenis) — guard if missing
  let lenis = null;
  try {
    if (window.Lenis) {
      lenis = new window.Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } catch {}

  // GSAP plugins — guard if missing
  const hasGSAP = typeof window.gsap !== 'undefined';
  const gs = hasGSAP ? window.gsap : { from: () => {}, to: () => {}, fromTo: () => {} };
  try { if (hasGSAP && window.ScrollTrigger) gs.registerPlugin(window.ScrollTrigger); } catch {}

// Canvas starfield background
(function () {
  const canvas = document.getElementById('bg-stars');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize); resize();
  function makeStars(n = 200) {
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 0.8 + 0.2,
      r: Math.random() * 1.4 + 0.3,
    }));
  }
  makeStars(260);
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const alpha = 0.35 + 0.65 * s.z;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // Parallax drift
      s.x += 0.02 * s.z; s.y += 0.015 * s.z;
      if (s.x > W) s.x = 0; if (s.y > H) s.y = 0;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// Reveal animations
gs.from('.mega', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' });
gs.from('.chip', { y: 12, opacity: 0, duration: 0.6, stagger: 0.06, delay: 0.2, ease: 'power3.out' });
gs.to('.hero-orb', { yPercent: 12, scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

// Scroll reveals
document.querySelectorAll('.section-head').forEach((el) => {
  gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 85%' }, y: 18, opacity: 0, duration: 0.6, ease: 'power2.out' });
});

// Parse and build from Markdown (prefere portfolio.md; fallback md/portfolio-*.md)
async function loadMarkdown() {
  // 1) Try single portfolio.md first (more conveniente para edições rápidas)
  try {
    const res = await fetch('portfolio.md', { cache: 'no-cache' });
    if (res.ok) {
      const text = await res.text();
      if (/#\s+/.test(text) && text.trim().length > 40) {
        buildFromMarkdown(text);
        return;
      }
    }
  } catch {}

  // 2) Fallback: md parts concatenation
  const parts = [];
  for (let i = 1; i <= 10; i++) {
    const url = `md/portfolio-${i}.md`;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) break;
      parts.push(await res.text());
    } catch { break; }
  }
  if (parts.length) {
    buildFromMarkdown(parts.join("\n\n"));
    return;
  }

  // 3) Placeholder
  console.warn('Falha ao carregar markdown. Usando placeholder.');
  buildFromMarkdown(`# DADOS INSTITUCIONAIS\n\n## Introdução\nA Cogmo Technology aplica IA com rigor.\n\n# Bot de Cobrança via WhatsApp com IA\n![alt](wpp-bot.png)\n## Resumo\nSolução conversacional empática que acelera regularização com menor custo.`);
}

function splitTopSections(md) {
  const sections = [];
  const re = /(^|\n)#[ \t]+(.+?)\s*\n([\s\S]*?)(?=\n#[ \t]+|$)/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    const title = m[2].trim();
    const body = m[3].trim();
    sections.push({ title, body });
  }
  return sections;
}

function extractImage(markdown) {
  const m = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return m ? m[1] : null;
}

function extractResumo(markdown) {
  const m = markdown.match(/##\s*resumo\s*([\s\S]*?)(?=\n##\s|$)/i);
  return m ? m[1].trim() : null;
}

function mdRender(text) {
  try { if (window.marked && typeof window.marked.parse === 'function') return window.marked.parse(text); } catch {}
  // Fallback: minimal line breaks
  return text.replace(/\n\n/g, '</p><p>').replace(/^/,'<p>').replace(/$/,'</p>').replace(/\n/g, '<br>');
}

function buildEmpresa(companyBody) {
  const container = document.getElementById('empresa-accordions');
  // Split by level-2 headings
  const items = companyBody.split(/\n(?=##\s)/g).filter(Boolean);
  items.forEach((raw, idx) => {
    const m = raw.match(/^##\s+(.+?)\s*\n([\s\S]*)$/);
    if (!m) return;
    const [_, title, content] = m;
    const item = document.createElement('div');
    item.className = 'acc-item';
    item.innerHTML = `
      <button class="acc-btn" aria-expanded="${idx === 0 ? 'true' : 'false'}">
        <strong>${title}</strong>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="acc-panel"><div class="acc-panel-inner">${mdRender(content)}</div></div>
    `;
    container.appendChild(item);
  });
  // Setup accordion heights
  container.querySelectorAll('.acc-item').forEach((it, idx) => {
    const btn = it.querySelector('.acc-btn');
    const panel = it.querySelector('.acc-panel');
    function setHeight(open) {
      if (open) {
        panel.style.height = panel.firstElementChild.scrollHeight + 'px';
      } else {
        panel.style.height = '0px';
      }
    }
    setHeight(idx === 0);
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      setHeight(!expanded);
    });
  });
}

function buildProjetos(sections, outros) {
  const grid = document.getElementById('projetos-grid');
  const detailsRoot = document.getElementById('projetos-detalhes');
  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  document.body.appendChild(overlay);

  const projects = sections.map(({ title, body }) => {
    const img = extractImage(body);
    const resumo = extractResumo(body);
    return {
      title,
      img,
      resumo: resumo ? mdRender(resumo) : '',
      html: mdRender(`# ${title}\n\n${body}`),
    };
  });

  if (!projects.length) {
    const warn = document.createElement('div');
    warn.style.color = 'var(--muted)';
    warn.style.padding = '8px';
    warn.textContent = 'Nenhum projeto encontrado. Verifique os arquivos em md/ ou portfolio.md.';
    grid.appendChild(warn);
    return;
  }

  projects.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('data-tilt', '');
    card.setAttribute('data-tilt-max', '8');
    card.setAttribute('data-tilt-speed', '400');
    const parallaxDepth = 8 + Math.round(Math.random() * 16);
    card.innerHTML = `
      <div class="thumb">${p.img ? `<img src="${p.img}" alt="${p.title}" loading="lazy">` : '<span>Sem imagem</span>'}</div>
      <div class="body">
        <h3>${p.title}</h3>
        <div class="excerpt">${p.resumo || '—'}</div>
        <a class="more" href="#">Ver detalhes →</a>
      </div>
    `;
    grid.appendChild(card);

    // Detail view element
    const detail = document.createElement('section');
    detail.className = 'detail';
    detail.innerHTML = `
      <header>
        <h3>${p.title}</h3>
        <button class="btn-close" aria-label="Fechar">Fechar</button>
      </header>
      <div class="content">${p.html}</div>
    `;
    detailsRoot.appendChild(detail);

    const open = (e) => {
      e?.preventDefault();
      overlay.style.display = 'block';
      detail.style.display = 'block';
      gsap.fromTo(detail, { y: 20, opacity: 0 }, { duration: 0.35, y: 0, opacity: 1, ease: 'power2.out' });
    };
    const close = () => {
      gsap.to(detail, { duration: 0.25, y: 10, opacity: 0, ease: 'power2.in', onComplete: () => {
        detail.style.display = 'none'; overlay.style.display = 'none';
      }});
    };
    card.querySelector('.more').addEventListener('click', open);
    detail.querySelector('.btn-close').addEventListener('click', close);
    overlay.addEventListener('click', close);
  });

  // Tilt
  try { if (window.VanillaTilt) window.VanillaTilt.init(document.querySelectorAll('.card')); } catch {}

  // Reveal cards
  gs.from('.card', {
    scrollTrigger: { trigger: grid, start: 'top 85%' },
    y: 18,
    opacity: 0,
    duration: 0.6,
    stagger: 0.06,
    ease: 'power2.out'
  });

  // Parallax inside thumbs
  document.querySelectorAll('.card .thumb img').forEach((img) => {
    gs.to(img, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: img.closest('.card'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  });

  // Append "E outros" as a full-width block after grid
  if (outros && outros.body) {
    const outrosEl = document.createElement('div');
    outrosEl.className = 'projetos-outros';
    outrosEl.innerHTML = mdRender(outros.body);
    grid.parentElement.appendChild(outrosEl);
  }

  // Masonry sizing for CSS Grid (span rows based on height)
  function resizeMasonry() {
    const style = getComputedStyle(grid);
    const row = parseInt(style.getPropertyValue('grid-auto-rows')) || 8;
    const gap = parseInt(style.getPropertyValue('gap')) || 0;
    grid.querySelectorAll('.card').forEach((card) => {
      card.style.gridRowEnd = 'span 1';
      const h = card.getBoundingClientRect().height;
      const span = Math.ceil((h + gap) / (row + gap));
      card.style.gridRowEnd = `span ${span}`;
    });
  }
  // Run after images load
  const imgs = grid.querySelectorAll('.card .thumb img');
  let loaded = 0; const tryResize = () => { loaded++; if (loaded >= imgs.length) resizeMasonry(); };
  if (imgs.length) imgs.forEach((im) => { if (im.complete) tryResize(); else im.addEventListener('load', tryResize); });
  else resizeMasonry();
  window.addEventListener('resize', () => { resizeMasonry(); });
}

function buildFromMarkdown(md) {
  const sections = splitTopSections(md);
  if (!sections.length) return;
  // Company section = title includes DADOS INSTITUCIONAIS or first section
  const companyIdx = sections.findIndex(s => /DADOS\s+INSTITUCIONAIS/i.test(s.title));
  const company = companyIdx >= 0 ? sections.splice(companyIdx, 1)[0] : sections.shift();
  buildEmpresa(company.body || '');

  // Separate "E outros" to render as full-width text after cards
  let outros = null;
  const iOutros = sections.findIndex(s => /^E\s+outros/i.test(s.title));
  if (iOutros >= 0) outros = sections.splice(iOutros, 1)[0];

  // Remaining sections considered projects
  buildProjetos(sections, outros);
}

// Kickoff
loadMarkdown();
});

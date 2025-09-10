# Deploy

## GitHub Pages (projeto)

1. Faça push deste diretório para um repositório GitHub.
2. Em Settings → Pages, selecione:
   - Source: Deploy from a branch
   - Branch: `main` (ou `master`) / root
3. Aguarde a publicação em `https://<seu-usuario>.github.io/<seu-repo>/`.

Observações
- Arquivos referenciados são relativos, então funcionam em subpath (`/<repo>/`).
- `.nojekyll` incluso para evitar processamento do Jekyll.

## Netlify (zero build)

1. Crie um site no Netlify e faça “Deploy site” apontando para este diretório.
2. `netlify.toml` já define `publish = "."` (sem build).
3. Opcional: configure domínio customizado e HTTPS.

## Estrutura de conteúdo

- Markdown dividido em partes: `md/portfolio-1.md` … `md/portfolio-7.md`.
- Imagens: coloque-as no root (ex.: `wpp-bot.png`, `conteiner_tagged.png`, `cogmotion.png`, `aurea.png`, `peqii.png`).

## Personalização rápida

- Cores e tema: `styles.css` (variáveis CSS).
- Hero, menu e CTA: `index.html`.
- Comportamentos e animações: `app.js` (GSAP, ScrollTrigger, Lenis, Tilt, Marked).

## Desenvolvimento local

- Abra `index.html` no navegador. Para evitar restrições de `fetch` com `file://`, use um servidor estático simples:
  - Python: `python -m http.server 5500`
  - Node: `npx serve .`
  - Depois acesse `http://localhost:5500`.

// -------------------------
// Project Saturn — Gist Inhaler
// Fetches index.html + main.css from a Gist and renders them
// in the current page, rewriting relative paths to Gist raw URLs.
// -------------------------

(function () {
  const GIST = 'https://gist.githubusercontent.com/skabajah/ac96fc383152824c0d1951aab3f4ad0a/raw/';

  // Hide until ready (prevents flash of unstyled content)
  document.documentElement.style.visibility = 'hidden';

  // --- 1. CSS: fetch text, rewrite url() refs, inject as <style> ---
  function injectCSS() {
    return fetch(GIST + 'main.css')
      .then(r => r.text())
      .then(css => {
        const fixed = css.replace(
          /url\(['"]?(?!https?:|data:)([^'")]+)['"]?\)/g,
          (_, p) => `url('${GIST}${p}')`
        );
        const style = document.createElement('style');
        style.textContent = fixed;
        document.head.appendChild(style);
      });
  }

  // --- 2. HTML: fetch, parse, inject head links + body + scripts ---
  function injectHTML() {
    return fetch(GIST + 'index.html')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // --- <head>: copy links/metas we don't already have ---
        doc.head.querySelectorAll('link, meta, style').forEach(el => {
          const rel  = el.getAttribute('rel');
          const name = el.getAttribute('name');
          const key  = rel || name;
          if (!key) return;

          // Skip if already present in our head
          const existing = rel
            ? document.head.querySelector(`link[rel="${rel}"]`)
            : document.head.querySelector(`meta[name="${name}"]`);
          if (existing) return;

          const clone = el.cloneNode(true);

          // Rewrite relative hrefs (strip "icons/" since Gist is flat)
          if (clone.tagName === 'LINK') {
            const href = clone.getAttribute('href');
            if (href && !/^https?:|^\/\//.test(href)) {
              clone.setAttribute('href', GIST + href.replace(/^icons\//, ''));
            }
          }

          document.head.appendChild(clone);
        });

        // --- <body>: replace content ---
        document.body.innerHTML = doc.body.innerHTML;

        // --- Re-run inline <script> tags (innerHTML doesn't execute them) ---
        doc.body.querySelectorAll('script:not([src])').forEach(old => {
          const s = document.createElement('script');
          s.textContent = old.textContent;
          document.body.appendChild(s);
        });

        // --- Load external <script src> from body ---
        doc.body.querySelectorAll('script[src]').forEach(old => {
          const s = document.createElement('script');
          let src = old.getAttribute('src');
          if (src && !/^https?:|^\/\//.test(src)) src = GIST + src;
          s.src = src;
          if (old.type) s.type = old.type;
          document.body.appendChild(s);
        });

        // --- Load external <script src> from head ---
        doc.head.querySelectorAll('script[src]').forEach(old => {
          const s = document.createElement('script');
          let src = old.getAttribute('src');
          if (src && !/^https?:|^\/\//.test(src)) src = GIST + src;
          s.src = src;
          if (old.type) s.type = old.type;
          document.head.appendChild(s);
        });
      });
  }

  // --- Run ---
  Promise.all([injectCSS(), injectHTML()])
    .then(() => {
      document.documentElement.style.visibility = 'visible';
    })
    .catch(err => {
      console.error('Gist inhaler failed:', err);
      document.documentElement.style.visibility = 'visible';
    });
})();
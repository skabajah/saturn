// =========================================================
// Project Saturn — Gist Inhaler
// Input:  Gist index.html with short <link> and <script src>
// Output: fully expanded inline <style> + <script> in the DOM
// =========================================================

(function () {
  'use strict';

  const GIST = 'https://gist.githubusercontent.com/skabajah/ac96fc383152824c0d1951aab3f4ad0a/raw/';

  document.documentElement.style.visibility = 'hidden';

  // [3] FETCH OVERRIDE
  function installFetchOverride() {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (typeof input === 'string' && !/^https?:|^\/\//.test(input)) {
        input = GIST + input.replace(/^\.\//, '');
      }
      return nativeFetch(input, init);
    };
  }

  // [4] INJECT GIST HTML
  function injectHTML() {
    return fetch(GIST + 'index.html')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // [4a] <head>: process links/metas
        const headPromises = [];

        doc.head.querySelectorAll('link, meta').forEach(el => {
          const rel  = el.getAttribute('rel');
          const name = el.getAttribute('name');
          if (!rel && !name) return;

          const existing = rel
            ? document.head.querySelector(`link[rel="${rel}"]`)
            : document.head.querySelector(`meta[name="${name}"]`);
          if (existing) return;

          // Stylesheet link → fetch CSS, inject as <style>
          if (rel === 'stylesheet') {
            const href = el.getAttribute('href');
            const url = /^https?:|^\/\//.test(href)
              ? href
              : GIST + href.replace(/^icons\//, '');
            headPromises.push(
              fetch(url)
                .then(r => r.text())
                .then(css => {
                  const fixed = css.replace(
                    /url\(['"]?(?!https?:|data:)([^'")]+)['"]?\)/g,
                    (_, p) => `url('${GIST}${p}')`
                  );
                  const s = document.createElement('style');
                  s.textContent = fixed;
                  document.head.appendChild(s);
                })
                .catch(err => console.error('[inhaler] css failed:', url, err))
            );
            return;
          }

          // Other links/metas → copy, rewriting relative hrefs
          const clone = el.cloneNode(true);
          if (clone.tagName === 'LINK') {
            const href = clone.getAttribute('href');
            if (href && !/^https?:|^\/\//.test(href)) {
              clone.setAttribute('href', GIST + href.replace(/^icons\//, ''));
            }
          }
          document.head.appendChild(clone);
        });

        // [4b] <body>: append non-script children
        Array.from(doc.body.children).forEach(el => {
          if (el.tagName === 'SCRIPT') return;
          document.body.appendChild(el.cloneNode(true));
        });

        // [4c] <body>: re-run inline <script> tags
        doc.body.querySelectorAll('script:not([src])').forEach(old => {
          const s = document.createElement('script');
          s.textContent = old.textContent;
          if (old.type) s.type = old.type;
          document.body.appendChild(s);
        });

        // [4d] fetch every <script src> and inject as INLINE <script>
        const externalScripts = [
          ...Array.from(doc.body.querySelectorAll('script[src]')),
          ...Array.from(doc.head.querySelectorAll('script[src]'))
        ];

        const scriptPromises = externalScripts.map(old => {
          let src = old.getAttribute('src');
          if (src && !/^https?:|^\/\//.test(src)) {
            src = GIST + src.replace(/^\.\//, '').replace(/^icons\//, '');
          }
          return fetch(src)
            .then(r => r.text())
            .then(js => {
              const s = document.createElement('script');
              s.textContent = js;
              if (old.type) s.type = old.type;
              document.body.appendChild(s);
            })
            .catch(err => {
              console.error('[inhaler] failed to inline script:', src, err);
            });
        });

        return Promise.all([...headPromises, ...scriptPromises]);
      });
  }

  // [5] REVEAL
  function reveal() {
    document.documentElement.style.visibility = 'visible';
  }

  // [6] RUN
  installFetchOverride();

  injectHTML()
    .then(reveal)
    .catch(err => {
      console.error('[inhaler] failed:', err);
      reveal();
    });
})();